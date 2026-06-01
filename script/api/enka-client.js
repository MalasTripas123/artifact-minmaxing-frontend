import {
    getBuildById,
    getCharNameById,
    getElementById,
    getGeneratedCharacterAssetsById,
    getManualCharacterAssetNameById,
    hasManualCharacter,
} from '../parcing/character-names.js';
import { t } from '../ui/language.js';

const REMOTE_API_BASE_URL = 'https://artifact-minmaxing-backend.onrender.com';
const LOCAL_API_BASE_URL = 'http://127.0.0.1:3000';

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
    return requestPlayerProfile(uid, {
        path: `/user/${encodeURIComponent(normalizeUid(uid))}`,
        method: 'GET',
    });
}

export async function refreshPlayerProfile(uid) {
    return requestPlayerProfile(uid, {
        path: `/user/${encodeURIComponent(normalizeUid(uid))}/refresh`,
        method: 'POST',
    });
}

async function requestPlayerProfile(uid, { path, method }) {
    const cleanUid = normalizeUid(uid);
    const validationError = validateUid(cleanUid);

    if (validationError) {
        throw new EnkaApiError(validationError, 400);
    }

    let lastConnectionError = null;

    for (const baseUrl of getApiBaseUrls()) {
        let response;
        let data;

        try {
            response = await fetch(`${baseUrl}${path}`, { method });
            data = await response.json().catch(() => ({}));
        } catch (error) {
            lastConnectionError = error;
            continue;
        }

        if (!response.ok || data.error) {
            const apiError = new EnkaApiError(data.error || t('search.notFound'), response.status);
            apiError.retryAfterSeconds = Number(data.retryAfterSeconds) || Number(data.profile?.cache?.cooldownSecondsRemaining) || 0;
            apiError.profile = data.profile ? normalizeEnkaProfile(cleanUid, data.profile) : null;
            throw apiError;
        }

        const profile = normalizeEnkaProfile(cleanUid, data);

        if (!profile.player.nickname) {
            throw new EnkaApiError(t('search.unavailable'), 404);
        }

        return profile;
    }

    throw new EnkaApiError(t('search.connectionError'), lastConnectionError ? 0 : 502);
}

function getApiBaseUrls() {
    const configuredBaseUrl = normalizeApiBaseUrl(globalThis.APP_CONFIG?.apiBaseUrl);
    if (configuredBaseUrl) return [configuredBaseUrl];

    if (isLocalFrontend()) {
        return [LOCAL_API_BASE_URL, REMOTE_API_BASE_URL];
    }

    return [REMOTE_API_BASE_URL];
}

function normalizeApiBaseUrl(baseUrl) {
    if (typeof baseUrl !== 'string') return '';
    return baseUrl.trim().replace(/\/+$/, '');
}

function isLocalFrontend() {
    const hostname = globalThis.location?.hostname || '';
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

export function normalizeEnkaProfile(uid, data) {
    return {
        uid,
        player: normalizePlayer(uid, data?.player),
        characters: Array.isArray(data?.characters)
            ? data.characters.map(normalizeCharacter).filter(Boolean)
            : [],
        cache: normalizeProfileCache(data?.cache),
    };
}

function normalizeProfileCache(cache = {}) {
    return {
        source: typeof cache.source === 'string' ? cache.source : '',
        createdAt: cache.createdAt ?? null,
        updatedAt: cache.updatedAt ?? null,
        lastEnkaRefreshAt: cache.lastEnkaRefreshAt ?? null,
        nextRefreshAt: cache.nextRefreshAt ?? null,
        cooldownSecondsRemaining: Number(cache.cooldownSecondsRemaining) || 0,
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
