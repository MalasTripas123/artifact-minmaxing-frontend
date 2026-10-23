// Caps are global per stat, never restarted for each piece. Keep the highest-RV
// rolls, with equipment order breaking ties so every view uses the same result.
export function applyRollGoals(artifacts, goals = {}) {
    if (!Object.keys(goals).length) return artifacts;
    const kept = new Set();
    for (const [stat, requested] of Object.entries(goals)) {
        const rolls = [];
        artifacts.forEach((artifact, piece) => {
            (artifact.subStats ?? []).forEach((substat, sub) => {
                if (substat.subStatName !== stat) return;
                (substat.upgrades ?? []).forEach((upgrade, roll) => rolls.push({
                    key: `${piece}:${sub}:${roll}`, rv: Number(upgrade.rv) || 0,
                }));
            });
        });
        const limit = Math.max(0, Math.floor(Number(requested) || 0));
        rolls.sort((a, b) => b.rv - a.rv).slice(0, limit).forEach(roll => kept.add(roll.key));
    }
    return artifacts.map((artifact, piece) => ({
        ...artifact,
        subStats: (artifact.subStats ?? []).map((substat, sub) => {
            if (!Object.hasOwn(goals, substat.subStatName)) return substat;
            const upgrades = (substat.upgrades ?? []).filter((_, roll) => kept.has(`${piece}:${sub}:${roll}`));
            return { ...substat, upgrades, excludedRolls: (substat.upgrades?.length ?? 0) - upgrades.length };
        }),
    }));
}

export function compareRollGoals(actual, goals) {
    return Object.fromEntries(Object.entries(goals).map(([stat, target]) => {
        const current = actual[stat] ?? 0;
        return [stat, { current, target, missing: Math.max(0, target - current), excess: Math.max(0, current - target) }];
    }));
}
