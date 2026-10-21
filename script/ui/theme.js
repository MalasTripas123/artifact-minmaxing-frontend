import { currentSelectedChar } from '../state.js';
import { onLanguageChange, t } from './language.js';

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

function getAppliedTheme() {
    return document.body.getAttribute('data-theme') || 'dark';
}

function getThemeText(theme) {
    return t(`themes.${theme}`);
}

function getStoredTheme() {
    const storedTheme = getPersistentStorageTheme() || getSessionStorageTheme();
    if (storedTheme) return storedTheme;

    return getThemeCookie() || getWindowNameTheme() || getHistoryTheme();
}

function saveTheme(theme) {
    const savedInPersistentStorage = savePersistentStorageTheme(theme);

    saveHistoryTheme(theme);

    if (savedInPersistentStorage) return;

    saveSessionStorageTheme(theme);
    saveThemeCookie(theme);
    saveWindowNameTheme(theme);
}

function getPersistentStorageTheme() {
    try {
        return window.localStorage?.getItem(THEME_STORAGE_KEY) ?? null;
    } catch (error) {
        return null;
    }
}

function savePersistentStorageTheme(theme) {
    try {
        if (!window.localStorage) return false;

        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
        return true;
    } catch (error) {
        return false;
    }
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

function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    const button = document.getElementById('theme-selector-btn');
    button.innerText = `${t('controls.theme')}: ${getThemeText(theme)} ${THEME_DROPDOWN_MARK}`;
    button.dataset.shortLabel = t('controls.theme');
}

function loadStoredTheme() {
    const storedTheme = getStoredTheme();
    const theme = getThemeOption(storedTheme) ? storedTheme : getAppliedTheme();

    applyTheme(theme);
    if (storedTheme) saveTheme(theme);
}

// inicia los elementos relacionados a los temas
export function initThemeEvents() {
    loadStoredTheme();
    if (['dark', 'light', 'pastel'].includes(getAppliedTheme())) savePreference('NeutralTheme', getAppliedTheme());
    const checkbox = document.getElementById('auto-element-theme');
    checkbox.checked = readPreference('AutoTheme') === 'true';
    checkbox.addEventListener('change', () => {
        savePreference('AutoTheme', String(checkbox.checked));
        syncCharacterTheme();
    });
    syncCharacterTheme();

    onLanguageChange(() => {
        applyTheme(getAppliedTheme());
    });

    getThemeOptions().forEach(el => {
        el.addEventListener('click', () => {
            setTheme(el.dataset.theme);
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

// recibe un string con la indicacion del tema, modifica el data-theme del body y persiste la eleccion
export function setTheme(theme) {
    const option = getThemeOption(theme);
    if (!option) return;

    applyTheme(theme);
    saveTheme(theme);
    if (['dark', 'light', 'pastel'].includes(theme)) savePreference('NeutralTheme', theme);
    document.getElementById('theme-opts').classList.remove('show');
}

function readPreference(suffix) {
    const key = 'artifactMinmaxing' + suffix;
    try { const value = localStorage.getItem(key); if (value !== null) return value; } catch {}
    try { return sessionStorage.getItem(key); } catch { return null; }
}
function savePreference(suffix, value) {
    const key = 'artifactMinmaxing' + suffix;
    try { localStorage.setItem(key, value); } catch {}
    try { sessionStorage.setItem(key, value); } catch {}
}
export function syncCharacterTheme() {
    if (!document.getElementById('auto-element-theme')?.checked) return;
    const element = String(currentSelectedChar?.element ?? '').toLowerCase();
    const aliases = { fire: 'pyro', water: 'hydro', electric: 'electro', grass: 'dendro', ice: 'cryo', wind: 'anemo', rock: 'geo' };
    const neutral = readPreference('NeutralTheme');
    const theme = currentSelectedChar && getThemeOption(aliases[element] || element)
        ? aliases[element] || element
        : ['dark', 'light', 'pastel'].includes(neutral) ? neutral : 'dark';
    applyTheme(theme);
    saveTheme(theme);
}
