import test from 'node:test';
import assert from 'node:assert/strict';
import { playerStats, playerImages, playerServer, formatDuration } from './player-profile.js';

test('abyss preserves highest chamber and total stars independently', () => {
    const stats = playerStats({ towerFloorIndex: 12, towerLevelIndex: 3, towerStarIndex: 36 });
    assert.equal(stats.abyss, 36);
    assert.equal(stats.floor, 12);
    assert.equal(stats.chamber, 3);
    assert.equal(playerStats({ towerFloorIndex: 12, towerStarIndex: 35 }).abyss, 35);
    assert.equal(playerStats({ towerFloorIndex: 12 }).abyss, null);
});
test('missing, zero and independent challenge results', () => {
    assert.equal(playerStats().theater, null);
    const stats = playerStats({ theaterStarIndex: 0, theaterActIndex: 10, stygianIndex: 5, stygianSeconds: 331 });
    assert.equal(stats.theater, 0);
    assert.equal(stats.stygianLevel, 5);
    assert.equal(formatDuration(stats.stygianSeconds), '331 s');
    assert.equal(stats.theaterAct, 10);
    assert.equal(stats.theaterArcana, null);
    assert.equal(playerStats({ finishAchievementNum: null }).achievements, null);
});
test('server labels follow Genshin UID regions', () => {
    assert.equal(playerServer('613448890'), 'NA');
    assert.equal(playerServer('700378769'), 'EU');
    assert.equal(playerServer('856012067'), 'ASIA');
    assert.equal(playerServer('1800000000'), 'ASIA');
    assert.equal(playerServer('900000001'), 'TW/HK/MO');
    assert.equal(playerServer('invalid'), '');
});
test('new portraits, legacy costumes, namecards and unknown assets', () => {
    const assets = { pictures: { 1: { iconPath: 'Portrait' } }, characters: { 2: { icon: 'Base', costumes: { 3: { sideIconName: 'UI_AvatarIcon_Side_Skin' } } } }, namecards: { 4: { icon: 'Card' } } };
    assert.deepEqual(playerImages({ profilePicture: { id: 1 }, nameCardId: 4 }, assets),
        { portrait: 'https://enka.network/ui/Portrait.png', namecard: 'https://enka.network/ui/Card.png' });
    assert.equal(playerImages({ profilePicture: { avatarId: 2, costumeId: 3 } }, assets).portrait, 'https://enka.network/ui/UI_AvatarIcon_Skin.png');
    assert.deepEqual(playerImages({}, assets), { portrait: '', namecard: '' });
});
test('current Enka assets preserve extensions and reject external paths', () => {
    assert.deepEqual(playerImages({ profilePicture: { id: 10800 }, nameCardId: 210267 }, {
        pictures: { 10800: { iconPath: '/ui/UI_AvatarIcon_Columbina_Circle.png' } },
        namecards: { 210267: { icon: '/ui/UI_NameCardPic_Columbina_P.jpg' } },
    }), {
        portrait: 'https://enka.network/ui/UI_AvatarIcon_Columbina_Circle.png',
        namecard: 'https://enka.network/ui/UI_NameCardPic_Columbina_P.jpg',
    });
    assert.equal(playerImages({ nameCardId: 1 }, { namecards: { 1: { icon: 'https://other.test/image' } } }).namecard, '');
});
