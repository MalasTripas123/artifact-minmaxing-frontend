import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { characterStatsAtLevel } from './character-stats.js';
import { artifactSetBonuses } from './artifact-set-bonuses.js';
import { validateCharacterAndSetCatalog } from '../catalog/character-set-validation.js';
import { resolveCharacter } from '../catalog/model.js';
import { normalizeSources } from '../../../tools/catalog-service.mjs';
import { buildCharacterStats, buildArtifactSets } from '../../../tools/character-set-stats-import.mjs';

const catalog = JSON.parse(await readFile(new URL('../../data/catalog.json', import.meta.url), 'utf8'));
const g = catalog.generated;
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
const character = (id, level, ascension) => characterStatsAtLevel(g.characters[id], g.characterCurves, level, ascension);

test('all character variants have complete legal levels, ascensions and extended level data', () => {
    assert.equal(Object.keys(g.characters).length, 156);
    assert.deepEqual(validateCharacterAndSetCatalog(g), []);
    let combinations = 0;
    for (const c of Object.values(g.characters)) {
        for (const [ascension, stage] of Object.entries(c.progression.ascensions)) {
            for (let level = stage.minLevel; level <= stage.maxLevel; level++) {
                const result = characterStatsAtLevel(c, g.characterCurves, level, Number(ascension));
                assert.ok(Object.values(result.total).every(Number.isFinite));
                assert.ok(result.total.FIGHT_PROP_BASE_HP > 0);
                combinations++;
            }
        }
        for (const extension of c.progression.extraLevels) {
            assert.ok(characterStatsAtLevel(c, g.characterCurves, extension.level, extension.ascension).total.FIGHT_PROP_BASE_ATTACK > 0);
        }
    }
    assert.ok(combinations > 14000);
});

test('character stats retain precise growth, ascension stats and innate baselines separately', () => {
    const first = character('10000002', 1, 0);
    close(first.total.FIGHT_PROP_BASE_HP, 1000.986);
    close(first.total.FIGHT_PROP_BASE_ATTACK, 26.6266);
    close(first.total.FIGHT_PROP_BASE_DEFENSE, 61.0266);
    close(first.total.FIGHT_PROP_CRITICAL, 0.05);
    close(first.total.FIGHT_PROP_CRITICAL_HURT, 0.5);
    close(first.total.FIGHT_PROP_CHARGE_EFFICIENCY, 1);
    const before = character('10000002', 20, 0);
    const after = character('10000002', 20, 1);
    assert.deepEqual(after.growth, before.growth);
    close(after.total.FIGHT_PROP_BASE_HP - before.total.FIGHT_PROP_BASE_HP, 858.255);
    const max = character('10000002', 90, 6);
    assert.equal(Math.round(max.total.FIGHT_PROP_BASE_HP), 12858);
    assert.equal(Math.round(max.total.FIGHT_PROP_BASE_ATTACK), 342);
    assert.equal(Math.round(max.total.FIGHT_PROP_BASE_DEFENSE), 784);
    close(max.ascension.FIGHT_PROP_CRITICAL_HURT, 0.384);
    close(max.total.FIGHT_PROP_CRITICAL_HURT, 0.884);
    close(character('10000035', 90, 6).total.FIGHT_PROP_HEAL_ADD, 0.2215);
});

test('95 and 100 keep ascension six; impossible level/ascension pairs fail', () => {
    close(character('10000002', 95, 6).total.FIGHT_PROP_BASE_ATTACK, 380.5005244);
    close(character('10000002', 100, 6).total.FIGHT_PROP_BASE_ATTACK, 418.9759614);
    assert.deepEqual(character('10000002', 100, 6).ascension, character('10000002', 90, 6).ascension);
    for (const pair of [[21, 0], [19, 1], [91, 6], [99, 6], [95, 5], [100, 7], [101, 6], [0, 0], [20.5, 1]]) assert.throws(() => character('10000002', ...pair), RangeError);
    assert.throws(() => characterStatsAtLevel({}, {}, 1, 0), /unavailable/);
});

test('Nefer and Lauma retain innate mastery at every level and add ascension mastery only once', () => {
    for (const [id, innate] of [['10000122', 100], ['10000119', 200]]) {
        assert.equal(g.characters[id].progression.innateStats.FIGHT_PROP_ELEMENT_MASTERY, innate);
        for (const [stageId, stage] of Object.entries(g.characters[id].progression.ascensions)) {
            for (let level = stage.minLevel; level <= stage.maxLevel; level++) {
                const result = character(id, level, Number(stageId));
                assert.equal(result.innate.FIGHT_PROP_ELEMENT_MASTERY, innate);
                close(result.total.FIGHT_PROP_ELEMENT_MASTERY, innate + (result.ascension.FIGHT_PROP_ELEMENT_MASTERY ?? 0));
            }
        }
        for (const level of [95, 100]) close(character(id, level, 6).total.FIGHT_PROP_ELEMENT_MASTERY, character(id, 90, 6).total.FIGHT_PROP_ELEMENT_MASTERY);
    }
    close(character('10000119', 90, 6).total.FIGHT_PROP_ELEMENT_MASTERY, 315.2);
    assert.equal(character('10000122', 90, 6).total.FIGHT_PROP_ELEMENT_MASTERY, 100);
    assert.equal(character('10000002', 1, 0).innate.FIGHT_PROP_ELEMENT_MASTERY, 0);
    const broken = structuredClone(g);
    delete broken.characters['10000119'].progression.innateStats.FIGHT_PROP_ELEMENT_MASTERY;
    assert.ok(validateCharacterAndSetCatalog(broken).some(message => message.includes('Maestría elemental innata')));
});

test('importer reads mastery from the avatar source, defaults omitted zero and rejects invalid values', () => {
    const avatar = { id: 1, skillDepotId: 101, avatarPromoteId: 1, qualityType: 'QUALITY_PURPLE',
        hpBase: 100, attackBase: 10, defenseBase: 20, critical: 0.05, criticalHurt: 0.5, chargeEfficiency: 1,
        propGrowCurves: ['FIGHT_PROP_BASE_HP', 'FIGHT_PROP_BASE_ATTACK', 'FIGHT_PROP_BASE_DEFENSE'].map(type => ({ type, growCurve: 'curve' })) };
    const source = { avatars: [avatar], depots: [{ id: 101 }],
        curves: [{ level: 1, curveInfos: [{ type: 'curve', arith: 'ARITH_MULTI', GGKIEIJLCJJ: 1 }] }],
        promotes: [{ avatarPromoteId: 1, unlockMaxLevel: 90, addProps: [] }],
        extraLevels: [{ DEJBOJMHHJB: 90, BBPEGJLEEEC: 95 }, { DEJBOJMHHJB: 95, BBPEGJLEEEC: 100 }] };
    const imported = () => buildCharacterStats({ 1: {} }, source, {}).characters[1].progression.innateStats.FIGHT_PROP_ELEMENT_MASTERY;
    assert.equal(imported(), 0);
    for (const value of [0, 100, 200, 75]) { avatar.elementMastery = value; assert.equal(imported(), value); }
    for (const value of [-1, '100', NaN, Infinity]) { avatar.elementMastery = value; assert.throws(imported, /Invalid character innate stat/); }
});

test('Traveler and Manekin variants use their verified shared base, preserving existing UI resolution', () => {
    for (const id of Object.keys(g.characters).filter(id => id.includes('-'))) {
        const base = id.split('-')[0];
        assert.equal(g.characters[id].statsBaseId, base);
        assert.equal(g.characters[id].statsSkillDepotId, Number(id.split('-')[1]));
        assert.deepEqual(character(id, 90, 6), character(base, 90, 6));
    }
    close(character('10000005-504', 90, 6).total.FIGHT_PROP_ATTACK_PERCENT, 0.24);
    // Removing enrichment produces exactly the same display model.
    const original = structuredClone(catalog);
    for (const c of Object.values(original.generated.characters)) {
        for (const key of ['rarity', 'weaponType', 'statsBaseId', 'statsSkillDepotId', 'progression']) delete c[key];
    }
    for (const id of Object.keys(g.characters)) assert.deepEqual(resolveCharacter(catalog, id), resolveCharacter(original, id));
});

test('every set has localized bonuses; all one/two-piece effects have explicit executable data', () => {
    assert.equal(Object.keys(g.artifactSets).length, 65);
    assert.deepEqual(Object.keys(g.artifactSets), Object.keys(g.artifactSetsByLocale.es));
    let twos = 0;
    for (const set of Object.values(g.artifactSets)) for (const b of set.bonuses) {
        assert.ok(b.descriptions.es && b.descriptions.en);
        if (b.pieces <= 2) { assert.equal(b.effectCoverage, 'complete'); assert.ok(b.effects.length); }
        if (b.pieces === 2) twos++;
    }
    assert.equal(twos, 60);
    assert.equal(g.artifactSets[15000], undefined);
    assert.equal(g.artifactSetsSource.excludedSets[0].id, 15000);
});

test('two plus two adds equal stats from distinct sets; four/five pieces apply each threshold once', () => {
    close(artifactSetBonuses(g.artifactSets, { 15001: 2, 15019: 2 }).stats.FIGHT_PROP_ATTACK_PERCENT, 0.36);
    close(artifactSetBonuses(g.artifactSets, { 15017: 2, 15030: 2 }).stats.FIGHT_PROP_HP_PERCENT, 0.4);
    const four = artifactSetBonuses(g.artifactSets, { 15001: 4 });
    close(four.stats.FIGHT_PROP_ATTACK_PERCENT, 0.18);
    assert.deepEqual(four.activeBonuses.map(b => b.pieces), [2, 4]);
    assert.ok(four.unmodelled.some(b => b.pieces === 4));
    assert.deepEqual(artifactSetBonuses(g.artifactSets, { 15001: 5 }), four);
    assert.deepEqual(artifactSetBonuses(g.artifactSets, { 15001: 1 }).stats, {});
    assert.deepEqual(artifactSetBonuses(g.artifactSets, {}).activeBonuses, []);
});

test('flat stats, percentages, elemental damage, resistances and healing are distinct', () => {
    assert.equal(artifactSetBonuses(g.artifactSets, { 10010: 2 }).stats.FIGHT_PROP_HP, 1000);
    assert.equal(artifactSetBonuses(g.artifactSets, { 10011: 2 }).stats.FIGHT_PROP_DEFENSE, 100);
    close(artifactSetBonuses(g.artifactSets, { 10003: 2 }).stats.FIGHT_PROP_DEFENSE_PERCENT, 0.3);
    close(artifactSetBonuses(g.artifactSets, { 15020: 2 }).stats.FIGHT_PROP_CHARGE_EFFICIENCY, 0.2);
    close(artifactSetBonuses(g.artifactSets, { 10005: 2 }).stats.FIGHT_PROP_CRITICAL, 0.12);
    close(artifactSetBonuses(g.artifactSets, { 15025: 2 }).stats.FIGHT_PROP_GRASS_ADD_HURT, 0.15);
    const healing = artifactSetBonuses(g.artifactSets, { 14004: 2, 10013: 2 });
    close(healing.stats.FIGHT_PROP_HEAL_ADD, 0.15);
    close(healing.stats.FIGHT_PROP_HEALED_ADD, 0.2);
    const resistances = artifactSetBonuses(g.artifactSets, { 10004: 2 }).stats;
    assert.equal(Object.keys(resistances).length, 7);
    assert.ok(Object.values(resistances).every(x => x === 0.2));
});

test('scoped damage and conditional two-piece bonuses never become generic stats', () => {
    for (const [id, attacks, value] of [[15007, ['burst'], 0.2], [15031, ['normal', 'charged'], 0.15], [15032, ['skill'], 0.2], [15039, ['plunging'], 0.25]]) {
        const result = artifactSetBonuses(g.artifactSets, { [id]: 2 });
        assert.deepEqual(result.stats, {});
        assert.deepEqual(result.scoped[0].attacks, attacks);
        close(result.scoped[0].value, value);
    }
    const scroll = artifactSetBonuses(g.artifactSets, { 15037: 2 });
    assert.deepEqual(scroll.stats, {});
    assert.equal(scroll.conditional[0].kind, 'energyRestore');
    assert.equal(scroll.conditional[0].value, 6);
    const codex = artifactSetBonuses(g.artifactSets, { 15038: 2 });
    assert.deepEqual(codex.stats, {});
    assert.equal(codex.conditional[0].activation, 'conditional');
    assert.equal(codex.conditional[0].value, 0.15);
    const prayers = artifactSetBonuses(g.artifactSets, { 15009: 1 });
    assert.deepEqual(prayers.stats, {});
    assert.equal(prayers.scoped[0].kind, 'statusDurationReduction');
    assert.equal(prayers.scoped[0].value, 0.4);
});

test('unknown sets and invalid equipment counts fail explicitly', () => {
    for (const counts of [{ 15001: 6 }, { 15001: -1 }, { 15001: 1.5 }, { 15001: 4, 15019: 2 }]) assert.throws(() => artifactSetBonuses(g.artifactSets, counts), RangeError);
    assert.throws(() => artifactSetBonuses(g.artifactSets, { 99999: 2 }), /Unknown/);
});

test('enriched catalog validation detects broken coverage and curves', () => {
    const broken = structuredClone(g);
    delete broken.characterCurves.GROW_CURVE_HP_S5[95];
    delete broken.artifactSets[15001];
    broken.artifactSets[15031].bonuses[0].effectCoverage = 'description-only';
    const errors = validateCharacterAndSetCatalog(broken);
    assert.ok(errors.some(x => x.includes('Curva')));
    assert.ok(errors.some(x => x.includes('Set sin bonos')));
    assert.ok(errors.some(x => x.includes('no modelado')));
});

test('normalization keeps enrichment while refreshing names and assets', () => {
    const fixture = { avatars: { 10000002: { NameTextMapHash: 1 }, 10000003: { NameTextMapHash: 2 } }, relics: { Sets: { 1: { Name: 1 } } }, loc: { es: { 1: 'Uno', 2: 'Dos' }, en: { 1: 'One', 2: 'Two' } }, giLocs: { es: {}, en: {} } };
    const result = normalizeSources(fixture, { ...g, characters: { 10000002: g.characters[10000002] }, artifactSetsByLocale: { es: {} } });
    assert.deepEqual(result.characters[10000002].progression, g.characters[10000002].progression);
    assert.deepEqual(result.artifactSets, g.artifactSets);
    assert.deepEqual(result.characterCurves, g.characterCurves);
});

test('importers fail on missing characters, invalid variants and unmodelled two-piece abilities', () => {
    const source = { avatars: [], depots: [], curves: [], promotes: [], extraLevels: [{ DEJBOJMHHJB: 90, BBPEGJLEEEC: 95 }, { DEJBOJMHHJB: 95, BBPEGJLEEEC: 100 }] };
    assert.throws(() => buildCharacterStats({ 1: {} }, source, {}), /Missing character/);
    source.avatars = [{ id: 1, skillDepotId: 101 }];
    source.depots = [{ id: 101 }, { id: 102 }];
    assert.throws(() => buildCharacterStats({ '1-102': {} }, source, {}), /Invalid character skill depot/);
    const setSource = { sets: [{ setId: 1, setNeedNum: [2], equipAffixId: 10 }], affixes: [{ id: 10, affixId: 100, descTextMapHash: 20, openConfig: 'NewUnknownAbility', paramList: [0.2], addProps: [] }], es: { 20: 'Bono' }, en: { 20: 'Bonus' } };
    assert.throws(() => buildArtifactSets({ es: { 1: 'Set' }, en: { 1: 'Set' } }, setSource, {}), /Unmodelled/);
});
