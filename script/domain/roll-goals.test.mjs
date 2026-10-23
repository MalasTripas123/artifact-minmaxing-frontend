import test from 'node:test';
import assert from 'node:assert/strict';
import { applyRollGoals, compareRollGoals } from './roll-goals.js';
import { countArtifactStats, analyzeArtifact, calculateArtifactRv, calculateCritValue } from './maximizer-calculator.js';
import { statRollCounts } from './artifact-summary.js';

const sub = (subStatName, rolls) => ({ subStatName, value: 99, totalValue: 99, upgrades: rolls.map(rv => ({ rv, value: rv / 10 })) });
const artifacts = [
    { type: 'Flor', mainStat: 'HP', totalRolls: 9, subStats: [sub('ER', [70, 100]), sub('CR', [80])] },
    { type: 'Pluma', mainStat: 'ATK', totalRolls: 8, subStats: [sub('ER', [90, 80]), sub('CR', [100])] },
];
const selected = new Set(['ER', 'CR']);

test('unmodified goals retain all equipped rolls and no comparisons', () => {
    assert.equal(applyRollGoals(artifacts), artifacts);
    assert.deepEqual(compareRollGoals(statRollCounts(artifacts), {}), {});
});

test('global caps keep the best rolls across pieces without changing equipment data', () => {
    const before = structuredClone(artifacts);
    const capped = applyRollGoals(artifacts, { ER: 2 });
    assert.deepEqual(statRollCounts(capped), { ER: 2, CR: 2 });
    assert.deepEqual(capped.map(a => a.subStats[0].upgrades.map(up => up.rv)), [[100], [90]]);
    assert.deepEqual(capped.map(a => a.subStats[0].excludedRolls), [1, 1]);
    assert.deepEqual(artifacts, before);
    assert.equal(calculateCritValue(capped[0]), calculateCritValue(artifacts[0]));
});

test('counts, RV and per-piece analysis agree on the exact same retained rolls', () => {
    const capped = applyRollGoals(artifacts, { ER: 2 });
    const summary = countArtifactStats(capped, selected);
    assert.equal(summary.count, 4);
    assert.equal(summary.rollQuality, 370);
    const pieceRv = capped.map(piece => analyzeArtifact(piece, selected).currentRv);
    assert.deepEqual(pieceRv, [180, 190]);
    assert.equal(summary.rollQuality, pieceRv.reduce((a, b) => a + b, 0));
    assert.equal(summary.rollQuality, capped.reduce((sum, piece) => sum + calculateArtifactRv(piece, selected), 0));
    assert.equal(countArtifactStats(artifacts, selected).count - summary.count, 2);
});

test('raising goals reports missing rolls but never fabricates equipped rolls', () => {
    const goals = { ER: 8, EM: 2 };
    const capped = applyRollGoals(artifacts, goals);
    assert.deepEqual(statRollCounts(capped), statRollCounts(artifacts));
    assert.deepEqual(compareRollGoals(statRollCounts(artifacts), goals), {
        ER: { current: 4, target: 8, missing: 4, excess: 0 },
        EM: { current: 0, target: 2, missing: 2, excess: 0 },
    });
});

test('zero targets remove all rolls of that stat, keep other stats and break quality ties consistently', () => {
    const capped = applyRollGoals(artifacts, { ER: 0 });
    assert.equal(countArtifactStats(capped, selected).count, 2);
    assert.equal(countArtifactStats(capped, selected).rollQuality, 180);
    const ties = [0, 1].map(() => ({ subStats: [sub('ER', [100, 100])] }));
    assert.deepEqual(applyRollGoals(ties, { ER: 1 }).map(a => a.subStats[0].upgrades.length), [1, 0]);
    assert.deepEqual(compareRollGoals({ ER: 4 }, { ER: 0 }), { ER: { current: 4, target: 0, missing: 0, excess: 4 } });
});
