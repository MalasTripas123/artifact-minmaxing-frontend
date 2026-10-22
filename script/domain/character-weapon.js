import { weaponContributions } from './weapon-stats.js';

export function characterWeapon(character, weapons = {}, localizations = {}, language = 'es', weaponCurves = {}) {
    const equipped = character.equipList?.find(item => item.weapon);
    if (!equipped) return null;
    const metadata = weapons[equipped.itemId];
    const rawRefinement = Object.values(equipped.weapon.affixMap ?? {})[0];
    const refinement = Number(rawRefinement);
    const level = Number(equipped.weapon.level);
    const rank = rawRefinement != null && Number.isInteger(refinement) && refinement >= 0 && refinement <= 4 ? refinement + 1 : null;
    // Protobuf omits a zero promoteLevel. At ascension boundaries level alone
    // cannot distinguish 20/20 from 20/40.
    const ascension = Number(equipped.weapon.promoteLevel ?? 0);
    const observed = character.fightPropMap ?? {};
    const stats = Object.fromEntries(Object.entries({ FIGHT_PROP_MAX_HP: 2000, FIGHT_PROP_BASE_ATTACK: 4 })
        .filter(([, key]) => Number.isFinite(observed[key])).map(([prop, key]) => [prop, observed[key]]));
    return {
        name: metadata?.names?.[language]
            || localizations[language]?.[String(equipped.flat?.nameTextMapHash)]
            || (language === 'en' ? 'Unknown weapon' : 'Arma sin identificar'),
        level: Number.isInteger(level) && level > 0 ? level : null,
        // Enka's refinement index is zero-based. Weapons without a passive
        // can omit affixMap; do not invent a refinement for those.
        refinement: rank,
        id: String(equipped.itemId),
        ascension: Number.isInteger(ascension) ? ascension : null,
        contributions: weaponContributions(metadata, weaponCurves, { level, ascension, refinement: rank, stats }),
        icon: (Number(equipped.weapon.promoteLevel) >= 2 ? metadata?.awakenedIcon : '') || metadata?.icon || '',
    };
}
