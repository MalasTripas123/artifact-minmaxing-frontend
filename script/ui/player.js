import { resetSearch } from './search.js';

// inicia los eventos relacionados a el jugador
export function initPlayerEvents() {
    // evento de cerrar jugador (reinicia la búsqueda)
    document.getElementById('close-btn').addEventListener('click', resetSearch);
}
