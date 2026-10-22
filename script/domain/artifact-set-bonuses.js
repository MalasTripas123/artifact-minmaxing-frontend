// Counts are keyed by stable numeric set IDs, never translated names.
// Returns general stats separately from scoped damage and triggered effects.
export function artifactSetBonuses(sets, counts) {
    const stats = {};
    const scoped = [];
    const conditional = [];
    const activeBonuses = [];
    const unmodelled = [];
    const entries = Object.entries(counts);
    if (entries.some(([, n]) => !Number.isInteger(n) || n < 0 || n > 5) || entries.reduce((sum, [, n]) => sum + n, 0) > 5) throw new RangeError('Invalid artifact piece counts');
    for (const [id, count] of entries) {
        if (!count) continue;
        const set = sets[id];
        if (!set) throw new Error(`Unknown artifact set ${id}`);
        for (const bonus of set.bonuses) {
            if (count < bonus.pieces) continue;
            const origin = { setId: id, pieces: bonus.pieces };
            activeBonuses.push(origin);
            if (bonus.effectCoverage !== 'complete') unmodelled.push({ ...origin, descriptions: bonus.descriptions, ability: bonus.ability });
            for (const effect of bonus.effects) {
                const entry = { ...effect, ...origin };
                if (effect.activation !== 'always') conditional.push(entry);
                else if (effect.kind === 'stat') stats[effect.prop] = (stats[effect.prop] ?? 0) + effect.value;
                else scoped.push(entry);
            }
        }
    }
    return { stats, scoped, conditional, activeBonuses, unmodelled };
}
