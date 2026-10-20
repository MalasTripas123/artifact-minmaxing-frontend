import test from 'node:test';
import assert from 'node:assert/strict';
import { characterConstellation, characterTalents } from './character-talents.js';
import { talentMetadata } from '../../../tools/talent-assets.mjs';

test('C0 is omitted by the grid, unlocked constellations are counted', () => {
    assert.equal(characterConstellation({}), 0);
    assert.equal(characterConstellation({ talentIdList: [521, 522] }), 2);
});
test('talents use SkillOrder, not numeric skill ID order, with proud bonuses', () => {
    const metadata = talentMetadata({
        SkillOrder: [9, 2, 5], Skills: { 9: '/ui/Normal.png', 2: '/ui/Skill.png', 5: '/ui/Burst.png' },
        ProudMap: { 9: 90, 2: 20, 5: 50 },
    });
    const result = characterTalents({ skillLevelMap: { 2: 10, 9: 8, 5: 9 }, proudSkillExtraLevelMap: { 20: 3 } }, metadata);
    assert.deepEqual(result.map(t => t.level), [8, 13, 9]);
    assert.equal(result[1].extra, 3);
    assert.equal(result[1].icon, './assets/talents/Skill.png');
});
test('missing talent metadata or levels are not invented', () => {
    assert.deepEqual(characterTalents({}).map(t => t.level), [null, null, null]);
    assert.equal(characterTalents({ skillLevelMap: {} }, [{ id: 1, kind: 'normal' }])[0].level, null);
    assert.equal(talentMetadata({ SkillOrder: [1], Skills: { 1: '/ui/../../bad.html' } })[0].icon, '');
});
