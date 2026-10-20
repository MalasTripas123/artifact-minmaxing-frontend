// Compatibility exports; the JSON snapshot is the only runtime data source.
import { catalog } from '../catalog/store.js';
export const generatedCharacters = catalog.generated.characters;
export const generatedArtifactSetsByLocale = catalog.generated.artifactSetsByLocale;
export const generatedArtifactSetsById = generatedArtifactSetsByLocale.es;
