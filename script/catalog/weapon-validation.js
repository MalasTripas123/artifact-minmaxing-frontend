export function validateWeaponCatalog(generated) {
    const errors = [];
    // Older catalogs without stat data remain readable during migration.
    if (!generated.weaponStatsSource && !generated.weaponCurves && !Object.values(generated.weapons ?? {}).some(w => w.progression)) return errors;
    const fail = (id, message) => errors.push(`Arma ${id}: ${message}.`);
    if (!/^[a-f0-9]{40}$/.test(generated.weaponStatsSource?.revision ?? '')) fail('catálogo', 'revisión de estadísticas inválida');
    for (const [id, w] of Object.entries(generated.weapons ?? {})) {
        if (!w.progression || !Array.isArray(w.passives)) { fail(id, 'faltan estadísticas o pasivas'); continue; }
        if (!Number.isInteger(w.rarity) || w.rarity < 1 || w.rarity > 5) fail(id, 'rareza inválida');
        if (!Number.isInteger(w.maxRefinement) || w.maxRefinement < 1 || w.maxRefinement > 5) fail(id, 'refinamiento máximo inválido');
        const stages = Object.entries(w.progression.ascensions ?? {});
        if (!stages.length || !w.progression.baseStats?.length) { fail(id, 'progresión vacía'); continue; }
        let previousMax = 1;
        for (const [index, [key, stage]] of stages.entries()) {
            if (Number(key) !== index || !Number.isInteger(stage.maxLevel) || stage.minLevel !== previousMax || stage.maxLevel < stage.minLevel) fail(id, 'límites de ascensión inválidos');
            previousMax = stage.maxLevel;
            for (const [prop, value] of Object.entries(stage.addStats ?? {})) if (!prop.startsWith('FIGHT_PROP_') || !Number.isFinite(value)) fail(id, 'bono de ascensión inválido');
        }
        if (previousMax !== w.maxLevel) fail(id, 'nivel máximo inconsistente');
        for (const stat of w.progression.baseStats) {
            if (!stat.prop?.startsWith('FIGHT_PROP_') || !Number.isFinite(stat.initial) || stat.initial < 0) fail(id, 'estadística inicial inválida');
            for (let level = 1; level <= w.maxLevel; level++) if (!(generated.weaponCurves?.[stat.curve]?.[level] > 0)) { fail(id, `curva incompleta ${stat.curve}/${level}`); break; }
        }
        for (const passive of w.passives) {
            for (let rank = 1; rank <= w.maxRefinement; rank++) {
                const data = passive.refinements?.[rank];
                if (!data || !Array.isArray(data.effects) || !data.descriptions?.es || !data.descriptions?.en) { fail(id, `pasiva incompleta R${rank}`); continue; }
                for (const effect of data.effects) {
                    if (!effect.prop?.startsWith('FIGHT_PROP_') || !['always', 'periodic'].includes(effect.activation)) fail(id, 'efecto inválido');
                    if (effect.kind === 'flat') {
                        if (!Number.isFinite(effect.value)) fail(id, 'bono no numérico');
                    } else if (effect.kind === 'conversion') {
                        if (!effect.input?.startsWith('FIGHT_PROP_') || !Number.isFinite(effect.factor) || effect.factor < 0) fail(id, 'conversión inválida');
                        for (const key of ['offset', 'cap']) if (effect[key] != null && (!Number.isFinite(effect[key]) || effect[key] < 0)) fail(id, `conversión ${key} inválida`);
                    } else fail(id, 'tipo de efecto desconocido');
                }
            }
        }
    }
    return errors;
}
