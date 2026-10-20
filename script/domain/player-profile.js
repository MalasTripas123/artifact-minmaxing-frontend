const count = value => (typeof value === 'number' || typeof value === 'string') && value !== ''
    && Number.isInteger(Number(value)) && Number(value) >= 0 ? Number(value) : null;

export function playerStats(player = {}) {
    const floor = count(player.towerFloorIndex);
    const total = count(player.towerStarIndex);
    return {
        achievements: count(player.finishAchievementNum),
        abyss: total, floor, chamber: count(player.towerLevelIndex),
        theater: count(player.theaterStarIndex),
        theaterAct: count(player.theaterActIndex),
        // Enka currently exposes no completed Arcana count. Do not derive it
        // from stars or theaterModeIndex (which encodes the theater mode).
        theaterArcana: null,
        stygianLevel: count(player.stygianIndex),
        stygianSeconds: count(player.stygianSeconds),
    };
}

export function formatDuration(seconds) {
    return `${seconds} s`;
}

export function stygianIcon(level, seconds) {
    const difficulty = count(level);
    const time = count(seconds);
    if (difficulty === null || difficulty < 1 || difficulty > 6) return '';
    const variant = difficulty === 6 && time !== null && time <= 180 ? '6b' : difficulty;
    return `./assets/stygian/${variant}.webp`;
}

export function playerServer(uid) {
    const value = String(uid ?? '');
    if (!/^\d{9,10}$/.test(value)) return '';
    if (value.length === 10) return value.startsWith('18') ? 'ASIA' : '';
    return ({ 1: 'CN', 2: 'CN', 3: 'CN', 5: 'CN', 6: 'NA', 7: 'EU', 8: 'ASIA', 9: 'TW/HK/MO' })[value[0]] ?? '';
}

export function playerImages(player, assets) {
    const picture = player.profilePicture ?? {};
    const character = assets.characters?.[picture.avatarId];
    const portrait = assets.pictures?.[picture.id]?.iconPath
        ?? character?.costumes?.[picture.costumeId]?.Icon
        ?? character?.costumes?.[picture.costumeId]?.sideIconName?.replace('UI_AvatarIcon_Side_', 'UI_AvatarIcon_')
        ?? character?.icon;
    const imageUrl = name => {
        if (typeof name !== 'string') return '';
        if (/^\/ui\/[\w-]+\.(png|jpg|webp)$/.test(name)) return `https://enka.network${name}`;
        return /^[\w-]+$/.test(name) ? `https://enka.network/ui/${name}.png` : '';
    };
    return {
        portrait: imageUrl(portrait),
        namecard: imageUrl(assets.namecards?.[player.nameCardId ?? player.namecardId]?.icon),
    };
}
