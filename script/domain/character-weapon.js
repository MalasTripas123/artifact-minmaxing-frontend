export function characterWeapon(character, weapons = {}, localizations = {}, language = 'es') {
    const equipped = character.equipList?.find(item => item.weapon);
    if (!equipped) return null;
    const metadata = weapons[equipped.itemId];
    const rawRefinement = Object.values(equipped.weapon.affixMap ?? {})[0];
    const refinement = Number(rawRefinement);
    const level = Number(equipped.weapon.level);
    return {
        name: metadata?.names?.[language]
            || localizations[language]?.[String(equipped.flat?.nameTextMapHash)]
            || (language === 'en' ? 'Unknown weapon' : 'Arma sin identificar'),
        level: Number.isInteger(level) && level > 0 ? level : null,
        // Enka's refinement index is zero-based. Weapons without a passive
        // can omit affixMap; do not invent a refinement for those.
        refinement: rawRefinement != null && Number.isInteger(refinement) && refinement >= 0 && refinement <= 4 ? refinement + 1 : null,
        icon: (Number(equipped.weapon.promoteLevel) >= 2 ? metadata?.awakenedIcon : '') || metadata?.icon || '',
    };
}
