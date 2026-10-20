import test from 'node:test';
import assert from 'node:assert/strict';
import { characterWeapon } from './character-weapon.js';
import { weaponMetadata } from '../../../tools/weapon-assets.mjs';

const weapons = weaponMetadata({ 13509: {
    Icon: '/ui/UI_EquipIcon_Pole_Narukami.png',
    AwakenIcon: '/ui/UI_EquipIcon_Pole_Narukami_Awaken.png',
    NameTextMapHash: 123,
} }, { es: { 123: 'Luz del Segador' }, en: { 123: 'Engulfing Lightning' } });
const character = (refinement, promoteLevel = 6) => ({ equipList: [
    { reliquary: {}, flat: {} },
    { itemId: 13509, weapon: { level: 90, promoteLevel, affixMap: refinement == null ? {} : { 113509: refinement } } },
] });

test('equipped weapon uses localized name, level, and one-based refinement', () => {
    const weapon = characterWeapon(character(0), weapons);
    assert.equal(weapon.name, 'Luz del Segador');
    assert.equal(weapon.level, 90);
    assert.equal(weapon.refinement, 1);
    assert.equal(characterWeapon(character(4), weapons, {}, 'en').name, 'Engulfing Lightning');
    assert.equal(characterWeapon(character(4), weapons).refinement, 5);
});
test('weapon artwork follows ascension and handles missing data', () => {
    assert.equal(characterWeapon(character(0), weapons).icon, './assets/weapons/UI_EquipIcon_Pole_Narukami_Awaken.png');
    assert.equal(characterWeapon(character(0, 0), weapons).icon, './assets/weapons/UI_EquipIcon_Pole_Narukami.png');
    assert.equal(characterWeapon(character(null), weapons).refinement, null);
    assert.equal(characterWeapon(character(0)).icon, '');
    assert.equal(characterWeapon({ equipList: [] }), null);
});
