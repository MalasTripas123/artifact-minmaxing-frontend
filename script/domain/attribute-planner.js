import { characterStatsAtLevel } from './character-stats.js';
import { weaponContributions } from './weapon-stats.js';
import { artifactSetBonuses } from './artifact-set-bonuses.js';
import { statRollCounts } from './artifact-summary.js';

export const STAT_PROPS = {
    HP: 'FIGHT_PROP_HP', 'HP%': 'FIGHT_PROP_HP_PERCENT',
    ATK: 'FIGHT_PROP_ATTACK', 'ATK%': 'FIGHT_PROP_ATTACK_PERCENT',
    DEF: 'FIGHT_PROP_DEFENSE', 'DEF%': 'FIGHT_PROP_DEFENSE_PERCENT',
    CR: 'FIGHT_PROP_CRITICAL', CD: 'FIGHT_PROP_CRITICAL_HURT',
    EM: 'FIGHT_PROP_ELEMENT_MASTERY', ER: 'FIGHT_PROP_CHARGE_EFFICIENCY',
    'Pyro%': 'FIGHT_PROP_FIRE_ADD_HURT', 'Hydro%': 'FIGHT_PROP_WATER_ADD_HURT',
    'Electro%': 'FIGHT_PROP_ELEC_ADD_HURT', 'Dendro%': 'FIGHT_PROP_GRASS_ADD_HURT',
    'Cryo%': 'FIGHT_PROP_ICE_ADD_HURT', 'Anemo%': 'FIGHT_PROP_WIND_ADD_HURT',
    'Geo%': 'FIGHT_PROP_ROCK_ADD_HURT', 'Physical%': 'FIGHT_PROP_PHYSICAL_ADD_HURT',
    'Healing%': 'FIGHT_PROP_HEAL_ADD',
};
export const FLAT_STATS = new Set(['HP', 'ATK', 'DEF', 'EM']);
// Visible five-star rolls. The planner intentionally uses the displayed tiers,
// so e.g. CR Low = 3.1% and Average = (2.7 + 3.1 + 3.5 + 3.9) / 4.
export const ROLL_TIERS = {
    HP: [209, 239, 269, 299], ATK: [14, 16, 18, 19], DEF: [16, 19, 21, 23],
    'HP%': [4.1, 4.7, 5.3, 5.8], 'ATK%': [4.1, 4.7, 5.3, 5.8],
    'DEF%': [5.1, 5.8, 6.6, 7.3], CR: [2.7, 3.1, 3.5, 3.9],
    CD: [5.4, 6.2, 7, 7.8], EM: [16, 19, 21, 23], ER: [4.5, 5.2, 5.8, 6.5],
};
export const MAIN_VALUES = {
    HP: 4780, ATK: 311, 'HP%': 46.6, 'ATK%': 46.6, 'DEF%': 58.3,
    EM: 187, ER: 51.8, CR: 31.1, CD: 62.2, 'Healing%': 35.9,
    'Physical%': 58.3, 'Pyro%': 46.6, 'Hydro%': 46.6, 'Electro%': 46.6,
    'Dendro%': 46.6, 'Cryo%': 46.6, 'Anemo%': 46.6, 'Geo%': 46.6,
};
export const SLOT_OPTIONS = {
    flower: ['HP'], plume: ['ATK'], sands: ['HP%', 'ATK%', 'DEF%', 'EM', 'ER'],
    goblet: ['HP%', 'ATK%', 'DEF%', 'EM', 'Pyro%', 'Hydro%', 'Electro%', 'Dendro%', 'Cryo%', 'Anemo%', 'Geo%', 'Physical%'],
    circlet: ['HP%', 'ATK%', 'DEF%', 'EM', 'CR', 'CD', 'Healing%'],
};
const SLOT_TYPES = { EQUIP_BRACER: 'flower', EQUIP_NECKLACE: 'plume', EQUIP_SHOES: 'sands', EQUIP_RING: 'goblet', EQUIP_DRESS: 'circlet' };
const sumInto = (target, source) => { for (const [key, value] of Object.entries(source ?? {})) target[key] = (target[key] ?? 0) + value; };

export function plannerCharacter(generated, character) {
    return generated.characters[`${character.avatarId}-${character.skillDepotId}`] ?? generated.characters[character.avatarId];
}

export function initialPlan(character, generated, artifacts = []) {
    const weapon = character.equipList?.find(item => item.weapon);
    const weaponData = generated.weapons[weapon?.itemId];
    const rank = Object.values(weapon?.weapon.affixMap ?? {})[0];
    const mains = Object.fromEntries(Object.keys(SLOT_OPTIONS).map(slot => [slot, '']));
    const counts = {};
    for (const item of character.equipList ?? []) {
        if (!item.reliquary) continue;
        const slot = SLOT_TYPES[item.flat?.equipType];
        const stat = Object.keys(STAT_PROPS).find(key => STAT_PROPS[key] === item.flat?.reliquaryMainstat?.mainPropId);
        if (slot && SLOT_OPTIONS[slot].includes(stat)) mains[slot] = stat;
        const setId = String(item.flat?.icon ?? '').match(/UI_RelicIcon_(\d+)_/)?.[1];
        if (generated.artifactSets?.[setId]) counts[setId] = (counts[setId] ?? 0) + 1;
    }
    const sets = Object.entries(counts).filter(([, count]) => count >= 2).sort((a, b) => b[1] - a[1]);
    return {
        weaponId: weaponData ? String(weapon.itemId) : '',
        weaponLevel: Number(weapon?.weapon.level ?? 1),
        weaponAscension: Number(weapon?.weapon.promoteLevel ?? 0),
        refinement: rank == null ? (weaponData?.maxRefinement === 1 ? 1 : null) : Number(rank) + 1,
        setMode: sets[0]?.[1] >= 4 ? '4' : sets.length >= 2 ? '2+2' : sets.length ? '2' : '',
        set1: sets[0]?.[0] ?? '', set2: sets[1]?.[0] ?? '', mains, quality: 3,
        equippedRolls: statRollCounts(artifacts), rolls: {}, goals: {},
    };
}

export function rollValue(stat, quality) {
    const tiers = ROLL_TIERS[stat];
    if (!tiers || !Number.isInteger(quality) || quality < 1 || quality > 5) throw new RangeError('Invalid roll quality/stat');
    return quality === 3 ? tiers.reduce((a, b) => a + b, 0) / 4 : tiers[quality < 3 ? quality - 1 : quality - 2];
}

export function rollBudget(selected, mains) {
    const stats = [...new Set(selected)].filter(stat => ROLL_TIERS[stat]);
    const pieces = Object.fromEntries(Object.keys(SLOT_OPTIONS).map(slot => {
        const initial = Math.min(4, stats.filter(stat => stat !== mains[slot]).length);
        return [slot, initial ? initial + 5 : 0];
    }));
    return { pieces, total: Object.values(pieces).reduce((a, b) => a + b, 0) };
}

// None means no main-stat contribution; the slot still exists for substat planning.
export function reconcileRolls(plan, selected) {
    const before = JSON.stringify(plan.rolls);
    const budget = rollBudget(selected, plan.mains).total;
    let available = budget;
    plan.rolls = Object.fromEntries([...new Set(selected)].filter(stat => ROLL_TIERS[stat]).map(stat => {
        const requested = plan.rolls[stat] ?? plan.goals?.[stat] ?? plan.equippedRolls?.[stat] ?? 0;
        const value = Math.max(0, Math.min(30, available, Math.floor(Number(requested) || 0)));
        available -= value;
        return [stat, value];
    }));
    return before !== JSON.stringify(plan.rolls);
}

export function assignRolls(plan, selected, stat, requested) {
    reconcileRolls(plan, selected);
    if (!Object.hasOwn(plan.rolls, stat)) return;
    const other = Object.entries(plan.rolls).reduce((sum, [key, value]) => sum + (key === stat ? 0 : value), 0);
    plan.rolls[stat] = Math.max(0, Math.min(30, rollBudget(selected, plan.mains).total - other, Math.floor(Number(requested) || 0)));
    plan.goals ??= {};
    if (plan.rolls[stat] === (plan.equippedRolls?.[stat] ?? 0)) delete plan.goals[stat];
    else plan.goals[stat] = plan.rolls[stat];
}

export function activeRollGoals(plan, selected) {
    if (!plan) return {};
    return Object.fromEntries([...new Set(selected)]
        .filter(stat => Object.hasOwn(plan.goals ?? {}, stat) && plan.rolls[stat] !== (plan.equippedRolls?.[stat] ?? 0))
        .map(stat => [stat, plan.rolls[stat]]));
}

export function planSetCounts(plan) {
    const counts = {};
    if (plan.setMode && plan.set1) counts[plan.set1] = plan.setMode === '4' ? 4 : 2;
    if (plan.setMode === '2+2' && plan.set2 && plan.set2 !== plan.set1) counts[plan.set2] = 2;
    return counts;
}

// HP/ATK/DEF sliders (flat or %) show the final stat, matching the character panel.
export function plannerStatTotal(stats, stat) {
    const totals = { HP: 'MAX_HP', 'HP%': 'MAX_HP', ATK: 'CUR_ATTACK', 'ATK%': 'CUR_ATTACK', DEF: 'CUR_DEFENSE', 'DEF%': 'CUR_DEFENSE' };
    const prop = totals[stat] ? `FIGHT_PROP_${totals[stat]}` : STAT_PROPS[stat];
    const percent = !totals[stat] && !FLAT_STATS.has(stat);
    const value = stats[prop] ?? 0;
    return { value: percent ? Math.round(value * 1000) / 10 : Math.round(value), percent };
}

function finalStats(props) {
    const result = { ...props };
    for (const [base, percent, flat, total] of [
        ['BASE_HP', 'HP_PERCENT', 'HP', 'MAX_HP'],
        ['BASE_ATTACK', 'ATTACK_PERCENT', 'ATTACK', 'CUR_ATTACK'],
        ['BASE_DEFENSE', 'DEFENSE_PERCENT', 'DEFENSE', 'CUR_DEFENSE'],
    ]) result[`FIGHT_PROP_${total}`] = (props[`FIGHT_PROP_${base}`] ?? 0) * (1 + (props[`FIGHT_PROP_${percent}`] ?? 0)) + (props[`FIGHT_PROP_${flat}`] ?? 0);
    return result;
}

export function simulatePlan(generated, character, plan) {
    const metadata = plannerCharacter(generated, character);
    const ascension = Number(character.propMap?.[1002]?.ival ?? character.propMap?.[1002]?.val ?? 0);
    const characterBase = characterStatsAtLevel(metadata, generated.characterCurves, character.level, ascension).total;
    const props = { ...characterBase };
    const sets = artifactSetBonuses(generated.artifactSets, planSetCounts(plan));
    sumInto(props, sets.stats);
    for (const stat of Object.values(plan.mains)) {
        if (MAIN_VALUES[stat] != null) sumInto(props, { [STAT_PROPS[stat]]: MAIN_VALUES[stat] / (FLAT_STATS.has(stat) ? 1 : 100) });
    }
    for (const [stat, count] of Object.entries(plan.rolls)) {
        if (ROLL_TIERS[stat]) sumInto(props, { [STAT_PROPS[stat]]: count * rollValue(stat, plan.quality) / (FLAT_STATS.has(stat) ? 1 : 100) });
    }
    let weapon = null;
    if (plan.weaponId && Number.isInteger(plan.weaponLevel) && Number.isInteger(plan.weaponAscension)) {
        const data = generated.weapons[plan.weaponId];
        if (data?.weaponType !== metadata.weaponType) throw new Error('Incompatible weapon');
        const options = { level: plan.weaponLevel, ascension: plan.weaponAscension, refinement: plan.refinement };
        const basic = weaponContributions(data, generated.weaponCurves, options);
        if (!basic.equipment) throw new Error('Weapon progression unavailable');
        sumInto(props, basic.equipment);
        sumInto(props, basic.permanent);
        const context = finalStats(props);
        // Eligible stats are reconstructed from the simulation, never fightPropMap.
        context.FIGHT_PROP_NONEXTRA_CHARGE_EFFICIENCY = props.FIGHT_PROP_CHARGE_EFFICIENCY ?? 1;
        context.FIGHT_PROP_NONEXTRA_ELEMENT_MASTERY = props.FIGHT_PROP_ELEMENT_MASTERY ?? 0;
        weapon = weaponContributions(data, generated.weaponCurves, { ...options, stats: context });
        sumInto(props, weapon.derived);
    }
    return { stats: finalStats(props), characterBase, sets, weapon };
}
