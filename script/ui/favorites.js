import { setFavorites, favorites, currentPlayerId } from '../state.js';
import { searchPlayer } from './search.js';

// inicia los elementos relacionados a los favoritos
export function initFavoritesEvents() {
  // le agrega el evento click al botón de agregar/quitar favorito en el perfil del jugador
  // el evento llama a toggleFavorite()
  document.getElementById('fav-toggle').addEventListener('click', toggleFavorite);
  // le agrega el evento 'click' al botón de la lista desplegable de favoritos
  // el evento llama a toggleFavMenu(e)
  document.getElementById('fav-menu-btn').addEventListener('click', (e) => {
      toggleFavMenu(e);
  });

  // selecciona el contenedor (lista) de los favoritos
  const list = document.getElementById('favorites-list');

  // añade el evento 'click' a la lista de favoritos
  list.addEventListener('click', (e) => {
    // el evento crea dos variables que representan el item de favorito y su botón de eliminar
    const del = e.target.closest('.del-fav-btn');
    const item = e.target.closest('.fav-item');
    // si la variable del botón de eliminar es truthy, actualiza la lista de favoritos con todos los favoritos menos el que se elimina está eliminando y retorna
    if (del) {
      setFavorites(favorites.filter(f => f.id !== del.dataset.id));
      updateFavorites();
      return;
    }
    // si del sale falsy, continúa la función y comprueba que la variable del item en sea truthy
    // si es truthy, pone en el input de busqueda el valor de item.dataset.id que es la id del jugador favorito, y llama a searchPlayer()
    if (item) {
      document.getElementById('player-id').value = item.dataset.id;
      toggleFavMenu(e); //oculta el menú al buscar un favorito
      searchPlayer();
      
    }
  });
  // agrega un evento click al documento
  // cuando ocurre, si el objetivo más cercano al evento NO es la lista de favoritos, se oculta
  document.addEventListener('click', (e) => {
      if (!e.target.closest('.favorites-dropdown')) {
          document.getElementById('favorites-list').classList.remove('show');
      }
  });
}

// actualiza la lista de favoritos en el HTML
export function updateFavorites() {
  // selecciona el contenedor (lista) de items favoritos
  const list = document.getElementById('favorites-list');
  // por cada elemento en favorites añade un contenedor 'fav-item'
  // dentro de ese contenedor se agrega el nombre del favorito y un botón de eliminar 'del-fav-btn'
  list.innerHTML = favorites.map(fav => `
    <div class="fav-item" data-id="${fav.id}">
      <b>${fav.name}</b>
      <div class="del-fav-btn" data-id="${fav.id}">🗑️</div>
    </div>
  `).join('');
}

// alterna el estado de favorito de un jugador
function toggleFavorite() {
  // selecciona el botón de estrella de agregar o quitar favorito en el perfil del jugador
  const btn = document.getElementById('fav-toggle');
  // en una variable guarda si está activo o no (true/false) desde el HTML
  const isActive = btn.classList.toggle('active');
  // en una variable guarda el nombre del jugador activo desde el HTML
  const playerName = document.getElementById('display-player-name').innerText;
  
  // si está activo (que es favorito)
  if (isActive) {
      if (!favorites.find(f => f.id === currentPlayerId)) {
          favorites.push({ id: currentPlayerId, name: playerName, level: 60 });
      }
  } else {
    setFavorites(favorites.filter(f => f.id !== currentPlayerId));
  }
  updateFavorites();
}

// alterna la visibilidad de la lista de jugadores favoritos
function toggleFavMenu(e) { 
  e.stopPropagation();
  if (favorites.length === 0) return; //TODO agregar un cuadro que se despliegue en la lista de jugadores que diga que no hay jugadores favoritos
  document.getElementById('favorites-list').classList.toggle('show'); 
}