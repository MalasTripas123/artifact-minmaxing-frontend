import {
    getBuildById,
    getCharNameById,
    getElementById,
    getGeneratedCharacterAssetsById,
    hasManualCharacter,
} from '../parcing/character-names.js';

const API_BASE_URL = 'https://artifact-minmaxing-backend.onrender.com';

export class EnkaApiError extends Error {
    constructor(message, status = 0) {
        super(message);
        this.name = 'EnkaApiError';
        this.status = status;
    }
}

export function normalizeUid(uid) {
    return String(uid ?? '').trim();
}

export function validateUid(uid) {
    if (!uid) return 'Ingresa un UID.';
    if (!/^\d+$/.test(uid)) return 'Ingresa un UID numerico.';
    return '';
}

export async function fetchPlayerProfile(uid) {
    const cleanUid = normalizeUid(uid);
    const validationError = validateUid(cleanUid);

    if (validationError) {
        throw new EnkaApiError(validationError, 400);
    }

    let response;
    let data;

    try {
        response = await fetch(`${API_BASE_URL}/user/${encodeURIComponent(cleanUid)}`);
        data = await response.json().catch(() => ({}));
    } catch (error) {
        throw new EnkaApiError('No se pudo conectar con el servidor.', 0);
    }

    if (!response.ok || data.error) {
        throw new EnkaApiError(data.error || 'Jugador no encontrado.', response.status);
    }

    const profile = normalizeEnkaProfile(cleanUid, data);

    if (!profile.player.nickname) {
        throw new EnkaApiError('Jugador no encontrado o perfil no disponible.', 404);
    }

    return profile;
}

export function normalizeEnkaProfile(uid, data) {
    return {
        uid,
        player: normalizePlayer(uid, data?.player),
        characters: Array.isArray(data?.characters)
            ? data.characters.map(normalizeCharacter).filter(Boolean)
            : [],
    };
}

function normalizePlayer(uid, player = {}) {
    return {
        ...player,
        uid,
        nickname: typeof player.nickname === 'string' ? player.nickname : '',
        level: Number(player.level) || 0,
    };
}

function normalizeCharacter(character) {
    if (!character || character.avatarId == null) return null;

    const avatarId = Number(character.avatarId);
    if (!Number.isFinite(avatarId)) return null;

    const name = getCharNameById(avatarId);
    const element = getElementById(avatarId);

    return {
        ...character,
        avatarId,
        name,
        element,
        level: Number(character.propMap?.[4001]?.ival) || 0,
        builds: getBuildById(avatarId),
        assets: getCharacterAssets(avatarId, name, element),
        propMap: character.propMap || {},
        fightPropMap: character.fightPropMap || {},
        equipList: Array.isArray(character.equipList) ? character.equipList : [],
    };
}

function getCharacterAssets(avatarId, name, element) {
    const generatedAssets = getGeneratedCharacterAssetsById(avatarId);
    const useGeneratedAssets = generatedAssets && !hasManualCharacter(avatarId);

    return {
        profileIcon: useGeneratedAssets ? generatedAssets.profileIcon : `./assets/pfp/${name}_Icon.webp`,
        banner: useGeneratedAssets ? generatedAssets.banner : `./assets/gacha-img/${name}.png`,
        elementIcon: element ? `./assets/elements/${element.toLowerCase()}.webp` : '',
    };
}
