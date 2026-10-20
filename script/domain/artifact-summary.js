export function equippedSets(artifacts) {
    const counts = new Map();
    for (const artifact of artifacts) {
        if (artifact.set) counts.set(artifact.set, (counts.get(artifact.set) ?? 0) + 1);
    }
    return [...counts].filter(([, count]) => count >= 2)
        .map(([name, count]) => ({ name, pieces: count >= 4 ? 4 : 2 }));
}

export function statRollCounts(artifacts) {
    const counts = {};
    for (const artifact of artifacts) {
        for (const stat of artifact.subStats ?? []) {
            counts[stat.subStatName] = (counts[stat.subStatName] ?? 0) + stat.upgrades.length;
        }
    }
    return counts;
}

export function statValueTotals(artifacts) {
    const totals = {};
    for (const artifact of artifacts) {
        for (const stat of artifact.subStats ?? []) {
            if (!Number.isFinite(stat.totalValue)) continue;
            totals[stat.subStatName] = (totals[stat.subStatName] ?? 0) + stat.totalValue;
        }
    }
    return Object.fromEntries(Object.entries(totals).map(([name, value]) => [name, Number(value.toFixed(1))]));
}
