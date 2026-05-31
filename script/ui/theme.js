const THEME_STORAGE_KEY = 'artifactMinmaxingTheme';
const THEME_COOKIE_NAME = 'artifactMinmaxingTheme';
const WINDOW_NAME_KEY = 'artifactMinmaxing';
const THEME_DROPDOWN_MARK = '\u25BE';

function getThemeOptions() {
    return Array.from(document.querySelectorAll('.theme-opt'));
}

function getThemeOption(theme) {
    return getThemeOptions().find(option => option.dataset.theme === theme);
}

function getStoredTheme() {
    const storedTheme = getSessionStorageTheme();
    if (storedTheme) return storedTheme;

    return getThemeCookie() || getWindowNameTheme() || getHistoryTheme();
}

function saveTheme(theme) {
    const savedInSessionStorage = saveSessionStorageTheme(theme);

    saveHistoryTheme(theme);

    if (savedInSessionStorage) return;

    saveThemeCookie(theme);
    saveWindowNameTheme(theme);
}

function getSessionStorageTheme() {
    try {
        return window.sessionStorage?.getItem(THEME_STORAGE_KEY) ?? null;
    } catch (error) {
        return null;
    }
}

function saveSessionStorageTheme(theme) {
    try {
        if (!window.sessionStorage) return false;

        window.sessionStorage.setItem(THEME_STORAGE_KEY, theme);
        return true;
    } catch (error) {
        return false;
    }
}

function getThemeCookie() {
    try {
        const prefix = `${THEME_COOKIE_NAME}=`;
        const cookie = document.cookie
            .split('; ')
            .find(item => item.startsWith(prefix));

        return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
    } catch (error) {
        return null;
    }
}

function saveThemeCookie(theme) {
    try {
        document.cookie = `${THEME_COOKIE_NAME}=${encodeURIComponent(theme)}; path=/; SameSite=Lax`;
    } catch (error) {
        // Algunas superficies bloquean cookies; quedan los otros respaldos de sesion.
    }
}

function getWindowNameState() {
    try {
        return window.name ? JSON.parse(window.name) : {};
    } catch (error) {
        return {};
    }
}

function getWindowNameTheme() {
    const state = getWindowNameState();
    return state?.[WINDOW_NAME_KEY]?.theme ?? null;
}

function saveWindowNameTheme(theme) {
    try {
        const state = getWindowNameState();
        state[WINDOW_NAME_KEY] = {
            ...(state[WINDOW_NAME_KEY] ?? {}),
            theme,
        };
        window.name = JSON.stringify(state);
    } catch (error) {
        // Si tambien falla, el tema solo vive hasta que se recargue la pagina.
    }
}

function getHistoryTheme() {
    try {
        return history.state?.[WINDOW_NAME_KEY]?.theme ?? null;
    } catch (error) {
        return null;
    }
}

function saveHistoryTheme(theme) {
    try {
        const state = {
            ...(history.state ?? {}),
            [WINDOW_NAME_KEY]: {
                ...(history.state?.[WINDOW_NAME_KEY] ?? {}),
                theme,
            },
        };
        history.replaceState(state, '', location.href);
    } catch (error) {
        // Ultimo respaldo no disponible.
    }
}

function applyTheme(theme, text) {
    document.body.setAttribute('data-theme', theme);
    document.getElementById('theme-selector-btn').innerText = `Tema: ${text} ${THEME_DROPDOWN_MARK}`;
}

function loadStoredTheme() {
    const storedTheme = getStoredTheme();
    if (!storedTheme) return;

    const option = getThemeOption(storedTheme);
    if (!option) return;

    applyTheme(storedTheme, option.innerText);
}

// inicia los elementos relacionados a los temas
export function initThemeEvents() {
    loadStoredTheme();

    getThemeOptions().forEach(el => {
        el.addEventListener('click', () => {
            setTheme(el.dataset.theme, el.innerText);
        });
    });

    document.getElementById('theme-selector-btn')
        .addEventListener('click', () => {
            document.getElementById('theme-opts').classList.toggle('show');
        });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.theme-selector')) {
            document.getElementById('theme-opts').classList.remove('show');
        }
    });
}

// recibe un string con la indicacion del tema, modifica el data-theme del body y persiste la eleccion durante la sesion
export function setTheme(theme, txt) {
    const option = getThemeOption(theme);
    if (!option) return;

    applyTheme(theme, txt || option.innerText);
    saveTheme(theme);
    document.getElementById('theme-opts').classList.remove('show');
}
