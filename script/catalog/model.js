export const STATS = ['HP%', 'ATK%', 'DEF%', 'CR', 'CD', 'EM', 'ER'];
const record = value => value && typeof value === 'object' && !Array.isArray(value);
const keyPattern = /^\d+(?:-\d+)?$/;
const elements = new Set(['Anemo', 'Cryo', 'Cryo-abyss', 'Dendro', 'Electro', 'Geo', 'Hydro', 'Pyro', 'Light']);

export function validateCatalog(catalog) {
    const errors = [];
    const warnings = [];
    if (catalog?.manifest?.schemaVersion !== 1) errors.push('Versión de catálogo no compatible.');
    const { generated, curated } = catalog ?? {};
    if (!record(generated?.characters) || !Object.keys(generated.characters).length) errors.push('Catálogo de personajes vacío.');
    for (const field of ['templates', 'assignments', 'overrides']) {
        if (!record(curated?.[field])) errors.push(`Falta curated.${field}.`);
    }
    if (errors.length) return { errors, warnings };
    for (const [id, c] of Object.entries(generated.characters)) {
        if (!keyPattern.test(id) || !record(c) || typeof c.nombre !== 'string' || !c.nombre.trim()) {
            errors.push(`Personaje inválido: ${id}.`);
            continue;
        }
        if (c.elemento != null && !elements.has(c.elemento)) errors.push(`Elemento desconocido: ${id}/${c.elemento}.`);
        for (const url of Object.values(c.assets ?? {})) {
            if (typeof url !== 'string' || (url && !/^https:\/\/enka\.network\/ui\/[\w./-]+$/.test(url))) errors.push(`Imagen no válida: ${id}.`);
        }
        if (!(curated.assignments[id] ?? curated.assignments[id.split('-')[0]])?.length) warnings.push(`Sin build: ${c.nombre} (${id}).`);
    }
    for (const language of ['es', 'en']) {
        if (!record(generated.localizations?.[language]) || !Object.keys(generated.localizations[language]).length) errors.push(`Faltan traducciones: ${language}.`);
        if (!record(generated.artifactSetsByLocale?.[language]) || !Object.keys(generated.artifactSetsByLocale[language]).length) errors.push(`Faltan sets: ${language}.`);
    }
    for (const [id, build] of Object.entries(curated.templates)) {
        if (!/^[a-zA-Z0-9._-]+$/.test(id) || !record(build) || typeof build.nombre !== 'string' || !build.nombre.trim()) {
            errors.push(`Plantilla inválida: ${id}.`);
            continue;
        }
        if (!Array.isArray(build.stats) || !build.stats.length || build.stats.some(s => !STATS.includes(s)) || new Set(build.stats).size !== build.stats.length) errors.push(`Stats inválidos: ${id}.`);
        if (typeof build.elementalGoblet !== 'boolean') errors.push(`Regla de copa inválida: ${id}.`);
    }
    for (const [id, ids] of Object.entries(curated.assignments)) {
        if (!generated.characters[id]) errors.push(`Asignación a personaje inexistente: ${id}.`);
        if (!Array.isArray(ids) || ids.some(key => !Object.hasOwn(curated.templates, key)) || new Set(ids).size !== ids.length) errors.push(`Referencias de builds inválidas: ${id}.`);
    }
    for (const [id, override] of Object.entries(curated.overrides)) {
        if (!generated.characters[id] || !record(override)) { errors.push(`Excepción inválida: ${id}.`); continue; }
        if (Object.keys(override).some(key => !['nombre', 'names', 'elemento'].includes(key))) errors.push(`Campo de excepción no permitido: ${id}.`);
        if (override.nombre !== undefined && (typeof override.nombre !== 'string' || !override.nombre.trim())) errors.push(`Nombre inválido: ${id}.`);
        if (override.elemento !== undefined && override.elemento !== null && !elements.has(override.elemento)) errors.push(`Elemento de excepción inválido: ${id}.`);
        if (override.names !== undefined && (!record(override.names) || Object.entries(override.names).some(([key, value]) => !['es', 'en'].includes(key) || typeof value !== 'string' || !value.trim()))) errors.push(`Traducción de excepción inválida: ${id}.`);
    }
    return { errors, warnings };
}

export function resolveCharacter(catalog, id, language = 'es', skillDepotId) {
    const baseId = String(id);
    const variantId = skillDepotId == null ? baseId : `${baseId}-${skillDepotId}`;
    const key = catalog.generated.characters[variantId] ? variantId : baseId;
    const data = catalog.generated.characters[key];
    const override = { ...catalog.curated.overrides[baseId], ...catalog.curated.overrides[key] };
    const refs = catalog.curated.assignments[key] ?? catalog.curated.assignments[baseId] ?? [];
    const builds = refs.map(id => {
        const build = catalog.curated.templates[id];
        return build ? { id, nombre: build.nombre, stats: [...build.stats], ...(build.elementalGoblet ? { goblet: '' } : {}) } : null;
    }).filter(Boolean);
    return {
        id: key,
        nombre: override.names?.[language] ?? override.nombre ?? data?.names?.[language] ?? data?.nombre ?? `${language === 'en' ? 'Unknown character' : 'Personaje sin catalogar'} (${baseId})`,
        elemento: Object.hasOwn(override, 'elemento') ? override.elemento : data?.elemento ?? null,
        assets: data?.assets ?? {},
        talents: data?.talents ?? [],
        builds,
        metadataAvailable: Boolean(data),
        buildStatus: builds.length ? 'configured' : 'pending',
    };
}
