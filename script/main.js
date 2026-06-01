import { initThemeEvents } from './ui/theme.js';
import { initLanguageEvents } from './ui/language.js';
import { initFavoritesEvents, updateFavorites } from './ui/favorites.js';
import { initSearchEvents } from './ui/search.js';
import { initPlayerEvents } from './ui/player.js';
import { initCharacterEvents } from './ui/character.js';
import { initMaximizerEvents } from './ui/maximizer.js';
import { initSectionNavigation } from './ui/navigation.js';

//console.log('CONECTADO AL MAIN');

initLanguageEvents();
initThemeEvents();
initSectionNavigation();
initFavoritesEvents();
initSearchEvents();
initPlayerEvents();
initCharacterEvents();
initMaximizerEvents();

updateFavorites();
