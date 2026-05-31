import {
    setCurrentPlayer,
    setCurrentPlayerId,
    favorites,
    setCharacters
} from '../state.js';
import { fetchPlayerProfile, normalizeUid, validateUid } from '../api/enka-client.js';
import { hideLoading, showLoading } from './loading.js';

// inicia los eventos relevantes de search
export function initSearchEvents() {
    document.getElementById('btn-search').addEventListener('click', searchPlayer);
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
export async function searchPlayer() {
    const uid = normalizeUid(document.getElementById('player-id').value);
    setSearchError('');

    const validationError = validateUid(uid);
    if (validationError) {
        setSearchError(validationError);
        return;
    }

    let profile;
    showLoading();
    setSearchBusy(true);

    try {
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

    document.getElementById('header-section').classList.add('minimized');
    document.getElementById('player-info-bar').style.display = 'flex';
    document.getElementById('display-player-name').innerText = profile.player.nickname;
    document.getElementById('display-player-lv').innerText = 'AR' + profile.player.level;

    const isFav = favorites.find(f => f.id === profile.uid);
    document.getElementById('fav-toggle').classList.toggle('active', !!isFav);

    document.getElementById('results-area').style.display = 'block';
    document.getElementById('character-detail').style.display = 'none';

    const grid = document.getElementById('char-grid');
    grid.innerHTML = profile.characters.map(char => {
        const longStyle = getNameLengthClass(char.name);

        return `
        <div class="char-btn" data-id="${char.avatarId}">
            <div class="char-img" id="${char.avatarId}" style="background-image: url(&quot;${escapeHtml(char.assets.profileIcon)}&quot;);"></div>
            <div class="char-name ${longStyle}">${escapeHtml(char.name)}</div>
        </div>`;
    }).join('');
}

// reinicia la busqueda dejando los elementos relevantes en sus respectivos valores iniciales
export function resetSearch() {
    document.getElementById('header-section').classList.remove('minimized');
    document.getElementById('results-area').style.display = 'none';
    document.getElementById('character-detail').style.display = 'none';
    document.getElementById('player-id').value = '';
    setSearchError('');
    setCurrentPlayerId(null);
    setCurrentPlayer({});
    setCharacters([]);
}
