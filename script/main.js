import { initThemeEvents } from './ui/theme.js';
import { initFavoritesEvents, updateFavorites } from './ui/favorites.js';
import { initSearchEvents } from './ui/search.js';
import { initPlayerEvents } from './ui/player.js';
import { initCharacterEvents } from './ui/character.js';
import { initMaximizerEvents } from './ui/maximizer.js';

//console.log('CONECTADO AL MAIN');

initThemeEvents();
initFavoritesEvents();
initSearchEvents();
initPlayerEvents();
initCharacterEvents();
initMaximizerEvents();

updateFavorites();