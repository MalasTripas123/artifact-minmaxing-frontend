import { setCurrentPlayer, currentPlayer, favorites, setCharacters, characters } from '../state.js';
import { showCharacter } from './character.js';
import { getCharNameById, getElementById } from '../parcing/character-names.js';

// inicia los eventos relevantes de search
export function initSearchEvents() {
    // le agrega el evento click al botón de buscar
    // el evento llama a searchPlayer()
    document.getElementById('btn-search').addEventListener('click', searchPlayer);
}

// busca a un jugador y crea en el HTML los elementos necesarios
export async function searchPlayer() {
    // asigna a uid el contenido del cuadro de búsqueda 'player-id' trimeado
    const uid = document.getElementById('player-id').value.trim();
    // si el contenido es falsy retorna
    if (!uid) return; //TODO agregar validaciones de UID

    const response = await fetch("http://localhost:3000/user/" + uid);
    const data = await response.json();

    if (!data.player.nickname) return;
    if (data.error) return;

    setCurrentPlayer(data.player);
    setCharacters(data.characters);

    // le agrega la etiqueta class="minimized" a la sección 'header-section'
    document.getElementById('header-section').classList.add('minimized');
    // cambia la etiqueta style="display: none;" de 'player-info-bar' por 'flex'
    document.getElementById('player-info-bar').style.display = 'flex';

    // cambia el texto de 'display-player-name', por el nombre del jugador actual
    document.getElementById('display-player-name').innerText = currentPlayer.nickname;
    document.getElementById('display-player-lv').innerText = 'AR' + currentPlayer.level;

    // la variable isFav representa si el jugador encontrado es favorito - hace find en la lista favorites verificando que la propiedad id sea igual a la id ingresada
    const isFav = favorites.find(f => f.id === uid);
    // agrega la clase 'active' si !!isFav es true, si no, la quita
    document.getElementById('fav-toggle').classList.toggle('active', !!isFav);

    // cambia la etiqueta display-style de none por block para que sea visible
    document.getElementById('results-area').style.display = 'block';
    // oculta la sección de detalles de personaje (ya que se está eligiendo un nuevo jugador, si había uno antes)
    document.getElementById('character-detail').style.display = 'none';
    // asigna a grid el elemento 'char-grid'
    const grid = document.getElementById('char-grid');
    // cambia el HTML interior de 'char-grid'
    // itera con map la lista de personajes
    grid.innerHTML = characters.map(char => {
        char.name = getCharNameById(char.avatarId);
        char.element = getElementById(char.avatarId);
        // hace una variable bool según si el nombre es más largo de 12 caracteres - se usa para cambiar la etiqueta class del div del nombre
        const isLong = char.name.length > 12;
        let longStyle = '';
        if (char.name.length > 12) longStyle = 'long';
        if (char.name.length > 14) longStyle = 'verylong';
        if (char.name.length > 16) longStyle = 'ultralong';
        // retorna un cuadro de personaje por cada personaje en la lista
        return `
        <div class="char-btn" data-id="${char.avatarId}">
            <div class="char-img" id="${char.avatarId}" style="background-image: ${`url('./assets/pfp/${char.name.toLowerCase() + '_Icon'}.webp')`};"></div>
            <div class="char-name ${longStyle}">${char.name}</div>
        </div>`
    }).join('');
    // <div style="font-size:0.7rem; color:var(--primary-purple); margin-top:5px">
    //     Nivel ${char.propMap[4001].ival}
    // </div>
    //document.getElementById(char.avatarId).style.backgroundImage = `url('./assets/pfp/${char.element.toLowerCase() + '_Icon'}.webp')`;
}

// reinicia la búsqueda dejando los elementos relevantes en sus respectivos valores iniciales
export function resetSearch() {
    document.getElementById('header-section').classList.remove('minimized');
    document.getElementById('results-area').style.display = 'none';
    document.getElementById('character-detail').style.display = 'none';
    document.getElementById('player-id').value = '';
    setCurrentPlayer({});
}