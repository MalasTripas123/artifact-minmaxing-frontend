import { access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getManualCharacterCatalog } from '../parcing/character-names.js';

const VALID_STATS = new Set(['HP%', 'ATK%', 'DEF%', 'CR', 'CD', 'EM', 'ER']);
const VALID_ELEMENTS = new Set(['Anemo', 'Cryo', 'Cryo-abyss', 'Dendro', 'Electro', 'Geo', 'Hydro', 'Pyro', 'Light']);

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(currentDir, '..', '..');
const catalog = getManualCharacterCatalog();
const errors = [];
const warnings = [];

async function pathExists(filePath) {
    try {
        await access(filePath);
        return true;
    } catch (error) {
        return false;
    }
}

function validateBuild(characterId, characterName, build, index) {
    const label = `${characterName} (${characterId}) build #${index + 1}`;

    if (!build || typeof build !== 'object' || Array.isArray(build)) {
        errors.push(`${label} no es un objeto de build valido.`);
        return;
    }

    if (typeof build.nombre !== 'string' || build.nombre.length === 0) {
        errors.push(`${label} no tiene nombre.`);
    }

    if (!Array.isArray(build.stats) || build.stats.length === 0) {
        errors.push(`${label} no tiene lista de stats.`);
        return;
    }

    for (const stat of build.stats) {
        if (!VALID_STATS.has(stat)) {
            errors.push(`${label} usa stat desconocido: ${stat}.`);
        }
    }
}

async function validateAssets(characterName, element) {
    const pfpPath = path.join(frontendRoot, 'assets', 'pfp', `${characterName}_Icon.webp`);
    const bannerPath = path.join(frontendRoot, 'assets', 'gacha-img', `${characterName}.png`);

    if (!await pathExists(pfpPath)) {
        warnings.push(`Falta icono de perfil: ${path.relative(frontendRoot, pfpPath)}`);
    }

    if (!await pathExists(bannerPath)) {
        warnings.push(`Falta banner: ${path.relative(frontendRoot, bannerPath)}`);
    }

    if (element) {
        const elementPath = path.join(frontendRoot, 'assets', 'elements', `${element.toLowerCase()}.webp`);
        if (!await pathExists(elementPath)) {
            warnings.push(`Falta icono elemental para ${element}: ${path.relative(frontendRoot, elementPath)}`);
        }
    }
}

for (const [characterId, character] of Object.entries(catalog)) {
    if (!/^\d+$/.test(characterId)) {
        errors.push(`ID de personaje invalido: ${characterId}`);
    }

    if (!character || typeof character !== 'object') {
        errors.push(`Entrada invalida para personaje ${characterId}.`);
        continue;
    }

    if (typeof character.nombre !== 'string' || character.nombre.length === 0) {
        errors.push(`Personaje ${characterId} no tiene nombre.`);
    }

    if (character.elemento !== null && !VALID_ELEMENTS.has(character.elemento)) {
        errors.push(`${character.nombre} (${characterId}) usa elemento desconocido: ${character.elemento}.`);
    }

    if (!Array.isArray(character.builds)) {
        errors.push(`${character.nombre} (${characterId}) no tiene array de builds.`);
    } else {
        character.builds.forEach((build, index) => validateBuild(characterId, character.nombre, build, index));
    }

    await validateAssets(character.nombre, character.elemento);
}

if (warnings.length > 0) {
    console.warn(`Catalog warnings (${warnings.length}):`);
    warnings.forEach(warning => console.warn(`- ${warning}`));
}

if (errors.length > 0) {
    console.error(`Catalog errors (${errors.length}):`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exitCode = 1;
} else {
    console.log(`Catalog OK: ${Object.keys(catalog).length} personajes validados.`);
}
