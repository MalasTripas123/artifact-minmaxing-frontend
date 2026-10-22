import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { weaponStatsAtLevel, weaponContributions } from './weapon-stats.js';
import { characterWeapon } from './character-weapon.js';
import { validateWeaponCatalog } from '../catalog/weapon-validation.js';
import { weaponMetadata } from '../../../tools/weapon-assets.mjs';
import { normalizeSources } from '../../../tools/catalog-service.mjs';
import { buildWeaponStats } from '../../../tools/weapon-stats-import.mjs';

const catalog = JSON.parse(await readFile(new URL('../../data/catalog.json', import.meta.url), 'utf8'));
const { weapons, weaponCurves } = catalog.generated;
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
const contribution = (id, refinement = 1, stats = {}) => weaponContributions(weapons[id], weaponCurves, { level: 90, ascension: 6, refinement, stats });

test('every catalogued weapon resolves all legal levels, both sides of ascensions and legal refinements', () => {
    assert.equal(Object.keys(weapons).length, 255);
    assert.deepEqual(validateWeaponCatalog(catalog.generated), []);
    let combinations = 0;
    for (const w of Object.values(weapons)) {
        for (const [ascension, stage] of Object.entries(w.progression.ascensions)) {
            for (let level = stage.minLevel; level <= stage.maxLevel; level++) {
                const stats = weaponStatsAtLevel(w, weaponCurves, level, Number(ascension));
                assert.ok(stats.FIGHT_PROP_BASE_ATTACK > 0);
                assert.ok(Object.values(stats).every(Number.isFinite));
                combinations++;
            }
        }
        for (const passive of w.passives) for (let rank = 1; rank <= w.maxRefinement; rank++) {
            assert.ok(passive.refinements[rank].descriptions.es);
            assert.ok(passive.refinements[rank].descriptions.en);
        }
    }
    assert.ok(combinations > 23000);
});

test('progression preserves internal precision and ascension boundary attack bonuses', () => {
    const before = weaponStatsAtLevel(weapons[15501], weaponCurves, 20, 0);
    const after = weaponStatsAtLevel(weapons[15501], weaponCurves, 20, 1);
    close(before.FIGHT_PROP_BASE_ATTACK, 133.293748);
    close(after.FIGHT_PROP_BASE_ATTACK - before.FIGHT_PROP_BASE_ATTACK, 31.1);
    close(before.FIGHT_PROP_CRITICAL, after.FIGHT_PROP_CRITICAL);
    const harp = weaponStatsAtLevel(weapons[15501], weaponCurves, 90, 6);
    assert.equal(Math.round(harp.FIGHT_PROP_BASE_ATTACK), 674);
    close(harp.FIGHT_PROP_CRITICAL, 0.220512);
    const aqua = weaponStatsAtLevel(weapons[15508], weaponCurves, 90, 6);
    assert.equal(Math.round(aqua.FIGHT_PROP_BASE_ATTACK), 542);
    close(aqua.FIGHT_PROP_CRITICAL_HURT, 0.882048);
    for (const [level, stage] of [[21, 0], [19, 1], [91, 6], [90, 7], [1.5, 0], [20, -1]]) {
        assert.throws(() => weaponStatsAtLevel(weapons[15501], weaponCurves, level, stage), RangeError);
    }
    assert.equal(weapons[11101].maxLevel, 70);
    assert.throws(() => weaponStatsAtLevel(weapons[11101], weaponCurves, 90, 6));
});

test('the requested permanent bonuses use actual R1 through R5 data', () => {
    for (const [id, prop, values] of [
        [15501, 'FIGHT_PROP_CRITICAL_HURT', [0.20, 0.25, 0.30, 0.35, 0.40]],
        [14521, 'FIGHT_PROP_CRITICAL', [0.08, 0.10, 0.12, 0.14, 0.16]],
        [15508, 'FIGHT_PROP_HP_PERCENT', [0.16, 0.20, 0.24, 0.28, 0.32]],
    ]) values.forEach((value, index) => close(contribution(id, index + 1).permanent[prop], value));
    // Reliquary's temporary EM / lunar crit buffs are not global permanent stats.
    assert.equal(contribution(14521).permanent.FIGHT_PROP_ELEMENT_MASTERY, undefined);
    assert.equal(contribution(14521).permanent.FIGHT_PROP_CRITICAL_HURT, undefined);
    // Skill/burst-only CRIT from The Catch must never be attributed to global CRIT.
    assert.equal(contribution(13415).permanent.FIGHT_PROP_CRITICAL, undefined);
    assert.equal(contribution(11302).permanent.FIGHT_PROP_CRITICAL, undefined);
});

test('ability-based elemental bonuses and new permanent ATK are included without stacks', () => {
    for (const id of [11509, 11510, 13507, 14501, 15511]) {
        const result = contribution(id, 5);
        for (const element of ['FIRE', 'WATER', 'GRASS', 'ELEC', 'WIND', 'ICE', 'ROCK']) close(result.permanent[`FIGHT_PROP_${element}_ADD_HURT`], 0.24);
        assert.equal(result.permanent.FIGHT_PROP_PHYSICAL_ADD_HURT, undefined);
    }
    close(contribution(12516).permanent.FIGHT_PROP_ATTACK_PERCENT, 0.28);
});

test('HP conversions use final observed HP once; Homa low-HP bonus is excluded', () => {
    close(contribution(11505, 1, { FIGHT_PROP_MAX_HP: 30000 }).derived.FIGHT_PROP_ATTACK, 360);
    close(contribution(13501, 1, { FIGHT_PROP_MAX_HP: 30000 }).derived.FIGHT_PROP_ATTACK, 240);
    const missing = contribution(11505);
    assert.equal(missing.derived.FIGHT_PROP_ATTACK, undefined);
    assert.ok(missing.issues.some(x => x.code === 'conversion-input-unavailable'));
});

test('nonextra conversions require eligible inputs, clamp at zero/cap, and remain separate from base attack', () => {
    const stats = { FIGHT_PROP_NONEXTRA_CHARGE_EFFICIENCY: 2.5, FIGHT_PROP_BASE_ATTACK: 900 };
    close(contribution(13509, 1, stats).derived.FIGHT_PROP_ATTACK, 378);
    close(contribution(13509, 1, { ...stats, FIGHT_PROP_NONEXTRA_CHARGE_EFFICIENCY: 10 }).derived.FIGHT_PROP_ATTACK, 720);
    close(contribution(13509, 1, { ...stats, FIGHT_PROP_NONEXTRA_CHARGE_EFFICIENCY: 0.9 }).derived.FIGHT_PROP_ATTACK, 0);
    assert.ok(contribution(13509, 1, { FIGHT_PROP_CHARGE_EFFICIENCY: 2.5, FIGHT_PROP_BASE_ATTACK: 900 }).pending.length);
    close(contribution(13511, 1, { FIGHT_PROP_NONEXTRA_ELEMENT_MASTERY: 400 }).derived.FIGHT_PROP_ATTACK, 208);
    assert.equal(contribution(11418).derived.FIGHT_PROP_CHARGE_EFFICIENCY, undefined);
    close(contribution(11418).pending[0].factor, 0.00036);
});

test('scanner uses zero-based Enka refinement, explicit ascension, and preserves observed totals', () => {
    const character = { fightPropMap: { 2000: 30000 }, equipList: [{ itemId: 11505, weapon: { level: 20, promoteLevel: 1, affixMap: { 111505: 4 } } }] };
    const snapshot = structuredClone(character);
    const result = characterWeapon(character, weapons, {}, 'es', weaponCurves);
    assert.equal(result.refinement, 5);
    assert.equal(result.ascension, 1);
    close(result.contributions.permanent.FIGHT_PROP_HP_PERCENT, 0.4);
    close(result.contributions.derived.FIGHT_PROP_ATTACK, 720);
    assert.deepEqual(character, snapshot);
    delete character.equipList[0].weapon.affixMap;
    assert.ok(characterWeapon(character, weapons, {}, 'es', weaponCurves).contributions.issues.some(x => x.code === 'refinement-unavailable'));
    const plain = characterWeapon({ equipList: [{ itemId: 11101, weapon: { level: 1 } }] }, weapons, {}, 'es', weaponCurves);
    assert.equal(plain.ascension, 0);
    assert.deepEqual(plain.contributions.issues, []);
    assert.equal(weapons[11416].maxRefinement, 1);
    assert.ok(weaponContributions(weapons[11416], weaponCurves, { level: 90, ascension: 6, refinement: 5 }).issues.length);
});

test('asset-only refreshes preserve stats and validators reject incomplete enriched catalogs', () => {
    const updated = weaponMetadata({ 15501: { NameTextMapHash: 1 } }, { es: { 1: 'Arco' }, en: { 1: 'Bow' } }, weapons);
    assert.deepEqual(updated[15501].progression, weapons[15501].progression);
    assert.deepEqual(updated[15501].passives, weapons[15501].passives);
    const broken = structuredClone(catalog.generated);
    delete broken.weaponCurves.GROW_CURVE_ATTACK_302[90];
    assert.ok(validateWeaponCatalog(broken).length);
    const fixture = { avatars: { 1: { NameTextMapHash: 1 }, 2: { NameTextMapHash: 2 } }, relics: { Sets: { 1: { Name: 1 } } }, loc: { es: { 1: 'Uno', 2: 'Dos' }, en: { 1: 'One', 2: 'Two' } }, giLocs: { es: {}, en: {} }, weapons: { 15501: { NameTextMapHash: 1 } } };
    const normalized = normalizeSources(fixture, { ...catalog.generated, characters: {}, artifactSetsByLocale: { es: {} } });
    assert.deepEqual(normalized.weaponCurves, weaponCurves);
    assert.deepEqual(normalized.weapons[15501].passives, weapons[15501].passives);
});

test('source importer requires complete weapons, passive texts and known value semantics', () => {
    const fixture = {
        weapons: [{ id: 11101, rankLevel: 1, weaponType: 'WEAPON_SWORD_ONE_HAND', weaponPromoteId: 1,
            weaponProp: [{ propType: 'FIGHT_PROP_BASE_ATTACK', initValue: 23, type: 'curve' }], skillAffix: [100] }],
        curves: [{ level: 1, curveInfos: [{ type: 'curve', arith: 'ARITH_MULTI', GGKIEIJLCJJ: 1 }] }],
        promotes: [{ weaponPromoteId: 1, unlockMaxLevel: 20, addProps: [{ propType: 'FIGHT_PROP_BASE_ATTACK' }] }],
        affixes: [{ id: 100, affixId: 1000, descTextMapHash: 123, paramList: [], addProps: [{ propType: 'FIGHT_PROP_CRITICAL', GGKIEIJLCJJ: 0.08 }] }],
        en: { 123: 'Crit <color=#FFFFFF>8%</color>' }, es: { 123: 'Crítico <color=#FFFFFF>8%</color>' },
    };
    const result = buildWeaponStats({ 11101: {} }, fixture, {});
    assert.equal(result.weapons[11101].passives[0].refinements[1].descriptions.en, 'Crit 8%');
    assert.equal(result.weapons[11101].passives[0].refinements[1].effects[0].value, 0.08);
    assert.throws(() => buildWeaponStats({ 99999: {} }, fixture, {}), /missing/);
    assert.throws(() => buildWeaponStats({ 11101: {} }, { ...fixture, es: {} }, {}), /Missing es/);
    const changed = structuredClone(fixture);
    changed.curves[0].curveInfos[0].newUnknownValue = 2;
    assert.throws(() => buildWeaponStats({ 11101: {} }, changed, {}), /schema changed/);
});
