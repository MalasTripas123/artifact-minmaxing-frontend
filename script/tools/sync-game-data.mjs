import { spawn } from 'node:child_process';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { getManualCharacterCatalog } from '../parcing/character-names.js';

const SOURCES = {
    loc: 'https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/loc.json',
    giLocs: 'https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/gi/locs.json',
    giRelics: 'https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/gi/relics.json',
    giAvatars: 'https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/gi/avatars.json',
};

const ELEMENT_MAP = {
    Wind: 'Anemo',
    Ice: 'Cryo',
    Electric: 'Electro',
    Rock: 'Geo',
    Water: 'Hydro',
    Fire: 'Pyro',
    Grass: 'Dendro',
};

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(currentDir, '..', '..');
const configDir = path.join(frontendRoot, 'config-data');
const generatedDir = path.join(configDir, 'generated');
const locPath = path.join(configDir, 'EnkaLocES.json');
const reliquarySetsPath = path.join(configDir, 'ReliquarySetExcelConfigData.json');
const reportJsonPath = path.join(generatedDir, 'sync-report.json');
const reportMarkdownPath = path.join(generatedDir, 'sync-report.md');
const generatedGameDataPath = path.join(frontendRoot, 'script', 'parcing', 'generated-game-data.js');
const artifactImagesDir = path.join(frontendRoot, 'assets', 'artifacts', 'sets');

const args = new Set(process.argv.slice(2));
const checkOnly = args.has('--check') || args.has('--dry-run');

async function main() {
    const currentLoc = await readJsonIfExists(locPath, {});
    const localReliquarySets = await readJsonIfExists(reliquarySetsPath, []);

    console.log('Descargando datos de Enka...');
    const downloads = await downloadSources(SOURCES);

    const loc = parseJson(downloads.loc.text, SOURCES.loc);
    const giLocs = parseJson(downloads.giLocs.text, SOURCES.giLocs);
    const giRelics = parseJson(downloads.giRelics.text, SOURCES.giRelics);
    const giAvatars = parseJson(downloads.giAvatars.text, SOURCES.giAvatars);

    const mergedSpanishLoc = sortRecord({
        ...currentLoc,
        ...(giLocs.es ?? {}),
        ...(loc.es ?? {}),
    });

    const catalog = getManualCharacterCatalog();
    const artifactSets = collectArtifactSets(giRelics, mergedSpanishLoc);
    const artifactPieceAssets = collectArtifactPieceAssets(giRelics);
    const remoteCharacters = collectRemoteCharacters(giAvatars, mergedSpanishLoc);
    const artifactImages = await syncArtifactPieceImages(artifactPieceAssets);
    const report = await buildReport({
        artifactImages,
        artifactSets,
        catalog,
        currentLoc,
        downloads,
        localReliquarySets,
        mergedSpanishLoc,
        remoteCharacters,
    });

    if (checkOnly) {
        console.log('Modo check: no se escribieron archivos.');
    } else {
        await mkdir(generatedDir, { recursive: true });
        await writeJson(locPath, mergedSpanishLoc);
        await writeJson(reportJsonPath, report);
        await writeFile(reportMarkdownPath, formatMarkdownReport(report), 'utf8');
        await writeGeneratedGameData(generatedGameDataPath, {
            artifactSets,
            remoteCharacters,
        });
    }

    printSummary(report);
}

async function downloadSources(sources) {
    const entries = await Promise.all(Object.entries(sources).map(async ([name, url]) => {
        const result = await downloadText(url);
        return [name, result];
    }));

    return Object.fromEntries(entries);
}

async function downloadText(url) {
    const errors = [];

    try {
        const response = await fetch(url, { headers: { 'User-Agent': 'attribute-minmaxing-sync' } });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return {
            text: await response.text(),
            method: 'fetch',
            url,
        };
    } catch (error) {
        errors.push(`fetch: ${error.cause?.code ?? error.message}`);
    }

    const curlAttempts = process.platform === 'win32'
        ? [['--ssl-no-revoke'], []]
        : [[]];

    for (const extraArgs of curlAttempts) {
        try {
            return {
                text: await downloadWithCurl(url, extraArgs),
                method: extraArgs.includes('--ssl-no-revoke') ? 'curl --ssl-no-revoke' : 'curl',
                url,
            };
        } catch (error) {
            errors.push(`curl ${extraArgs.join(' ')}: ${error.message}`);
        }
    }

    throw new Error(`No se pudo descargar ${url}\n${errors.map(error => `- ${error}`).join('\n')}`);
}

async function downloadBinary(url) {
    const errors = [];

    try {
        const response = await fetch(url, { headers: { 'User-Agent': 'attribute-minmaxing-sync' } });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return Buffer.from(await response.arrayBuffer());
    } catch (error) {
        errors.push(`fetch: ${error.cause?.code ?? error.message}`);
    }

    const curlAttempts = process.platform === 'win32'
        ? [['--ssl-no-revoke'], []]
        : [[]];

    for (const extraArgs of curlAttempts) {
        try {
            return await downloadWithCurlBuffer(url, extraArgs);
        } catch (error) {
            errors.push(`curl ${extraArgs.join(' ')}: ${error.message}`);
        }
    }

    throw new Error(`No se pudo descargar ${url}\n${errors.map(error => `- ${error}`).join('\n')}`);
}

function downloadWithCurl(url, extraArgs) {
    return downloadWithCurlBuffer(url, extraArgs).then(buffer => buffer.toString('utf8'));
}

function downloadWithCurlBuffer(url, extraArgs) {
    return new Promise((resolve, reject) => {
        const curlCommand = process.platform === 'win32' ? 'curl.exe' : 'curl';
        const child = spawn(curlCommand, [
            ...extraArgs,
            '-L',
            '--fail',
            '--silent',
            '--show-error',
            url,
        ], { stdio: ['ignore', 'pipe', 'pipe'] });

        const stdout = [];
        const stderr = [];

        child.stdout.on('data', chunk => stdout.push(chunk));
        child.stderr.on('data', chunk => stderr.push(chunk));
        child.on('error', reject);
        child.on('close', code => {
            if (code === 0) {
                resolve(Buffer.concat(stdout));
                return;
            }

            reject(new Error(Buffer.concat(stderr).toString('utf8').trim() || `exit ${code}`));
        });
    });
}

async function buildReport({
    artifactImages,
    artifactSets,
    catalog,
    currentLoc,
    downloads,
    localReliquarySets,
    mergedSpanishLoc,
    remoteCharacters,
}) {
    const localSetIds = new Set(localReliquarySets.map(set => String(set.setId)));
    const remoteSetIds = new Set(artifactSets.map(set => String(set.setId)));
    const localCatalogIds = new Set(Object.keys(catalog));

    return {
        generatedAt: new Date().toISOString(),
        checkOnly,
        sources: Object.fromEntries(Object.entries(downloads).map(([name, download]) => [
            name,
            {
                url: download.url,
                method: download.method,
            },
        ])),
        localization: {
            output: relativeToRoot(locPath),
            generatedDataOutput: relativeToRoot(generatedGameDataPath),
            beforeEntries: Object.keys(currentLoc).length,
            afterEntries: Object.keys(mergedSpanishLoc).length,
            addedEntries: Object.keys(mergedSpanishLoc).filter(key => !(key in currentLoc)).length,
        },
        characters: {
            localCount: localCatalogIds.size,
            remoteCount: remoteCharacters.length,
            remoteMissingLocally: remoteCharacters.filter(character => !localCatalogIds.has(character.id)),
            missingBuilds: collectMissingBuilds(catalog),
            missingAssets: await collectMissingCharacterAssets(catalog),
        },
        artifactSets: {
            remoteCount: artifactSets.length,
            localConfigCount: localSetIds.size,
            remoteMissingLocally: artifactSets.filter(set => !localSetIds.has(String(set.setId))),
            localMissingRemotely: [...localSetIds].filter(setId => !remoteSetIds.has(setId)).sort(sortNumericStrings),
            missingTranslations: artifactSets.filter(set => !set.name),
        },
        artifactImages,
    };
}

function collectArtifactSets(giRelics, loc) {
    const sets = giRelics.Sets ?? {};

    return Object.entries(sets)
        .map(([setId, set]) => {
            const hash = String(set.Name ?? '');
            return {
                setId,
                nameHash: hash,
                name: getLocalizedText(loc, hash),
            };
        })
        .sort((a, b) => sortNumericStrings(a.setId, b.setId));
}

function collectArtifactPieceAssets(giRelics) {
    const items = giRelics.Items ?? {};
    const assetsByIcon = new Map();

    for (const item of Object.values(items)) {
        const setId = Number(item?.SetId);
        if (!item || setId <= 0 || setId === 15000 || !item.Icon) continue;

        const iconName = normalizeArtifactIconName(item.Icon);
        if (!iconName || assetsByIcon.has(iconName)) continue;

        assetsByIcon.set(iconName, {
            iconName,
            setId: String(setId),
            equipType: item.EquipType,
            sourceUrl: toEnkaUiUrl(item.Icon),
            outputPath: relativeToRoot(path.join(artifactImagesDir, `${iconName}.png`)),
        });
    }

    return [...assetsByIcon.values()].sort((a, b) => a.iconName.localeCompare(b.iconName, 'en'));
}

function normalizeArtifactIconName(icon = '') {
    const fileName = String(icon).split('/').pop() ?? '';
    return fileName.replace(/\.png$/i, '');
}

async function syncArtifactPieceImages(artifactPieceAssets) {
    const existing = [];
    const downloaded = [];
    const failed = [];
    const fallbackDownloads = [];

    if (!checkOnly) {
        await mkdir(artifactImagesDir, { recursive: true });
    }

    await runWithConcurrency(artifactPieceAssets, 8, async asset => {
        const outputPath = path.join(artifactImagesDir, `${asset.iconName}.png`);

        if (await pathExists(outputPath)) {
            existing.push(asset.outputPath);
            return;
        }

        if (checkOnly) return;

        try {
            const { bytes, sourceUrl } = await downloadArtifactPieceImage(asset);
            await writeFile(outputPath, bytes);
            downloaded.push(asset.outputPath);
            if (sourceUrl !== asset.sourceUrl) {
                fallbackDownloads.push({
                    iconName: asset.iconName,
                    sourceUrl,
                });
            }
        } catch (error) {
            failed.push({
                iconName: asset.iconName,
                sourceUrl: asset.sourceUrl,
                error: error.message,
            });
        }
    });

    return {
        outputDir: relativeToRoot(artifactImagesDir),
        total: artifactPieceAssets.length,
        existing: existing.length,
        downloaded: downloaded.length,
        missing: checkOnly ? artifactPieceAssets.length - existing.length : failed.length,
        fallbackDownloads,
        failed,
    };
}

async function downloadArtifactPieceImage(asset) {
    const errors = [];

    for (const sourceUrl of getArtifactPieceDownloadCandidates(asset)) {
        try {
            return {
                bytes: await downloadBinary(sourceUrl),
                sourceUrl,
            };
        } catch (error) {
            errors.push(`${sourceUrl}: ${error.message}`);
        }
    }

    throw new Error(errors.join('\n'));
}

function getArtifactPieceDownloadCandidates(asset) {
    const candidates = [asset.sourceUrl];
    const legacyAdventurerMatch = asset.iconName.match(/^UI_RelicIcon_15004_([1-5])$/);

    if (legacyAdventurerMatch) {
        candidates.push(toEnkaUiUrl(`/ui/UI_RelicIcon_10004_${legacyAdventurerMatch[1]}.png`));
    }

    if (asset.iconName === 'UI_RelicIcon_15012_3') {
        candidates.push(toEnkaUiUrl('/ui/UI_RelicIcon_10012_1.png'));
    }

    return [...new Set(candidates)];
}

function collectRemoteCharacters(giAvatars, loc) {
    const byBaseId = new Map();

    for (const [rawId, avatar] of Object.entries(giAvatars)) {
        const id = rawId.split('-')[0];
        const current = byBaseId.get(id);

        if (current && !rawId.includes('-')) {
            continue;
        }

        const nameHash = String(avatar.NameTextMapHash ?? '');
        byBaseId.set(id, {
            id,
            name: getLocalizedText(loc, nameHash) || getLocalizedText(loc, String(Number(nameHash) + 512)) || 'Unknown',
            nameHash,
            element: ELEMENT_MAP[avatar.Element] ?? avatar.Element ?? null,
            sourceId: rawId,
            sideIconName: avatar.SideIconName ?? null,
        });
    }

    return [...byBaseId.values()].sort((a, b) => sortNumericStrings(a.id, b.id));
}

function collectMissingBuilds(catalog) {
    return Object.entries(catalog)
        .filter(([, character]) => !Array.isArray(character.builds) || character.builds.length === 0)
        .map(([id, character]) => ({
            id,
            name: character.nombre,
            element: character.elemento,
        }));
}

async function collectMissingCharacterAssets(catalog) {
    const missingProfileIcons = [];
    const missingBanners = [];
    const missingElementIcons = [];
    const checkedElementIcons = new Set();

    for (const [id, character] of Object.entries(catalog)) {
        const profileIconPath = path.join(frontendRoot, 'assets', 'pfp', `${character.nombre}_Icon.webp`);
        const bannerPath = path.join(frontendRoot, 'assets', 'gacha-img', `${character.nombre}.png`);

        if (!await pathExists(profileIconPath)) {
            missingProfileIcons.push({
                id,
                name: character.nombre,
                expectedPath: relativeToRoot(profileIconPath),
            });
        }

        if (!await pathExists(bannerPath)) {
            missingBanners.push({
                id,
                name: character.nombre,
                expectedPath: relativeToRoot(bannerPath),
            });
        }

        if (character.elemento && !checkedElementIcons.has(character.elemento)) {
            checkedElementIcons.add(character.elemento);
            const elementPath = path.join(frontendRoot, 'assets', 'elements', `${character.elemento.toLowerCase()}.webp`);

            if (!await pathExists(elementPath)) {
                missingElementIcons.push({
                    element: character.elemento,
                    expectedPath: relativeToRoot(elementPath),
                });
            }
        }
    }

    return {
        missingProfileIcons,
        missingBanners,
        missingElementIcons,
    };
}

function getLocalizedText(loc, hash) {
    if (!hash) return '';

    const directName = loc[String(hash)];
    if (directName) return directName;

    const numericHash = Number(hash);
    if (Number.isFinite(numericHash)) {
        return loc[String(numericHash + 512)] || '';
    }

    return '';
}

function formatMarkdownReport(report) {
    const missingAssets = report.characters.missingAssets;

    return [
        '# Sync game data report',
        '',
        `Generated: ${report.generatedAt}`,
        '',
        '## Localization',
        '',
        `- ${report.localization.output}`,
        `- ${report.localization.generatedDataOutput}`,
        `- Entries: ${report.localization.beforeEntries} -> ${report.localization.afterEntries}`,
        `- Added entries: ${report.localization.addedEntries}`,
        '',
        '## Characters',
        '',
        `- Local catalog: ${report.characters.localCount}`,
        `- Remote Enka avatars: ${report.characters.remoteCount}`,
        `- Remote characters missing locally: ${report.characters.remoteMissingLocally.length}`,
        formatRows(report.characters.remoteMissingLocally, character => `- ${character.id}: ${character.name} (${character.element ?? 'no element'})`),
        '',
        `- Characters without builds: ${report.characters.missingBuilds.length}`,
        formatRows(report.characters.missingBuilds, character => `- ${character.id}: ${character.name}`),
        '',
        `- Missing profile icons: ${missingAssets.missingProfileIcons.length}`,
        formatRows(missingAssets.missingProfileIcons, asset => `- ${asset.id}: ${asset.expectedPath}`),
        '',
        `- Missing banners: ${missingAssets.missingBanners.length}`,
        formatRows(missingAssets.missingBanners, asset => `- ${asset.id}: ${asset.expectedPath}`),
        '',
        `- Missing element icons: ${missingAssets.missingElementIcons.length}`,
        formatRows(missingAssets.missingElementIcons, asset => `- ${asset.element}: ${asset.expectedPath}`),
        '',
        '## Artifact Sets',
        '',
        `- Remote Enka sets: ${report.artifactSets.remoteCount}`,
        `- Local config sets: ${report.artifactSets.localConfigCount}`,
        `- Remote sets missing in ReliquarySetExcelConfigData: ${report.artifactSets.remoteMissingLocally.length}`,
        formatRows(report.artifactSets.remoteMissingLocally, set => `- ${set.setId}: ${set.name || `hash ${set.nameHash}`}`),
        '',
        `- Local sets not present remotely: ${report.artifactSets.localMissingRemotely.length}`,
        formatRows(report.artifactSets.localMissingRemotely, setId => `- ${setId}`),
        '',
        `- Artifact set translations missing: ${report.artifactSets.missingTranslations.length}`,
        formatRows(report.artifactSets.missingTranslations, set => `- ${set.setId}: hash ${set.nameHash}`),
        '',
        '## Artifact Images',
        '',
        `- Output dir: ${report.artifactImages.outputDir}`,
        `- Images tracked: ${report.artifactImages.total}`,
        `- Already present: ${report.artifactImages.existing}`,
        `- Downloaded: ${report.artifactImages.downloaded}`,
        `- Downloaded from fallback URLs: ${report.artifactImages.fallbackDownloads.length}`,
        formatRows(report.artifactImages.fallbackDownloads, asset => `- ${asset.iconName}: ${asset.sourceUrl}`),
        `- Missing or failed: ${report.artifactImages.missing}`,
        formatRows(report.artifactImages.failed, asset => `- ${asset.iconName}: ${asset.error}`),
        '',
    ].join('\n');
}

async function writeGeneratedGameData(filePath, { artifactSets, remoteCharacters }) {
    const characters = Object.fromEntries(remoteCharacters.map(character => [
        character.id,
        {
            nombre: character.name,
            elemento: character.element,
            sourceId: character.sourceId,
            nameHash: character.nameHash,
            assets: buildGeneratedCharacterAssets(character.sideIconName),
        },
    ]));

    const artifactSetsById = Object.fromEntries(artifactSets
        .filter(set => set.name)
        .map(set => [set.setId, set.name]));

    const content = [
        '// Archivo generado por script/tools/sync-game-data.mjs.',
        '// No lo edites a mano; ejecuta la herramienta de sincronizacion.',
        `export const generatedCharacters = ${JSON.stringify(characters, null, 2)};`,
        '',
        `export const generatedArtifactSetsById = ${JSON.stringify(artifactSetsById, null, 2)};`,
        '',
    ].join('\n');

    await writeFile(filePath, content, 'utf8');
}

function buildGeneratedCharacterAssets(sideIconName) {
    const profileIconPath = sideIconName
        ? sideIconName.replace('/ui/UI_AvatarIcon_Side_', '/ui/UI_AvatarIcon_')
        : '';
    const bannerPath = sideIconName
        ? sideIconName.replace('/ui/UI_AvatarIcon_Side_', '/ui/UI_Gacha_AvatarImg_')
        : '';

    return {
        profileIcon: toEnkaUiUrl(profileIconPath),
        banner: toEnkaUiUrl(bannerPath || profileIconPath),
        sideIcon: toEnkaUiUrl(sideIconName),
    };
}

function toEnkaUiUrl(assetPath = '') {
    if (!assetPath) return '';
    if (/^https?:\/\//.test(assetPath)) return assetPath;

    const normalizedPath = assetPath.replace(/^\/?ui\//, '');
    return `https://enka.network/ui/${normalizedPath}`;
}

function formatRows(rows, formatter) {
    if (rows.length === 0) return '- None';
    return rows.map(formatter).join('\n');
}

function printSummary(report) {
    console.log('');
    console.log('Sincronizacion completada.');
    console.log(`Localizacion: ${report.localization.beforeEntries} -> ${report.localization.afterEntries} entradas (${report.localization.addedEntries} nuevas).`);
    console.log(`Personajes remotos no catalogados: ${report.characters.remoteMissingLocally.length}.`);
    console.log(`Personajes sin builds: ${report.characters.missingBuilds.length}.`);
    console.log(`Assets faltantes: ${report.characters.missingAssets.missingProfileIcons.length} iconos, ${report.characters.missingAssets.missingBanners.length} banners, ${report.characters.missingAssets.missingElementIcons.length} elementos.`);
    console.log(`Sets remotos no presentes en ReliquarySetExcelConfigData: ${report.artifactSets.remoteMissingLocally.length}.`);
    console.log(`Traducciones de sets faltantes: ${report.artifactSets.missingTranslations.length}.`);
    console.log(`Imagenes de artefactos: ${report.artifactImages.total} rastreadas, ${report.artifactImages.downloaded} descargadas, ${report.artifactImages.fallbackDownloads.length} con URL alternativa, ${report.artifactImages.missing} pendientes/error.`);

    if (!checkOnly) {
        console.log(`Reporte: ${relativeToRoot(reportMarkdownPath)}`);
    }
}

async function readJsonIfExists(filePath, fallback) {
    try {
        return parseJson(await readFile(filePath, 'utf8'), filePath);
    } catch (error) {
        if (error.code === 'ENOENT') return fallback;
        throw error;
    }
}

function parseJson(text, label) {
    try {
        return JSON.parse(text);
    } catch (error) {
        throw new Error(`JSON invalido en ${label}: ${error.message}`);
    }
}

async function writeJson(filePath, data) {
    await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function pathExists(filePath) {
    try {
        await access(filePath);
        return true;
    } catch (error) {
        if (error.code === 'ENOENT') return false;
        throw error;
    }
}

function sortRecord(record) {
    return Object.fromEntries(Object.entries(record).sort(([left], [right]) => sortNumericStrings(left, right)));
}

function sortNumericStrings(left, right) {
    const numericLeft = Number(left);
    const numericRight = Number(right);

    if (Number.isFinite(numericLeft) && Number.isFinite(numericRight)) {
        return numericLeft - numericRight;
    }

    return String(left).localeCompare(String(right), 'en');
}

function relativeToRoot(filePath) {
    return path.relative(frontendRoot, filePath).replaceAll(path.sep, '/');
}

async function runWithConcurrency(items, limit, worker) {
    const queue = [...items];
    const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
        while (queue.length > 0) {
            const item = queue.shift();
            await worker(item);
        }
    });

    await Promise.all(workers);
}

main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
});
