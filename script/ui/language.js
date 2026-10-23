const LANGUAGE_STORAGE_KEY = 'artifactMinmaxingLanguage';
const LANGUAGE_EVENT = 'artifact-minmaxing-language-change';
const DEFAULT_LANGUAGE = 'es';
const SUPPORTED_LANGUAGES = ['es', 'en'];

const translations = {
    es: {
        app: {
            tagline: 'Herramienta avanzada para la optimización de artefactos',
            description: 'Calcula el máximo de substats posibles según los requerimientos de la build',
            promise: 'Averigua cuánto margen de mejora tienen tus personajes',
        },
        controls: {
            theme: 'Tema',
            languageToggle: 'Idioma: ES',
            search: 'BUSCAR',
            searching: 'BUSCANDO',
            favorites: '★ Favoritos ▾',
            noFavorites: 'Sin favoritos guardados',
            refreshProfile: 'Actualizar datos',
            autoTheme: 'Tema según elemento',
            lastUpdated: 'Actualizado {date}',
            unknownUpdate: 'Fecha de actualización no disponible',
            refreshIn: 'Actualizar ({seconds}s)',
            updating: 'ACTUALIZANDO',
        },
        themes: {
            dark: 'Oscuro',
            light: 'Claro',
            pastel: 'Pastel',
            ocean: 'Océano',
            forest: 'Bosque',
            pyro: 'Pyro',
            hydro: 'Hydro',
            electro: 'Electro',
            dendro: 'Dendro',
            cryo: 'Cryo',
            anemo: 'Anemo',
            geo: 'Geo',
        },
        search: {
            placeholder: 'Ingresa tu ID de Jugador...',
            uidRequired: 'Ingresa un UID.',
            uidNumeric: 'Ingresa un UID numérico.',
            connectionError: 'No se pudo conectar con el servidor.',
            notFound: 'Jugador no encontrado.',
            unavailable: 'Jugador no encontrado o perfil no disponible.',
            genericError: 'No se pudo buscar el jugador.',
            loadingSearch: 'Buscando jugador',
            loadingProfile: 'Cargando perfil',
            loadingRefresh: 'Actualizando datos',
            cooldownError: 'Espera {seconds}s antes de actualizar nuevamente.',
        },
        loading: {
            connecting: 'Conectando con el servidor...',
            renderDelay: 'Render puede tardar unos segundos si el servidor estaba en reposo.',
            stillWaiting: 'Seguimos esperando la respuesta del backend.',
            waking: 'El servidor sigue despertando. La búsqueda continuará automáticamente.',
        },
        nav: {
            aria: 'Navegación de resultados',
            home: 'Inicio',
            characters: 'Personajes',
            character: 'Personaje',
            artifacts: 'Artefactos',
            maximizer: 'Maximizador de atributos',
        },
        player: {
            stars: 'Estrellas',
            achievements: 'Logros',
            achievementsDetail: 'Total completado',
            abyss: 'Abismo Espiral',
            theater: 'Teatro Fantasía',
            stygian: 'Conflagración estigia',
            abyssDetail: 'Piso-sala · Estrellas totales',
            act: 'Acto {act}',
            arcana: 'Arcanas terminadas: {count}',
            arcanaUnavailable: 'Arcanas: este dato no está disponible en Enka.',
            difficulty: 'Dificultad {level}',
            noData: 'No disponible',
            namePlaceholder: 'Nombre Jugador',
            levelUnknown: 'Nivel no identificado',
        },
        sections: {
            characters: 'Personajes en Cuenta',
            attributes: 'Atributos del Personaje',
            artifacts: 'ARTEFACTOS',
            maximizer: 'Maximizador de atributos',
        },
        character: {
            noSetBonus: 'Ningún set equipado',
            weapon: 'Arma equipada',
            refinement: 'Refinamiento',
            constellation: 'Constelación',
            talents: 'Talentos',
            normal: 'Ataque normal',
            skill: 'Habilidad elemental',
            burst: 'Habilidad definitiva',
            normalShort: 'Básico',
            skillShort: 'E',
            burstShort: 'Q',
            level: 'Nivel',
            metadataPending: 'Los datos de este personaje todavía no están disponibles en el catálogo.',
            toggleView: 'Alternar Vista',
            stats: {
                hp: 'Vida',
                attack: 'Ataque',
                defense: 'Defensa',
                energyRecharge: 'Recarga Energía',
                elementalMastery: 'Maestría Elemental',
                critRate: 'Prob. Crítico',
                critDamage: 'Daño Crítico',
                pyroDamage: 'Bono de daño Pyro',
                electroDamage: 'Bono de daño Electro',
                hydroDamage: 'Bono de daño Hydro',
                dendroDamage: 'Bono de daño Dendro',
                anemoDamage: 'Bono de daño Anemo',
                geoDamage: 'Bono de daño Geo',
                cryoDamage: 'Bono de daño Cryo',
                physicalDamage: 'Bono de daño Físico',
            },
        },
        artifacts: {
            unknown: 'Unknown',
            types: {
                EQUIP_BRACER: 'Flor',
                EQUIP_NECKLACE: 'Pluma',
                EQUIP_SHOES: 'Reloj',
                EQUIP_RING: 'Copa',
                EQUIP_DRESS: 'Corona',
            },
            stats: {
                physicalDamage: 'Físico%',
                physicalResistance: 'FísicoRes',
                healBonus: 'Bono Curación',
                healedBonus: 'Bono Curación Recibida',
            },
        },
        maximizer: {
            expandSummary: 'Mostrar resumen completo',
            collapseSummary: 'Mostrar resumen compacto',
            description: 'Optimización teórica de tu build.',
            presets: 'Builds predeterminadas:',
            noPresets: 'Build pendiente de configurar. Puedes elegir las estadísticas manualmente.',
            custom: 'Personalizada',
            elementalGoblet: 'Copa con daño elemental',
            efficiencyTitle: 'Análisis de Eficiencia por Pieza',
            theoreticalTitle: 'Máximo de Sub-atributos Teóricos',
            maxSubstats: 'Cantidad máxima de sub atributos:',
            maxEfficiency: 'Eficiencia máxima de sub atributos:',
            rollEfficiencyHelp: 'Cada roll en un sub atributo puede tener una eficiencia de entre 70 y 100%.',
            fourStatsHelp: 'El sistema calcula el máximo considerando artefactos de 4 stats iniciales.',
            balanceHelp: 'El sistema calcula la eficiencia considerando que todos los atributos tienen el mismo impacto en el personaje, ya que es un cálculo de completitud más que de eficiencia para cada caso. El equilibrio en tu build depende de ti.',
            currentTitle: 'Atributos en los artefactos del personaje',
            rollGoalSummary: 'Meta del planificador: faltan {missing} rolls; {excess} excedentes no cuentan como útiles. Los porcentajes se comparan con el máximo teórico.',
            rollGoalQuality: 'Se conservan los rolls de mayor RV de cada atributo.',
            excludedRolls: '{count} rolls excedentes excluidos',
            currentSubstats: 'Sub-atributos actuales:',
            currentEfficiency: 'Eficiencia actual:',
            perfectionNoQuality: '% de perfección sin considerar la calidad de los rolls:',
            perfectionWithQuality: '% de perfección considerando la calidad de los rolls:',
            mainStats: 'Atributos principales',
            initialSubs: 'Subs iniciales',
            currentRv: 'RV Actual',
            piecePercent: 'de esta pieza',
            totalPercent: 'del total',
            maxPieceRv: 'RV max para esta pieza',
            theoreticalRv: 'RV max. teórico',
            totalRv: 'RV total:',
            filters: {
                HP: 'Vida', ATK: 'Ataque', DEF: 'Defensa',
                hp: 'Vida %',
                attack: 'Ataque %',
                defense: 'Defensa %',
                critRate: 'Prob. Crit',
                critDamage: 'Daño Crit',
                mastery: 'Maestría',
                recharge: 'Recarga',
            },
        },
    },
    en: {
        app: {
            tagline: 'Advanced artifact optimization tool',
            description: 'Calculate the highest possible substat count for your build requirements',
            promise: 'Find out how much room your characters still have to improve',
        },
        controls: {
            theme: 'Theme',
            languageToggle: 'Lang: EN',
            search: 'SEARCH',
            searching: 'SEARCHING',
            favorites: '★ Favorites ▾',
            noFavorites: 'No saved favorites',
            refreshProfile: 'Refresh data',
            autoTheme: 'Theme by element',
            lastUpdated: 'Updated {date}',
            unknownUpdate: 'Update date unavailable',
            refreshIn: 'Refresh ({seconds}s)',
            updating: 'UPDATING',
        },
        themes: {
            dark: 'Dark',
            light: 'Light',
            pastel: 'Pastel',
            ocean: 'Ocean',
            forest: 'Forest',
            pyro: 'Pyro',
            hydro: 'Hydro',
            electro: 'Electro',
            dendro: 'Dendro',
            cryo: 'Cryo',
            anemo: 'Anemo',
            geo: 'Geo',
        },
        search: {
            placeholder: 'Enter Player UID...',
            uidRequired: 'Enter a UID.',
            uidNumeric: 'Enter a numeric UID.',
            connectionError: 'Could not connect to the server.',
            notFound: 'Player not found.',
            unavailable: 'Player not found or profile unavailable.',
            genericError: 'Could not search for the player.',
            loadingSearch: 'Searching player',
            loadingProfile: 'Loading profile',
            loadingRefresh: 'Refreshing data',
            cooldownError: 'Wait {seconds}s before refreshing again.',
        },
        loading: {
            connecting: 'Connecting to the server...',
            renderDelay: 'Render can take a few seconds if the server was asleep.',
            stillWaiting: 'Still waiting for the backend response.',
            waking: 'The server is still waking up. The search will continue automatically.',
        },
        nav: {
            aria: 'Results navigation',
            home: 'Home',
            characters: 'Characters',
            character: 'Character',
            artifacts: 'Artifacts',
            maximizer: 'Attribute Maximizer',
        },
        player: {
            stars: 'Stars',
            achievements: 'Achievements',
            achievementsDetail: 'Total completed',
            abyss: 'Spiral Abyss',
            theater: 'Imaginarium Theater',
            stygian: 'Stygian Onslaught',
            abyssDetail: 'Floor-chamber · Total stars',
            act: 'Act {act}',
            arcana: 'Completed Arcana: {count}',
            arcanaUnavailable: 'Arcana: this information is unavailable from Enka.',
            difficulty: 'Difficulty {level}',
            noData: 'Unavailable',
            namePlaceholder: 'Player Name',
            levelUnknown: 'Unknown level',
        },
        sections: {
            characters: 'Account Characters',
            attributes: 'Character Attributes',
            artifacts: 'ARTIFACTS',
            maximizer: 'Attribute Maximizer',
        },
        character: {
            noSetBonus: 'No set equipped',
            weapon: 'Equipped weapon',
            refinement: 'Refinement',
            constellation: 'Constellation',
            talents: 'Talents',
            normal: 'Normal Attack',
            skill: 'Elemental Skill',
            burst: 'Elemental Burst',
            normalShort: 'Normal',
            skillShort: 'E',
            burstShort: 'Q',
            level: 'Level',
            metadataPending: 'This character’s metadata is not available in the catalog yet.',
            toggleView: 'Toggle View',
            stats: {
                hp: 'HP',
                attack: 'Attack',
                defense: 'Defense',
                energyRecharge: 'Energy Recharge',
                elementalMastery: 'Elemental Mastery',
                critRate: 'CRIT Rate',
                critDamage: 'CRIT DMG',
                pyroDamage: 'Pyro DMG Bonus',
                electroDamage: 'Electro DMG Bonus',
                hydroDamage: 'Hydro DMG Bonus',
                dendroDamage: 'Dendro DMG Bonus',
                anemoDamage: 'Anemo DMG Bonus',
                geoDamage: 'Geo DMG Bonus',
                cryoDamage: 'Cryo DMG Bonus',
                physicalDamage: 'Physical DMG Bonus',
            },
        },
        artifacts: {
            unknown: 'Unknown',
            types: {
                EQUIP_BRACER: 'Flower',
                EQUIP_NECKLACE: 'Plume',
                EQUIP_SHOES: 'Sands',
                EQUIP_RING: 'Goblet',
                EQUIP_DRESS: 'Circlet',
            },
            stats: {
                physicalDamage: 'Physical%',
                physicalResistance: 'PhysicalRes',
                healBonus: 'Healing Bonus',
                healedBonus: 'Incoming Healing',
            },
        },
        maximizer: {
            expandSummary: 'Expand summary',
            collapseSummary: 'Collapse summary',
            description: 'Theoretical optimization for your build.',
            presets: 'Preset builds:',
            noPresets: 'Build not configured yet. You can select stats manually.',
            custom: 'Custom',
            elementalGoblet: 'Goblet with elemental damage',
            efficiencyTitle: 'Efficiency Analysis by Piece',
            theoreticalTitle: 'Theoretical Maximum Substats',
            maxSubstats: 'Maximum substat count:',
            maxEfficiency: 'Maximum substat efficiency:',
            rollEfficiencyHelp: 'Each substat roll can have an efficiency between 70 and 100%.',
            fourStatsHelp: 'The system calculates the maximum assuming artifacts with 4 starting stats.',
            balanceHelp: 'The system calculates efficiency assuming every attribute has the same impact on the character, so this is a completeness calculation more than a case-by-case efficiency score. Your build balance is up to you.',
            currentTitle: 'Attributes in the character artifacts',
            rollGoalSummary: 'Planner goals: {missing} rolls missing; {excess} excess rolls excluded from useful totals. Percentages use the theoretical maximum.',
            rollGoalQuality: 'The highest-RV rolls of each stat are retained.',
            excludedRolls: '{count} excess rolls excluded',
            currentSubstats: 'Current substats:',
            currentEfficiency: 'Current efficiency:',
            perfectionNoQuality: 'Perfection % without roll quality:',
            perfectionWithQuality: 'Perfection % with roll quality:',
            mainStats: 'Main stats',
            initialSubs: 'Initial subs',
            currentRv: 'Current RV',
            piecePercent: 'of this piece',
            totalPercent: 'of total',
            maxPieceRv: 'Max RV for this piece',
            theoreticalRv: 'Theoretical max RV',
            totalRv: 'Total RV:',
            filters: {
                HP: 'HP', ATK: 'ATK', DEF: 'DEF',
                hp: 'HP %',
                attack: 'Attack %',
                defense: 'Defense %',
                critRate: 'CRIT Rate',
                critDamage: 'CRIT DMG',
                mastery: 'Mastery',
                recharge: 'Recharge',
            },
        },
    },
};

let currentLanguage = getInitialLanguage();

export function initLanguageEvents() {
    if (typeof document === 'undefined') return;

    applyLanguageToDocument();

    document.getElementById('language-toggle-btn')?.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleLanguage();
    });
}

export function getCurrentLanguage() {
    return currentLanguage;
}

export function setLanguage(language) {
    const normalizedLanguage = normalizeLanguage(language);
    if (!normalizedLanguage || normalizedLanguage === currentLanguage) return;

    currentLanguage = normalizedLanguage;
    saveLanguage(currentLanguage);
    applyLanguageToDocument();
    if (typeof document !== 'undefined') {
        document.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, {
            detail: { language: currentLanguage },
        }));
    }
}

export function toggleLanguage() {
    setLanguage(currentLanguage === 'es' ? 'en' : 'es');
}

export function onLanguageChange(handler) {
    if (typeof document === 'undefined') return;

    document.addEventListener(LANGUAGE_EVENT, handler);
}

export function t(key, replacements = {}) {
    const template = getTranslation(key, currentLanguage)
        ?? getTranslation(key, DEFAULT_LANGUAGE)
        ?? key;

    return Object.entries(replacements).reduce((text, [name, value]) => (
        text.replaceAll(`{${name}}`, String(value))
    ), template);
}

function applyLanguageToDocument() {
    if (typeof document === 'undefined') return;

    document.documentElement.lang = currentLanguage;

    const languageButton = document.getElementById('language-toggle-btn');
    if (languageButton) {
        languageButton.innerText = t('controls.languageToggle');
    }

    const themeButton = document.getElementById('theme-selector-btn');
    if (themeButton) {
        const theme = document.body.getAttribute('data-theme') || 'dark';
        themeButton.innerText = `${t('controls.theme')}: ${t(`themes.${theme}`)} ▾`;
        themeButton.dataset.shortLabel = t('controls.theme');
    }

    document.querySelectorAll('[data-i18n]').forEach(element => {
        element.innerText = t(element.dataset.i18n);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        element.setAttribute('placeholder', t(element.dataset.i18nPlaceholder));
    });

    document.querySelectorAll('[data-i18n-title]').forEach(element => {
        element.setAttribute('title', t(element.dataset.i18nTitle));
    });

    document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
        element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel));
    });
}

function getInitialLanguage() {
    return normalizeLanguage(getStoredLanguage())
        || normalizeLanguage(typeof navigator === 'undefined' ? '' : navigator.language)
        || DEFAULT_LANGUAGE;
}

function normalizeLanguage(language) {
    const code = String(language ?? '').trim().toLowerCase().split('-')[0];
    return SUPPORTED_LANGUAGES.includes(code) ? code : null;
}

function getStoredLanguage() {
    try {
        if (typeof window === 'undefined') return null;
        return window.localStorage?.getItem(LANGUAGE_STORAGE_KEY) ?? null;
    } catch (error) {
        return null;
    }
}

function saveLanguage(language) {
    try {
        if (typeof window === 'undefined') return;
        window.localStorage?.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (error) {
        try {
            window.sessionStorage?.setItem(LANGUAGE_STORAGE_KEY, language);
        } catch {
            // Si el navegador bloquea storage, el idioma queda solo en memoria.
        }
    }
}

function getTranslation(key, language) {
    return key.split('.').reduce((value, part) => value?.[part], translations[language]);
}
