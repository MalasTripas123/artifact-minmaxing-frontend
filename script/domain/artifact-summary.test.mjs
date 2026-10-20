import test from 'node:test';
import assert from 'node:assert/strict';
import { equippedSets, statRollCounts, statValueTotals } from './artifact-summary.js';

test('set bonuses cover four-piece, two plus two, two-piece and no bonus', () => {
    const sets = names => equippedSets(names.map(set => ({ set })));
    assert.deepEqual(sets(['A','A','A','A','A']), [{ name: 'A', pieces: 4 }]);
    assert.deepEqual(sets(['A','A','B','B','C']), [{ name: 'A', pieces: 2 }, { name: 'B', pieces: 2 }]);
    assert.deepEqual(sets(['A','A','A','B','C']), [{ name: 'A', pieces: 2 }]);
    assert.deepEqual(sets(['A','B','C','D','E']), []);
    assert.deepEqual(sets([]), []);
});
test('filter counts include initial rolls and upgrades across all artifacts', () => {
    const stat = (subStatName, count) => ({ subStatName, upgrades: Array(count).fill({}) });
    assert.deepEqual(statRollCounts([{ subStats: [stat('CR', 4), stat('EM', 2)] }, { subStats: [stat('CR', 3)] }]), { CR: 7, EM: 2 });
});
test('totals sum equipped substat values, excluding main stats and roll rounding', () => {
    const stat = (subStatName, totalValue) => ({ subStatName, totalValue, upgrades: [{ value: 999 }] });
    const artifacts = [10.9, 16.3, 3.9, 5.4, 6.2].map(value => ({ mainStat: 'CR', mainStatValue: 31.1, subStats: [stat('CR', value)] }));
    artifacts[0].subStats.push(stat('EM', 46));
    artifacts[1].subStats.push(stat('EM', 63));
    assert.deepEqual(statValueTotals(artifacts), { CR: 42.7, EM: 109 });
    assert.deepEqual(statValueTotals([]), {});
});
