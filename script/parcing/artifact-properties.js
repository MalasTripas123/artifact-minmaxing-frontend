// textMap en español
const textMap = await fetch('./config-data/TextMapES.json').then(res => res.json());

// tipo artefacto
const artifactTypes = {
    EQUIP_BRACER: 'Flor',
    EQUIP_NECKLACE: 'Pluma',
    EQUIP_SHOES: 'Reloj',
    EQUIP_RING: 'Copa',
    EQUIP_DRESS: 'Corona',
}
export const getArtifactTypeParced = (equipType) => artifactTypes[equipType] ?? '';

// set
export const getSetName = (setNameTextMapHash) => {
    return textMap[setNameTextMapHash] || 'Unknown';
};

// nombres stats
const statNames = {
    FIGHT_PROP_CHARGE_EFFICIENCY: 'ER',
    FIGHT_PROP_ELEMENT_MASTERY: 'EM',
    FIGHT_PROP_HP: 'HP',
    FIGHT_PROP_HP_PERCENT: 'HP%',
    FIGHT_PROP_ATTACK: 'ATK',
    FIGHT_PROP_ATTACK_PERCENT: 'ATK%',
    FIGHT_PROP_DEFENSE: 'DEF',
    FIGHT_PROP_DEFENSE_PERCENT: 'DEF%',
    FIGHT_PROP_CRITICAL_HURT: 'CD',
    FIGHT_PROP_CRITICAL: 'CR',
    
    FIGHT_PROP_ELEC_ADD_HURT: 'Electro%',
    FIGHT_PROP_FIRE_ADD_HURT: 'Pyro%',
    FIGHT_PROP_ICE_ADD_HURT: 'Cryo%',
    FIGHT_PROP_WATER_ADD_HURT: 'Hydro%',
    FIGHT_PROP_GRASS_ADD_HURT: 'Dendro%',
    FIGHT_PROP_WIND_ADD_HURT: 'Anemo%',
    FIGHT_PROP_ROCK_ADD_HURT: 'Geo%',
    FIGHT_PROP_PHYSICAL_ADD_HURT: 'Fisico%',

    FIGHT_PROP_ELEC_SUB_HURT: 'ElectroRes',
    FIGHT_PROP_FIRE_SUB_HURT: 'PyroRes',
    FIGHT_PROP_ICE_SUB_HURT: 'CryoRes',
    FIGHT_PROP_WATER_SUB_HURT: 'HydroRes',
    FIGHT_PROP_GRASS_SUB_HURT: 'DendroRes',
    FIGHT_PROP_WIND_SUB_HURT: 'AnemoRes',
    FIGHT_PROP_ROCK_SUB_HURT: 'GeoRes',
    FIGHT_PROP_PHYSICAL_SUB_HURT: 'FisicoRes',

    FIGHT_PROP_HEAL_ADD: 'HEAL BONUS',
    FIGHT_PROP_HEALED_ADD: 'HEALED BONUS',

}
export const getStatNameParced = (statName) => statNames[statName] ?? '';

// subidas
const upgradeValue = {
    501231: { valor: 0.0453, stat: 'ER', RV: 70 },
    501232: { valor: 0.0518, stat: 'ER', RV: 80 },
    501233: { valor: 0.0583, stat: 'ER', RV: 90 },
    501234: { valor: 0.0648, stat: 'ER', RV: 100 },

    501241: { valor: 16.32, stat: 'EM', RV: 70 },
    501242: { valor: 18.65, stat: 'EM', RV: 80 },
    501243: { valor: 20.98, stat: 'EM', RV: 90 },
    501244: { valor: 23.31, stat: 'EM', RV: 100 },

    501021: { valor: 209.13, stat: 'HP', RV: 70 },
    501022: { valor: 239, stat: 'HP', RV: 80 },
    501023: { valor: 268.88, stat: 'HP', RV: 90 },
    501024: { valor: 298.75, stat: 'HP', RV: 100 },

    501031: { valor: 0.0408, stat: 'HP%', RV: 70 },
    501032: { valor: 0.0466, stat: 'HP%', RV: 80 },
    501033: { valor: 0.0525, stat: 'HP%', RV: 90 },
    501034: { valor: 0.0583, stat: 'HP%', RV: 100 },

    501051: { valor: 13.62, stat: 'ATK', RV: 70 },
    501052: { valor: 15.56, stat: 'ATK', RV: 80 },
    501053: { valor: 17.51, stat: 'ATK', RV: 90 },
    501054: { valor: 19.45, stat: 'ATK', RV: 100 },

    501061: { valor: 0.0408, stat: 'ATK%', RV: 70 },
    501062: { valor: 0.0466, stat: 'ATK%', RV: 80 },
    501063: { valor: 0.0525, stat: 'ATK%', RV: 90 },
    501064: { valor: 0.0583, stat: 'ATK%', RV: 100 },

    501081: { valor: 16.2, stat: 'DEF', RV: 70 },
    501082: { valor: 18.52, stat: 'DEF', RV: 80 },
    501083: { valor: 20.83, stat: 'DEF', RV: 90 },
    501084: { valor: 23.15, stat: 'DEF', RV: 100 },

    501091: { valor: 0.051, stat: 'DEF%', RV: 70 },
    501092: { valor: 0.0583, stat: 'DEF%', RV: 80 },
    501093: { valor: 0.0656, stat: 'DEF%', RV: 90 },
    501094: { valor: 0.0729, stat: 'DEF%', RV: 100 },

    501201: { valor: 0.0272, stat: 'CR', RV: 70 },
    501202: { valor: 0.0311, stat: 'CR', RV: 80 },
    501203: { valor: 0.035, stat: 'CR', RV: 90 },
    501204: { valor: 0.0389, stat: 'CR', RV: 100 },

    501221: { valor: 0.0544, stat: 'CD', RV: 70 },
    501222: { valor: 0.0622, stat: 'CD', RV: 80 },
    501223: { valor: 0.0699, stat: 'CD', RV: 90 },
    501224: { valor: 0.0777, stat: 'CD', RV: 100 },
}

export const getUpgradesValue = (id) => upgradeValue[id] ?? undefined;