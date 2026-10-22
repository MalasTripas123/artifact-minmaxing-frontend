// All percentages are ratios (0.20 = 20%). Never round before attribution.
const add = (target, prop, value) => { target[prop] = (target[prop] ?? 0) + value; };

export function weaponStatsAtLevel(weapon, curves, level, ascension) {
    if (!weapon?.progression) throw new Error('Weapon progression unavailable');
    const stage = weapon.progression.ascensions[ascension];
    if (!Number.isInteger(level) || !Number.isInteger(ascension) || !stage || level < stage.minLevel || level > stage.maxLevel) {
        throw new RangeError('Invalid weapon level / ascension combination');
    }
    const stats = { ...stage.addStats };
    for (const { prop, initial, curve } of weapon.progression.baseStats) {
        const multiplier = curves?.[curve]?.[level];
        if (!Number.isFinite(multiplier)) throw new Error(`Missing weapon curve ${curve}/${level}`);
        add(stats, prop, initial * multiplier);
    }
    return stats;
}

// Context contains final, already observed stats. In particular MAX_HP already
// includes the weapon's HP bonus; applying it again would double-count it.
// NONEXTRA values must be reconstructed by the future character/set breakdown.
export function weaponContributions(weapon, curves, { level, ascension, refinement, stats = {} }) {
    const issues = [];
    let equipment = null;
    try { equipment = weaponStatsAtLevel(weapon, curves, level, ascension); }
    catch (error) { issues.push({ code: 'progression-unavailable', message: error.message }); }
    const permanent = {};
    const derived = {};
    const pending = [];
    const effects = [];
    if (!weapon?.passives) issues.push({ code: 'passive-data-unavailable' });
    for (const passive of weapon?.passives ?? []) {
        const rank = Number.isInteger(refinement) ? passive.refinements[refinement] : null;
        if (!rank) { issues.push({ code: 'refinement-unavailable', affixId: passive.id }); continue; }
        for (const effect of rank.effects) {
            if (effect.activation !== 'always') { pending.push(effect); continue; }
            if (effect.kind === 'flat') {
                add(permanent, effect.prop, effect.value);
                effects.push({ ...effect, resolvedValue: effect.value, affixId: passive.id });
                continue;
            }
            const input = stats[effect.input];
            const base = effect.base ? stats[effect.base] : 1;
            if (!Number.isFinite(input) || !Number.isFinite(base)) {
                pending.push(effect);
                issues.push({ code: 'conversion-input-unavailable', input: effect.input, base: effect.base });
                continue;
            }
            const value = Math.min(effect.cap ?? Infinity, Math.max(0, input - (effect.offset ?? 0)) * effect.factor) * base;
            add(derived, effect.prop, value);
            effects.push({ ...effect, resolvedValue: value, affixId: passive.id });
        }
    }
    const total = { ...(equipment ?? {}) };
    for (const group of [permanent, derived]) for (const [prop, value] of Object.entries(group)) add(total, prop, value);
    return { equipment, permanent, derived, total, effects, pending, issues,
        scope: 'equipment-and-unconditional-passive-stats',
        // A passive can also contain combat effects described in the catalog.
        includesConditionalEffects: false };
}
