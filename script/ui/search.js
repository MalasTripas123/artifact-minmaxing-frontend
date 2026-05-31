import {
    setCurrentPlayer,
    setCurrentPlayerId,
    favorites,
    setCharacters,
    setCurrentSelectedChar
} from '../state.js';
import { fetchPlayerProfile, normalizeUid, validateUid } from '../api/enka-client.js';
import { hideLoading, showLoading } from './loading.js';
import { requestSectionNavigationSync } from './navigation.js';

const PROFILE_UID_PARAM = 'uid';

// inicia los eventos relevantes de search
export function initSearchEvents() {
    document.getElementById('btn-search').addEventListener('click', () => searchPlayer());
    window.addEventListener('popstate', handleProfileUrlChange);
    loadProfileFromUrl();
}

function setSearchError(message = '') {
    document.getElementById('search-error').innerText = message;
}

function setSearchBusy(isBusy) {
    const input = document.getElementById('player-id');
    const button = document.getElementById('btn-search');

    input.disabled = isBusy;
    button.disabled = isBusy;
    button.innerText = isBusy ? 'BUSCANDO' : 'BUSCAR';
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
        loadingTitle = 'Buscando jugador',
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
        setSearchError(error.message || 'No se pudo buscar el jugador.');
        return;
    } finally {
        hideLoading();
        setSearchBusy(false);
    }

    setCurrentPlayerId(profile.uid);
    setCurrentPlayer(profile.player);
    setCharacters(profile.characters);
    if (updateUrl) setProfileUrl(profile.uid, { replace: replaceUrl });

    document.getElementById('header-section').classList.add('minimized');
    document.getElementById('player-info-bar').style.display = 'flex';
    document.getElementById('display-player-name').innerText = profile.player.nickname;
    document.getElementById('display-player-lv').innerText = 'AR' + profile.player.level;

    const isFav = favorites.find(f => f.id === profile.uid);
    document.getElementById('fav-toggle').classList.toggle('active', !!isFav);

    document.getElementById('results-area').style.display = 'block';
    document.getElementById('character-detail').style.display = 'none';
    setCurrentSelectedChar(null);

    const grid = document.getElementById('char-grid');
    grid.innerHTML = profile.characters.map(char => {
        const longStyle = getNameLengthClass(char.name);

        return `
        <div class="char-btn" data-id="${char.avatarId}">
            <div class="char-img" id="${char.avatarId}" style="background-image: url(&quot;${escapeHtml(char.assets.profileIcon)}&quot;);"></div>
            <div class="char-name ${longStyle}">${escapeHtml(char.name)}</div>
        </div>`;
    }).join('');

    requestSectionNavigationSync();
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
    if (updateUrl) clearProfileUrl();
    requestSectionNavigationSync();
}

function loadProfileFromUrl() {
    const uid = getProfileUidFromUrl();
    if (!uid) return;

    searchPlayer({
        uid,
        updateUrl: false,
        loadingTitle: 'Cargando perfil',
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
        loadingTitle: 'Cargando perfil',
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
