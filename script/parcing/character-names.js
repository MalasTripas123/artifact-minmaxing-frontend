import { catalog, getCharacter } from '../catalog/store.js';
import { getCurrentLanguage } from '../ui/language.js';

export const getCharNameById = id => getCharacter(id, getCurrentLanguage()).nombre;
export const getElementById = id => getCharacter(id).elemento;
export const getBuildById = id => getCharacter(id).builds;
export const getGeneratedCharacterAssetsById = id => getCharacter(id).assets;
export const getCharacterCatalog = () => Object.fromEntries(Object.keys(catalog.generated.characters).map(id => [id, getCharacter(id, getCurrentLanguage())]));
