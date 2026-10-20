export function characterConstellation(character) {
    return Math.min(6, new Set(Array.isArray(character.talentIdList) ? character.talentIdList : []).size);
}

export function characterTalents(character, metadata = []) {
    return ['normal', 'skill', 'burst'].map(kind => {
        const talent = metadata.find(t => t.kind === kind);
        const rawLevel = character.skillLevelMap?.[talent?.id];
        const base = rawLevel == null ? null : Number(rawLevel);
        const extra = Number(character.proudSkillExtraLevelMap?.[talent?.proudId]) || 0;
        const level = Number.isInteger(base) && base > 0 ? base + extra : null;
        return { kind, icon: talent?.icon || '', level, base, extra };
    });
}
