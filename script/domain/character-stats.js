// Pure catalog query: does not read or overwrite Enka values or UI state.
export function characterStatsAtLevel(character, curves, level, ascension) {
    const p = character?.progression;
    if (!p) throw new Error('Character progression unavailable');
    const stage = p.ascensions[ascension];
    const extra = p.extraLevels.some(row => row.level === level && row.ascension === ascension);
    if (!Number.isInteger(level) || !Number.isInteger(ascension) || !stage || (!extra && (level < stage.minLevel || level > stage.maxLevel))) throw new RangeError('Invalid character level / ascension combination');
    const growth = {};
    for (const stat of p.baseStats) {
        const multiplier = curves?.[stat.curve]?.[level];
        if (!Number.isFinite(multiplier)) throw new Error(`Missing character curve ${stat.curve}/${level}`);
        growth[stat.prop] = stat.initial * multiplier;
    }
    const total = {};
    for (const group of [growth, stage.addStats, p.innateStats]) for (const [prop, value] of Object.entries(group)) total[prop] = (total[prop] ?? 0) + value;
    return { growth, ascension: { ...stage.addStats }, innate: { ...p.innateStats }, total, scope: p.scope };
}
