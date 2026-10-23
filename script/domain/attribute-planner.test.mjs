import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { activeRollGoals, assignRolls, initialPlan, plannerCharacter, plannerStatTotal, planSetCounts, reconcileRolls, rollBudget, rollValue, simulatePlan } from './attribute-planner.js';
import { characterStatsAtLevel } from './character-stats.js';
import { weaponStatsAtLevel } from './weapon-stats.js';

const { generated: g } = JSON.parse(await readFile(new URL('../../data/catalog.json', import.meta.url), 'utf8'));
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
const character = (avatarId = 10000046) => ({ avatarId, level: 90, propMap: { 1002: { ival: '6' } }, equipList: [] });
const mains = { flower: 'HP', plume: 'ATK', sands: 'ATK%', goblet: 'Pyro%', circlet: 'CD' };

test('sliders start at equipped rolls, activate only edited goals and reset to a new character', () => {
    const artifacts = [{ subStats: [
        { subStatName: 'CR', upgrades: Array(4).fill({ rv: 80 }) },
        { subStatName: 'ER', upgrades: Array(3).fill({ rv: 90 }) },
        { subStatName: 'ATK', upgrades: Array(2).fill({ rv: 100 }) },
    ] }];
    const plan = initialPlan(character(), g, artifacts);
    const selected = new Set(['CR', 'ER']);
    reconcileRolls(plan, selected);
    assert.deepEqual(plan.rolls, { CR: 4, ER: 3 });
    assert.deepEqual(activeRollGoals(plan, selected), {});
    assignRolls(plan, selected, 'ER', 1);
    assert.deepEqual(activeRollGoals(plan, selected), { ER: 1 });
    plan.quality = 5;
    assert.deepEqual(activeRollGoals(plan, selected), { ER: 1 });
    selected.delete('ER');
    reconcileRolls(plan, selected);
    assert.deepEqual(activeRollGoals(plan, selected), {});
    selected.add('ER'); selected.add('ATK');
    reconcileRolls(plan, selected);
    assert.deepEqual(plan.rolls, { CR: 4, ER: 1, ATK: 2 });
    assert.deepEqual(activeRollGoals(plan, selected), { ER: 1 });
    assignRolls(plan, selected, 'ER', 3);
    assert.deepEqual(activeRollGoals(plan, selected), {});
    const next = initialPlan(character(10000052), g, []);
    reconcileRolls(next, selected);
    assert.deepEqual(next.rolls, { CR: 0, ER: 0, ATK: 0 });
    assert.deepEqual(activeRollGoals(next, selected), {});
    assert.deepEqual(activeRollGoals(initialPlan(character(), g, artifacts), selected), {});
});

test('planner budget follows the user example, fixed mains, zero and 45-point limits', () => {
    const result = rollBudget(['CR', 'CD', 'ATK%'], mains);
    assert.deepEqual(result.pieces, { flower: 8, plume: 8, sands: 7, goblet: 8, circlet: 7 });
    assert.equal(result.total, 38);
    assert.equal(rollBudget([], mains).total, 0);
    assert.equal(rollBudget(['goblet'], mains).total, 0);
    assert.equal(rollBudget(['HP', 'ATK', 'DEF', 'CR', 'CD', 'EM', 'ER', 'ATK%'], mains).total, 45);
    assert.equal(rollBudget(['HP'], mains).pieces.flower, 0);
    assert.equal(rollBudget(['ATK'], mains).pieces.plume, 0);
    assert.equal(rollBudget(['ATK%'], mains).pieces.plume, 6);
});

test('quality has five tiers, including the mean requested for CR', () => {
    close(rollValue('CR', 1), 2.7);
    close(rollValue('CR', 2), 3.1);
    close(rollValue('CR', 3), 3.3);
    close(rollValue('CR', 4), 3.5);
    close(rollValue('CR', 5), 3.9);
    assert.equal(rollValue('EM', 3), 19.75);
});

test('roll allocation never exceeds 30 per slider or the changing shared budget', () => {
    const plan = { mains: { ...mains }, rolls: {} };
    const selected = new Set(['CR', 'CD', 'ATK%']);
    assignRolls(plan, selected, 'CR', 31);
    assignRolls(plan, selected, 'CD', 30);
    assert.deepEqual(plan.rolls, { CR: 30, CD: 8, 'ATK%': 0 });
    assignRolls(plan, selected, 'CR', 20);
    assignRolls(plan, selected, 'ATK%', 30);
    assert.equal(plan.rolls['ATK%'], 10);
    reconcileRolls(plan, new Set(['CD']));
    assert.deepEqual(plan.rolls, { CD: 8 });
    assignRolls(plan, ['CD'], 'CD', 30);
    assert.equal(plan.rolls.CD, 24);
    plan.rolls = { 'ATK%': 24 };
    plan.mains.goblet = 'ATK%';
    reconcileRolls(plan, ['ATK%']);
    assert.equal(plan.rolls['ATK%'], 18);
    reconcileRolls(plan, []);
    assert.deepEqual(plan.rolls, {});
});

test('defaults copy equipment identities, not artifact levels, substats or final character stats', () => {
    const char = character();
    char.equipList = [
        { itemId: 13501, weapon: { level: 20, promoteLevel: 1, affixMap: { 113501: 4 } } },
        ...['EQUIP_BRACER', 'EQUIP_NECKLACE', 'EQUIP_SHOES', 'EQUIP_RING', 'EQUIP_DRESS'].map((equipType, i) => ({
            reliquary: { level: 14 }, flat: { equipType, icon: `UI_RelicIcon_${i < 4 ? 15001 : 15025}_4`,
                reliquaryMainstat: { mainPropId: ['FIGHT_PROP_HP', 'FIGHT_PROP_ATTACK', 'FIGHT_PROP_ATTACK_PERCENT', 'FIGHT_PROP_FIRE_ADD_HURT', 'FIGHT_PROP_CRITICAL_HURT'][i], statValue: 1 } },
        })),
    ];
    const plan = initialPlan(char, g);
    assert.equal(plan.weaponLevel, 20);
    assert.equal(plan.weaponAscension, 1);
    assert.equal(plan.refinement, 5);
    assert.equal(plan.setMode, '4');
    assert.equal(plan.set1, '15001');
    assert.deepEqual(plan.mains, mains);
    assert.deepEqual(plan.rolls, {});
    const result = simulatePlan(g, char, plan);
    char.fightPropMap = new Proxy({}, { get() { throw new Error('Observed totals must never be read'); } });
    assert.deepEqual(simulatePlan(g, char, plan), result);
    assert.ok(result.stats.FIGHT_PROP_MAX_HP > 4780);
});

test('bare character uses the catalog and its ascension, including variant identity', () => {
    const char = character();
    const plan = initialPlan(char, g);
    const base = characterStatsAtLevel(g.characters[char.avatarId], g.characterCurves, 90, 6).total;
    const result = simulatePlan(g, char, plan).stats;
    close(result.FIGHT_PROP_MAX_HP, base.FIGHT_PROP_BASE_HP);
    close(result.FIGHT_PROP_CUR_ATTACK, base.FIGHT_PROP_BASE_ATTACK);
    close(result.FIGHT_PROP_CRITICAL, 0.05);
    const variant = Object.keys(g.characters).find(key => key.includes('-'));
    const [avatarId, skillDepotId] = variant.split('-');
    assert.equal(plannerCharacter(g, { avatarId, skillDepotId }), g.characters[variant]);
    const low = { ...char, level: 20, propMap: { 1002: { ival: '0' } } };
    const high = { ...low, propMap: { 1002: { ival: '1' } } };
    assert.ok(simulatePlan(g, high, plan).stats.FIGHT_PROP_MAX_HP > simulatePlan(g, low, plan).stats.FIGHT_PROP_MAX_HP);
});

test('weapon attack joins character base before ATK%, and two different two-piece sets stack once', () => {
    const char = character();
    const plan = initialPlan(char, g);
    Object.assign(plan, { weaponId: '13501', weaponLevel: 90, weaponAscension: 6, refinement: 1, setMode: '2+2', set1: '15001', set2: '15019', mains: { ...mains } });
    const result = simulatePlan(g, char, plan);
    const w = weaponStatsAtLevel(g.weapons[13501], g.weaponCurves, 90, 6);
    const base = result.characterBase.FIGHT_PROP_BASE_ATTACK + w.FIGHT_PROP_BASE_ATTACK;
    close(result.stats.FIGHT_PROP_BASE_ATTACK, base);
    close(result.sets.stats.FIGHT_PROP_ATTACK_PERCENT, 0.36);
    close(result.stats.FIGHT_PROP_CUR_ATTACK - result.weapon.derived.FIGHT_PROP_ATTACK, base * (1 + 0.466 + 0.36) + 311);
    assert.deepEqual(planSetCounts({ ...plan, set2: plan.set1 }), { 15001: 2 });
});

test('Homa refinement conversion responds to simulated HP and adds HP% only once', () => {
    const char = character();
    const plan = initialPlan(char, g);
    Object.assign(plan, { weaponId: '13501', weaponLevel: 90, weaponAscension: 6, refinement: 1 });
    const r1 = simulatePlan(g, char, plan);
    close(r1.stats.FIGHT_PROP_MAX_HP, r1.characterBase.FIGHT_PROP_BASE_HP * 1.2);
    close(r1.weapon.derived.FIGHT_PROP_ATTACK, r1.stats.FIGHT_PROP_MAX_HP * 0.008);
    plan.mains.flower = 'HP';
    plan.rolls.HP = 10;
    const moreHp = simulatePlan(g, char, plan);
    close(moreHp.weapon.derived.FIGHT_PROP_ATTACK - r1.weapon.derived.FIGHT_PROP_ATTACK, (4780 + 10 * rollValue('HP', 3)) * 0.008);
    plan.refinement = 5;
    const r5 = simulatePlan(g, char, plan);
    close(r5.weapon.derived.FIGHT_PROP_ATTACK, r5.stats.FIGHT_PROP_MAX_HP * 0.016);
});

test('Engulfing Lightning conversion uses simulated recharge and combined base attack', () => {
    const char = character(10000052);
    const plan = initialPlan(char, g);
    Object.assign(plan, { weaponId: '13509', weaponLevel: 90, weaponAscension: 6, refinement: 1, rolls: { ER: 10 } });
    const result = simulatePlan(g, char, plan);
    const effect = result.weapon.effects.find(effect => effect.kind !== 'flat');
    close(effect.resolvedValue, Math.min(effect.cap, (result.stats.FIGHT_PROP_CHARGE_EFFICIENCY - effect.offset) * effect.factor) * result.stats.FIGHT_PROP_BASE_ATTACK);
    assert.equal(result.weapon.issues.length, 0);
});

test('flat and percent rolls affect the correct totals, and no equipment selections contribute zero', () => {
    const char = character();
    const plan = initialPlan(char, g);
    const base = simulatePlan(g, char, plan).stats;
    plan.quality = 2;
    plan.rolls = { CR: 2, EM: 3, ATK: 2, 'ATK%': 1 };
    const result = simulatePlan(g, char, plan).stats;
    close(result.FIGHT_PROP_CRITICAL - base.FIGHT_PROP_CRITICAL, 0.062);
    close(result.FIGHT_PROP_ELEMENT_MASTERY, 57);
    close(result.FIGHT_PROP_CUR_ATTACK - base.FIGHT_PROP_CUR_ATTACK, base.FIGHT_PROP_BASE_ATTACK * 0.047 + 32);
    assert.equal(planSetCounts(plan)[15001], undefined);
    const wrong = { ...plan, weaponId: '15501', weaponLevel: 90, weaponAscension: 6, refinement: 1 };
    assert.throws(() => simulatePlan(g, char, wrong), /Incompatible/);
});

test('an explicitly unselected weapon level or ascension contributes no weapon stats', () => {
    const char = character();
    const plan = initialPlan(char, g);
    const bare = simulatePlan(g, char, plan).stats;
    Object.assign(plan, { weaponId: '13501', weaponLevel: null, weaponAscension: 6, refinement: 1 });
    assert.deepEqual(simulatePlan(g, char, plan).stats, bare);
    plan.weaponLevel = 90;
    plan.weaponAscension = null;
    assert.deepEqual(simulatePlan(g, char, plan).stats, bare);
});

test('slider totals show final character stats, with ratios only for percent stats', () => {
    const stats = { FIGHT_PROP_MAX_HP: 15140.4, FIGHT_PROP_CUR_ATTACK: 1504.1, FIGHT_PROP_CUR_DEFENSE: 676.2, FIGHT_PROP_CRITICAL: 0.4781, FIGHT_PROP_CRITICAL_HURT: 2.248, FIGHT_PROP_CHARGE_EFFICIENCY: 1.162, FIGHT_PROP_ELEMENT_MASTERY: 598.4 };
    for (const key of ['HP', 'HP%']) assert.deepEqual(plannerStatTotal(stats, key), { value: 15140, percent: false });
    for (const key of ['ATK', 'ATK%']) assert.deepEqual(plannerStatTotal(stats, key), { value: 1504, percent: false });
    for (const key of ['DEF', 'DEF%']) assert.deepEqual(plannerStatTotal(stats, key), { value: 676, percent: false });
    assert.deepEqual(plannerStatTotal(stats, 'CR'), { value: 47.8, percent: true });
    assert.deepEqual(plannerStatTotal(stats, 'CD'), { value: 224.8, percent: true });
    assert.deepEqual(plannerStatTotal(stats, 'ER'), { value: 116.2, percent: true });
    assert.deepEqual(plannerStatTotal(stats, 'EM'), { value: 598, percent: false });
});
