import { resolveCharacter } from './model.js';

const url = new URL('../../data/catalog.json', import.meta.url);
// Both CLI tools and the browser consume the same published snapshot.
export const catalog = url.protocol === 'file:'
    ? JSON.parse(await (await import('node:fs/promises')).readFile(url, 'utf8'))
    : await fetch(url, { cache: 'no-cache' }).then(response => {
        if (!response.ok) throw new Error(`No se pudo cargar el catálogo (${response.status}).`);
        return response.json();
    });

export const getCharacter = (id, language, skillDepotId) => resolveCharacter(catalog, id, language, skillDepotId);
