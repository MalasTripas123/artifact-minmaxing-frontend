import { setFavorites, favorites, currentPlayerId } from '../state.js';
import { searchPlayer } from './search.js';

const FAVORITES_STORAGE_KEY = 'artifactMinmaxingFavorites';

function isValidFavorite(favorite) {
  return favorite && typeof favorite.id === 'string' && favorite.id && typeof favorite.name === 'string';
}

function loadFavorites() {
  try {
    const storedFavorites = sessionStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!storedFavorites) {
      setFavorites([]);
      return;
    }

    const parsedFavorites = JSON.parse(storedFavorites);
    setFavorites(Array.isArray(parsedFavorites) ? parsedFavorites.filter(isValidFavorite) : []);
  } catch (error) {
    setFavorites([]);
  }
}

function saveFavorites() {
  try {
    sessionStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  } catch (error) {
    // If sessionStorage is unavailable, favorites still work in memory.
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function initFavoritesEvents() {
  loadFavorites();

  document.getElementById('fav-toggle').addEventListener('click', toggleFavorite);
  document.getElementById('fav-menu-btn').addEventListener('click', toggleFavMenu);

  const list = document.getElementById('favorites-list');
  list.addEventListener('click', (e) => {
    const del = e.target.closest('.del-fav-btn');
    const item = e.target.closest('.fav-item');

    if (del) {
      setFavorites(favorites.filter(f => f.id !== del.dataset.id));
      saveFavorites();
      updateFavorites();

      if (del.dataset.id === currentPlayerId) {
        document.getElementById('fav-toggle').classList.remove('active');
      }
      return;
    }

    if (item && item.dataset.id) {
      document.getElementById('player-id').value = item.dataset.id;
      toggleFavMenu(e);
      searchPlayer();
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.favorites-dropdown')) {
      document.getElementById('favorites-list').classList.remove('show');
    }
  });
}

export function updateFavorites() {
  const list = document.getElementById('favorites-list');

  if (favorites.length === 0) {
    list.innerHTML = '<div class="fav-item empty">Sin favoritos en esta sesion</div>';
    return;
  }

  list.innerHTML = favorites.map(fav => `
    <div class="fav-item" data-id="${escapeHtml(fav.id)}">
      <b>${escapeHtml(fav.name)}</b>
      <div class="del-fav-btn" data-id="${escapeHtml(fav.id)}">&times;</div>
    </div>
  `).join('');
}

function toggleFavorite() {
  if (!currentPlayerId) return;

  const btn = document.getElementById('fav-toggle');
  const isActive = btn.classList.toggle('active');
  const playerName = document.getElementById('display-player-name').innerText;

  if (isActive) {
    if (!favorites.find(f => f.id === currentPlayerId)) {
      setFavorites([...favorites, { id: currentPlayerId, name: playerName }]);
    }
  } else {
    setFavorites(favorites.filter(f => f.id !== currentPlayerId));
  }

  saveFavorites();
  updateFavorites();
}

function toggleFavMenu(e) {
  e.stopPropagation();
  document.getElementById('favorites-list').classList.toggle('show');
}
