const finiteStats = stats => stats && !Array.isArray(stats) && typeof stats === 'object' && Object.entries(stats).every(([key, value]) => key.startsWith('FIGHT_PROP_') && Number.isFinite(value));

export function validateCharacterAndSetCatalog(generated) {
    const errors = [];
    const fail = message => errors.push(message);
    const hasCharacters = generated.characterStatsSource || generated.characterCurves || Object.values(generated.characters ?? {}).some(c => c.progression);
    if (hasCharacters) {
        if (!/^[a-f0-9]{40}$/.test(generated.characterStatsSource?.revision ?? '')) fail('Revisión de estadísticas de personajes inválida.');
        for (const [id, c] of Object.entries(generated.characters ?? {})) {
            const p = c.progression;
            if (!p?.baseStats || !p.ascensions || !Array.isArray(p.extraLevels) || !finiteStats(p.innateStats)) { fail(`Progresión incompleta: ${id}.`); continue; }
            if (!(p.innateStats.FIGHT_PROP_ELEMENT_MASTERY >= 0)) fail(`Maestría elemental innata ausente o inválida: ${id}.`);
            const baseProps = p.baseStats.map(s => s.prop);
            if (baseProps.length !== 3 || !['FIGHT_PROP_BASE_HP', 'FIGHT_PROP_BASE_ATTACK', 'FIGHT_PROP_BASE_DEFENSE'].every(s => baseProps.includes(s))) fail(`Estadísticas base incompletas: ${id}.`);
            if (![4, 5].includes(c.rarity) || c.statsBaseId !== id.split('-')[0] || !Number.isInteger(c.statsSkillDepotId)) fail(`Metadatos de progresión inválidos: ${id}.`);
            let max = 1;
            const stages = Object.entries(p.ascensions);
            if (!stages.length) fail(`Ascensiones vacías: ${id}.`);
            for (const [index, [key, stage]] of stages.entries()) {
                if (Number(key) !== index || stage.minLevel !== max || !Number.isInteger(stage.maxLevel) || stage.maxLevel < max || !finiteStats(stage.addStats)) fail(`Ascensión inválida: ${id}/${key}.`);
                max = stage.maxLevel;
            }
            if (p.normalMaxLevel !== max) fail(`Nivel máximo normal inconsistente: ${id}.`);
            for (const row of p.extraLevels) {
                if (row.fromLevel !== max || !Number.isInteger(row.level) || row.level <= max || row.ascension !== stages.length - 1) fail(`Extensión de nivel inválida: ${id}.`);
                max = row.level;
            }
            if (p.maxLevel !== max || max > 100) fail(`Nivel máximo inconsistente: ${id}.`);
            for (const stat of p.baseStats) {
                if (!Number.isFinite(stat.initial) || stat.initial <= 0) fail(`Estadística inicial inválida: ${id}.`);
                for (let level = 1; level <= max; level++) if (!(generated.characterCurves?.[stat.curve]?.[level] > 0)) { fail(`Curva de personaje incompleta: ${id}/${level}.`); break; }
            }
        }
    }
    if (generated.artifactSets || generated.artifactSetsSource) {
        if (!/^[a-f0-9]{40}$/.test(generated.artifactSetsSource?.revision ?? '')) fail('Revisión de sets inválida.');
        for (const id of Object.keys(generated.artifactSetsByLocale?.es ?? {})) if (!generated.artifactSets?.[id]) fail(`Set sin bonos: ${id}.`);
        for (const [id, set] of Object.entries(generated.artifactSets ?? {})) {
            if (!set.names?.es || !set.names?.en || !Array.isArray(set.bonuses) || !set.bonuses.length) { fail(`Set incompleto: ${id}.`); continue; }
            if (new Set(set.bonuses.map(b => b.pieces)).size !== set.bonuses.length) fail(`Bono duplicado: ${id}.`);
            for (const b of set.bonuses) {
                if (![1, 2, 4].includes(b.pieces) || !b.descriptions?.es || !b.descriptions?.en || !Array.isArray(b.effects)) { fail(`Bono inválido: ${id}.`); continue; }
                if (!['complete', 'partial', 'description-only'].includes(b.effectCoverage)) fail(`Cobertura desconocida: ${id}.`);
                if (b.pieces <= 2 && (b.effectCoverage !== 'complete' || !b.effects.length)) fail(`Bono x${b.pieces} no modelado: ${id}.`);
                for (const e of b.effects) {
                    if (!['stat', 'damageBonus', 'energyRestore', 'statusDurationReduction'].includes(e.kind) || !Number.isFinite(e.value) || !['always', 'conditional', 'triggered'].includes(e.activation)) fail(`Efecto inválido: ${id}.`);
                    if (e.kind === 'stat' && !e.prop?.startsWith('FIGHT_PROP_')) fail(`Propiedad inválida: ${id}.`);
                    if (e.kind === 'damageBonus' && (!Array.isArray(e.attacks) || !e.attacks.length || e.attacks.some(a => !['normal', 'charged', 'plunging', 'skill', 'burst', 'all'].includes(a)))) fail(`Alcance de daño inválido: ${id}.`);
                    if (e.activation === 'conditional' && !e.conditions?.length) fail(`Condición ausente: ${id}.`);
                    if (e.activation === 'triggered' && !e.trigger) fail(`Disparador ausente: ${id}.`);
                }
            }
        }
    }
    return errors;
}
