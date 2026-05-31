const ARTIFACT_SLOTS = ['flor', 'pluma', 'reloj', 'copa', 'corona'];

const ARTIFACT_TYPE_TO_SLOT = {
    Flor: 'flor',
    Pluma: 'pluma',
    Reloj: 'reloj',
    Copa: 'copa',
    Corona: 'corona',
};

const FLAT_MAIN_STAT_TYPES = new Set(['Flor', 'Pluma']);

function asStatSet(selectedStats) {
    return selectedStats instanceof Set ? selectedStats : new Set(selectedStats ?? []);
}

function toPercent(value) {
    return Number(value.toFixed(1));
}

export function getArtifactSlot(type) {
    return ARTIFACT_TYPE_TO_SLOT[type] ?? String(type ?? '').toLowerCase();
}

export function getInitialSubstatsFromTotalRolls(totalRolls) {
    return Number(totalRolls) === 9 ? 4 : 3;
}

export function calculateRolls(maxUsefulSubstats, initialSubstats = 4) {
    const base = initialSubstats === 4 ? 9 : 8;

    if (maxUsefulSubstats < 1) return 0;
    return base - (4 - maxUsefulSubstats);
}

export function getMaxUsefulSubstats(slot, selectedStats, usesElementalGoblet = true) {
    const stats = asStatSet(selectedStats);
    let critCount = 0;
    let erNeeded = false;

    for (const stat of stats) {
        if (stat === 'CR' || stat === 'CD') critCount++;
        if (stat === 'ER') erNeeded = true;
    }

    switch (stats.size) {
        case 7:
        case 6:
        case 5:
            return 4;

        case 4:
            if (slot === 'reloj' || slot === 'corona') return 3;
            if (slot === 'copa' && !usesElementalGoblet) return 3;
            return 4;

        case 3:
            if (slot === 'reloj' || slot === 'corona') return 2;
            if (slot === 'copa' && !usesElementalGoblet) return 2;
            return 3;

        case 2:
            if (slot === 'reloj' && critCount < 2) return 1;
            if (slot === 'corona') return 1;
            if (slot === 'copa' && !usesElementalGoblet && (critCount > 1 || (critCount > 0 && erNeeded))) {
                return 1;
            }
            return 2;

        case 1:
            if (slot === 'reloj' && critCount === 0) return 0;
            if (slot === 'copa' && !usesElementalGoblet) {
                if (stats.has('ATK%')) return 0;
                if (stats.has('HP%')) return 0;
                if (stats.has('DEF%')) return 0;
                if (stats.has('EM')) return 0;
            }
            if (slot === 'corona' && !stats.has('ER')) return 0;
            return 1;

        default:
            return 0;
    }
}

export function calculateMaxRolls(selectedStats, usesElementalGoblet = true, initialSubstats = 4) {
    let total = 0;
    const detalle = {};

    for (const slot of ARTIFACT_SLOTS) {
        const maxSubs = getMaxUsefulSubstats(slot, selectedStats, usesElementalGoblet);
        const rolls = calculateRolls(maxSubs, initialSubstats);
        detalle[slot] = { maxSubs, rolls };
        total += rolls;
    }

    return {
        totalRollsMaximos: total,
        detalle,
    };
}

export function isMainStatUseful(artifact, selectedStats, usesElementalGoblet = true) {
    if (!artifact || FLAT_MAIN_STAT_TYPES.has(artifact.type)) return false;

    const stats = asStatSet(selectedStats);
    if (stats.has(artifact.mainStat)) return true;

    return artifact.type === 'Copa' && usesElementalGoblet && artifact.isElemental;
}

export function getUsefulSubstatBreakdown(artifact, selectedStats) {
    const stats = asStatSet(selectedStats);

    return (artifact?.subStats ?? [])
        .filter(subStat => stats.has(subStat.subStatName))
        .map(subStat => {
            const upgrades = subStat.upgrades ?? [];
            const totalValue = upgrades.reduce((sum, upgrade) => sum + (Number(upgrade.value) || 0), 0);
            const totalRollValue = upgrades.reduce((sum, upgrade) => sum + (Number(upgrade.rv) || 0), 0);

            return {
                name: subStat.subStatName,
                upgrades,
                totalValue,
                totalRollValue,
            };
        });
}

export function calculateArtifactRv(artifact, selectedStats) {
    return getUsefulSubstatBreakdown(artifact, selectedStats)
        .reduce((total, subStat) => total + subStat.totalRollValue, 0);
}

export function analyzeArtifact(artifact, selectedStats, usesElementalGoblet = true) {
    const slot = getArtifactSlot(artifact?.type);
    const usefulSubstats = getUsefulSubstatBreakdown(artifact, selectedStats);
    const currentRv = usefulSubstats.reduce((total, subStat) => total + subStat.totalRollValue, 0);
    const initialSubstats = getInitialSubstatsFromTotalRolls(artifact?.totalRolls);
    const currentMaxRolls = usefulSubstats.length === 0
        ? 0
        : calculateRolls(usefulSubstats.length, initialSubstats);
    const theoreticalMaxSubstats = getMaxUsefulSubstats(slot, selectedStats, usesElementalGoblet);
    const theoreticalMaxRolls = calculateRolls(theoreticalMaxSubstats);

    return {
        slot,
        currentRv,
        currentMaxRolls,
        theoreticalMaxSubstats,
        theoreticalMaxRolls,
        usefulSubstats,
        mainStatUseful: isMainStatUseful(artifact, selectedStats, usesElementalGoblet),
        currentPiecePercent: currentMaxRolls === 0 ? 0 : toPercent(currentRv / currentMaxRolls),
        theoreticalTotalPercent: theoreticalMaxRolls === 0 ? 0 : toPercent(currentRv / theoreticalMaxRolls),
        maxPiecePercentOfTotal: theoreticalMaxRolls === 0 ? 0 : toPercent((currentMaxRolls * 100) / theoreticalMaxRolls),
    };
}

export function countArtifactStats(artifacts, selectedStats, usesElementalGoblet = true) {
    const stats = asStatSet(selectedStats);
    let count = 0;
    let rollQuality = 0;
    let principalStatsCount = 0;
    const artifactBreakDown = {};

    for (const artifact of artifacts ?? []) {
        artifactBreakDown[artifact.type] = {
            artifCount: 0,
            artifRV: 0,
            principalIsUsefull: false,
        };

        for (const subStat of artifact.subStats ?? []) {
            if (!stats.has(subStat.subStatName)) continue;

            artifactBreakDown[artifact.type].artifCount += subStat.upgrades.length;
            count += subStat.upgrades.length;

            for (const upgrade of subStat.upgrades) {
                artifactBreakDown[artifact.type].artifRV += upgrade.rv;
                rollQuality += upgrade.rv;
            }
        }

        if (isMainStatUseful(artifact, stats, usesElementalGoblet)) {
            artifactBreakDown[artifact.type].principalIsUsefull = true;
            principalStatsCount++;
        }
    }

    return { count, rollQuality, principalStatsCount, artifactBreakDown };
}

export function calculateCritValue(artifact) {
    let critValue = 0;

    for (const subStat of artifact?.subStats ?? []) {
        if (subStat.subStatName === 'CD') {
            critValue += Number(subStat.value) || 0;
        }
        if (subStat.subStatName === 'CR') {
            critValue += (Number(subStat.value) || 0) * 2;
        }
    }

    return critValue;
}
