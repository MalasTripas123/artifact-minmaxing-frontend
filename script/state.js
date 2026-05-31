// variables que mantienen el estado de la app

// determina si el equipo se ve como elementos fijos o desplazables. 'scrollable'
export let eqViewMode = 'fixed';
export function setEqViewMode(val) { eqViewMode = val; }
// representa al personaje actualmente seleccionado
export let currentSelectedChar = null;
export function setCurrentSelectedChar(val) { currentSelectedChar = val; }
// representa la id del jugador que se está viendo
export let currentPlayerId = null;
export function setCurrentPlayerId(val) { currentPlayerId = val; }
//
export let currentPlayer = {};
export function setCurrentPlayer(val) { currentPlayer = val; }
// representa los atributos seleccionados en el maximizador
export let selectedFilterStats = new Set();
// determina si se seleccionó con o sin daño elemental en el maximizador
export let elementalCupEnabled = false;
export function setElementalCupEnabled(val) { elementalCupEnabled = val; }
// un objeto que se llena con la cantidad de atributos iniciales de un artefacto
export let gearInitialStats = {};
// un arreglo de objetos que representan a un jugador en la lista de favoritos
export let favorites = [];
export function setFavorites(val) { favorites = val; }
// un arreglo de objetos que representan los personajes que tiene un jugador
export let characters = [];
export function setCharacters(val) { characters = val; }

const mockChars = [
  { id: 1, name: "Raiden Shogun", level: 90, element: "⚡", icon: "👤" },
  { id: 2, name: "Kaedehara Kazuha", level: 90, element: "🍃", icon: "👤" },
  { id: 3, name: "Zhongli", level: 90, element: "🔶", icon: "👤" },
  { id: 4, name: "Nahida", level: 85, element: "🌿", icon: "👤" },
  { id: 5, name: "Furina", level: 88, element: "💧", icon: "👤" },
  { id: 6, name: "Yelan", level: 90, element: "💧", icon: "👤" }
];
//characters = mockChars;








