import {
    getBuildById,
    getCharNameById,
    getElementById,
    getGeneratedCharacterAssetsById,
    getManualCharacterAssetNameById,
    hasManualCharacter,
} from '../parcing/character-names.js';
import { t } from '../ui/language.js';

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
    if (!uid) return t('search.uidRequired');
    if (!/^\d+$/.test(uid)) return t('search.uidNumeric');
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
        throw new EnkaApiError(t('search.connectionError'), 0);
    }

    if (!response.ok || data.error) {
        throw new EnkaApiError(data.error || t('search.notFound'), response.status);
    }

    const profile = normalizeEnkaProfile(cleanUid, data);

    if (!profile.player.nickname) {
        throw new EnkaApiError(t('search.unavailable'), 404);
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

    return localizeCharacterProfile({
        ...character,
        avatarId,
        level: Number(character.propMap?.[4001]?.ival) || 0,
        propMap: character.propMap || {},
        fightPropMap: character.fightPropMap || {},
        equipList: Array.isArray(character.equipList) ? character.equipList : [],
    });
}

export function localizeCharacterProfile(character) {
    const avatarId = Number(character?.avatarId);
    const name = getCharNameById(avatarId);
    const element = getElementById(avatarId);

    return {
        ...character,
        avatarId,
        name,
        element,
        builds: getBuildById(avatarId),
        assets: getCharacterAssets(avatarId, element),
    };
}

function getCharacterAssets(avatarId, element) {
    const generatedAssets = getGeneratedCharacterAssetsById(avatarId);
    const useGeneratedAssets = generatedAssets && !hasManualCharacter(avatarId);
    const assetName = getManualCharacterAssetNameById(avatarId);

    return {
        profileIcon: useGeneratedAssets ? generatedAssets.profileIcon : `./assets/pfp/${assetName}_Icon.webp`,
        banner: useGeneratedAssets ? generatedAssets.banner : `./assets/gacha-img/${assetName}.png`,
        elementIcon: element ? `./assets/elements/${element.toLowerCase()}.webp` : '',
    };
}
