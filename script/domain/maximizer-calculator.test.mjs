import assert from 'node:assert/strict';
import {
    analyzeArtifact,
    calculateArtifactRv,
    calculateCritValue,
    calculateMaxRolls,
    calculateRolls,
    countArtifactStats,
    getMaxUsefulSubstats,
    isMainStatUseful,
} from './maximizer-calculator.js';

const dpsStats = new Set(['CR', 'CD', 'ATK%', 'ER']);

assert.equal(calculateRolls(4, 4), 9);
assert.equal(calculateRolls(4, 3), 8);
assert.equal(calculateRolls(0, 4), 0);

assert.equal(getMaxUsefulSubstats('copa', dpsStats, true), 4);
assert.equal(getMaxUsefulSubstats('copa', dpsStats, false), 3);
assert.equal(getMaxUsefulSubstats('reloj', dpsStats, true), 3);
assert.equal(calculateMaxRolls(dpsStats, true).totalRollsMaximos, 43);
assert.equal(calculateMaxRolls(dpsStats, false).totalRollsMaximos, 42);

const electroGoblet = {
    type: 'Copa',
    mainStat: 'Electro%',
    mainStatValue: 46.6,
    isElemental: true,
    totalRolls: 9,
    subStats: [
        {
            subStatName: 'CR',
            value: 6.2,
            upgrades: [
                { value: 3.1, rv: 80 },
                { value: 3.1, rv: 80 },
            ],
        },
        {
            subStatName: 'CD',
            value: 13.2,
            upgrades: [
                { value: 6.6, rv: 90 },
                { value: 6.6, rv: 90 },
            ],
        },
        {
            subStatName: 'ATK%',
            value: 5.8,
            upgrades: [
                { value: 5.8, rv: 100 },
            ],
        },
        {
            subStatName: 'DEF',
            value: 23,
            upgrades: [
                { value: 23, rv: 100 },
            ],
        },
    ],
};

assert.equal(isMainStatUseful(electroGoblet, dpsStats, true), true);
assert.equal(isMainStatUseful(electroGoblet, dpsStats, false), false);
assert.equal(calculateArtifactRv(electroGoblet, dpsStats), 440);
assert.equal(calculateCritValue(electroGoblet), 25.6);

const analysis = analyzeArtifact(electroGoblet, dpsStats, true);
assert.equal(analysis.currentRv, 440);
assert.equal(analysis.currentMaxRolls, 8);
assert.equal(analysis.theoreticalMaxRolls, 9);
assert.equal(analysis.usefulSubstats.length, 3);

const summary = countArtifactStats([electroGoblet], dpsStats, true);
assert.equal(summary.count, 5);
assert.equal(summary.rollQuality, 440);
assert.equal(summary.principalStatsCount, 1);
assert.equal(summary.artifactBreakDown.Copa.artifRV, 440);

console.log('maximizer-calculator tests passed');
