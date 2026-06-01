import {
    setCurrentPlayer,
    setCurrentPlayerId,
    favorites,
    characters,
    currentSelectedChar,
    currentPlayerId,
    setCharacters,
    setCurrentSelectedChar
} from '../state.js';
import { fetchPlayerProfile, localizeCharacterProfile, normalizeUid, refreshPlayerProfile, validateUid } from '../api/enka-client.js';
import { hideLoading, showLoading } from './loading.js';
import { requestSectionNavigationSync } from './navigation.js';
import { showCharacter } from './character.js';
import { onLanguageChange, t } from './language.js';

const PROFILE_UID_PARAM = 'uid';
let isSearchBusy = false;
let refreshCooldownTimer = null;
let refreshCooldownSeconds = 0;
let isRefreshBusy = false;

// inicia los eventos relevantes de search
export function initSearchEvents() {
    document.getElementById('btn-search').addEventListener('click', () => searchPlayer());
    document.getElementById('refresh-profile-btn').addEventListener('click', refreshCurrentProfile);
    window.addEventListener('popstate', handleProfileUrlChange);
    onLanguageChange(refreshVisibleProfileLanguage);
    renderRefreshButton();
    loadProfileFromUrl();
}

function setSearchError(message = '') {
    document.getElementById('search-error').innerText = message;
}

function setSearchBusy(isBusy) {
    isSearchBusy = isBusy;
    const input = document.getElementById('player-id');
    const button = document.getElementById('btn-search');

    input.disabled = isBusy;
    button.disabled = isBusy;
    button.innerText = isBusy ? t('controls.searching') : t('controls.search');
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function getNameLengthClass(name) {
    if (name.length > 16) return 'ultralong';
    if (name.length > 14) return 'verylong';
    if (name.length > 12) return 'long';
    return '';
}

// busca a un jugador y crea en el HTML los elementos necesarios
export async function searchPlayer(options = {}) {
    if (typeof Event !== 'undefined' && options instanceof Event) options = {};

    const {
        uid: requestedUid = null,
        updateUrl = true,
        replaceUrl = false,
        loadingTitle = t('search.loadingSearch'),
    } = options;

    const input = document.getElementById('player-id');
    const uid = normalizeUid(requestedUid ?? input.value);
    input.value = uid;
    setSearchError('');

    const validationError = validateUid(uid);
    if (validationError) {
        setSearchError(validationError);
        return;
    }

    let profile;
    setSearchBusy(true);

    try {
        showLoading({ title: loadingTitle });
        profile = await fetchPlayerProfile(uid);
    } catch (error) {
        setSearchError(error.message || t('search.genericError'));
        return;
    } finally {
        hideLoading();
        setSearchBusy(false);
    }

    applyProfile(profile, { updateUrl, replaceUrl });
}

async function refreshCurrentProfile() {
    const uid = normalizeUid(currentPlayerId || document.getElementById('player-id').value);
    if (!uid || isRefreshBusy || refreshCooldownSeconds > 0) return;

    isRefreshBusy = true;
    setSearchError('');
    renderRefreshButton();

    try {
        showLoading({ title: t('search.loadingRefresh') });
        const profile = await refreshPlayerProfile(uid);
        applyProfile(profile, { updateUrl: false, keepSelectedCharacter: true });
    } catch (error) {
        if (error.profile) {
            applyProfile(error.profile, { updateUrl: false, keepSelectedCharacter: true });
        }

        if (error.status === 429) {
            const seconds = error.retryAfterSeconds || error.profile?.cache?.cooldownSecondsRemaining || 60;
            setRefreshCooldown(seconds);
            setSearchError(t('search.cooldownError', { seconds }));
            return;
        }

        setSearchError(error.message || t('search.genericError'));
    } finally {
        hideLoading();
        isRefreshBusy = false;
        renderRefreshButton();
    }
}

function applyProfile(profile, {
    updateUrl = true,
    replaceUrl = false,
    keepSelectedCharacter = false,
} = {}) {
    const selectedCharacterId = keepSelectedCharacter ? currentSelectedChar?.avatarId ?? null : null;

    setCurrentPlayerId(profile.uid);
    setCurrentPlayer(profile.player);
    setCharacters(profile.characters);
    setRefreshCooldown(profile.cache?.cooldownSecondsRemaining ?? 0);
    if (updateUrl) setProfileUrl(profile.uid, { replace: replaceUrl });

    document.getElementById('header-section').classList.add('minimized');
    document.getElementById('player-info-bar').style.display = 'flex';
    document.getElementById('display-player-name').innerText = profile.player.nickname;
    document.getElementById('display-player-lv').innerText = 'AR' + profile.player.level;

    const isFav = favorites.find(f => f.id === profile.uid);
    document.getElementById('fav-toggle').classList.toggle('active', !!isFav);

    document.getElementById('results-area').style.display = 'block';
    document.getElementById('character-detail').style.display = selectedCharacterId ? 'block' : 'none';
    if (!selectedCharacterId) setCurrentSelectedChar(null);

    renderCharacterGrid(profile.characters);

    if (selectedCharacterId) {
        showCharacter(selectedCharacterId, false);
    }

    requestSectionNavigationSync();
}

function renderCharacterGrid(profileCharacters = characters) {
    const grid = document.getElementById('char-grid');
    grid.innerHTML = profileCharacters.map(char => {
        const longStyle = getNameLengthClass(char.name);

        return `
        <div class="char-btn" data-id="${char.avatarId}">
            <div class="char-img" id="${char.avatarId}" style="background-image: url(&quot;${escapeHtml(char.assets.profileIcon)}&quot;);"></div>
            <div class="char-name ${longStyle}">${escapeHtml(char.name)}</div>
        </div>`;
    }).join('');
}

function refreshVisibleProfileLanguage() {
    setSearchBusy(isSearchBusy);
    renderRefreshButton();

    const resultsArea = document.getElementById('results-area');
    if (!resultsArea || getComputedStyle(resultsArea).display === 'none') return;

    const localizedCharacters = characters.map(localizeCharacterProfile);
    const selectedCharacterId = currentSelectedChar?.avatarId ?? null;

    setCharacters(localizedCharacters);
    renderCharacterGrid(localizedCharacters);

    if (selectedCharacterId) {
        showCharacter(selectedCharacterId, false);
    }

    requestSectionNavigationSync();
}

function setRefreshCooldown(seconds) {
    refreshCooldownSeconds = Math.max(0, Math.ceil(Number(seconds) || 0));
    renderRefreshButton();
    startRefreshCooldownTimer();
}

function startRefreshCooldownTimer() {
    if (refreshCooldownTimer) {
        clearInterval(refreshCooldownTimer);
        refreshCooldownTimer = null;
    }

    if (refreshCooldownSeconds <= 0) return;

    refreshCooldownTimer = setInterval(() => {
        refreshCooldownSeconds = Math.max(0, refreshCooldownSeconds - 1);
        renderRefreshButton();

        if (refreshCooldownSeconds <= 0) {
            clearInterval(refreshCooldownTimer);
            refreshCooldownTimer = null;
        }
    }, 1000);
}

function renderRefreshButton() {
    const button = document.getElementById('refresh-profile-btn');
    if (!button) return;

    const hasCooldown = refreshCooldownSeconds > 0;
    button.disabled = isRefreshBusy || hasCooldown || !currentPlayerId;
    button.innerText = isRefreshBusy
        ? t('controls.updating')
        : hasCooldown
            ? t('controls.refreshIn', { seconds: refreshCooldownSeconds })
            : t('controls.refreshProfile');
}

// reinicia la busqueda dejando los elementos relevantes en sus respectivos valores iniciales
export function resetSearch({ updateUrl = true } = {}) {
    document.getElementById('header-section').classList.remove('minimized');
    document.getElementById('results-area').style.display = 'none';
    document.getElementById('character-detail').style.display = 'none';
    document.getElementById('player-id').value = '';
    setSearchError('');
    setCurrentPlayerId(null);
    setCurrentPlayer({});
    setCurrentSelectedChar(null);
    setCharacters([]);
    setRefreshCooldown(0);
    if (updateUrl) clearProfileUrl();
    requestSectionNavigationSync();
}

function loadProfileFromUrl() {
    const uid = getProfileUidFromUrl();
    if (!uid) return;

    searchPlayer({
        uid,
        updateUrl: false,
        loadingTitle: t('search.loadingProfile'),
    });
}

function handleProfileUrlChange() {
    const uid = getProfileUidFromUrl();

    if (!uid) {
        resetSearch({ updateUrl: false });
        return;
    }

    searchPlayer({
        uid,
        updateUrl: false,
        loadingTitle: t('search.loadingProfile'),
    });
}

function getProfileUidFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return normalizeUid(params.get(PROFILE_UID_PARAM));
}

function setProfileUrl(uid, { replace = false } = {}) {
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set(PROFILE_UID_PARAM, uid);
    url.hash = '';
    updateHistoryUrl(url, { replace });
}

function clearProfileUrl({ replace = false } = {}) {
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    updateHistoryUrl(url, { replace });
}

function updateHistoryUrl(url, { replace = false } = {}) {
    if (url.href === window.location.href) return;

    const state = { ...(history.state ?? {}) };
    const method = replace ? 'replaceState' : 'pushState';
    history[method](state, '', url);
}
