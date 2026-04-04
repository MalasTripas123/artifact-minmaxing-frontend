export const builds = {
    carry: {
        ATK: {
            nombre: 'DPS [ATK + Crit + Elemental DMG]',
            stats: ['CR', 'CD', 'ATK%'],
            goblet: ''
        },
        DEF: {
            nombre: 'DPS [DEF + Crit + Elemental DMG]',
            stats: ['CR', 'CD', 'DEF%'],
            goblet: ''
        },
        HP: {
            nombre: 'DPS [HP + Crit + Elemental DMG]',
            stats: ['CR', 'CD', 'HP%'],
            goblet: ''
        },
        EM: {
            nombre: 'DPS [EM + Crit + Elemental DMG]',
            stats: ['CR', 'CD', 'EM'],
            goblet: ''
        },
        ER: {
            nombre: 'DPS [ER + Crit + Elemental DMG]',
            stats: ['CR', 'CD', 'ER'],
            goblet: ''
        },
        max: 38
    },

    carryNoEle: {
        ATK: {
            nombre: 'DPS [ATK + Crit] --sin Elemental DMG',
            stats: ['CR', 'CD', 'ATK%']
        },
        DEF: {
            nombre: 'DPS [DEF + Crit] --sin Elemental DMG',
            stats: ['CR', 'CD', 'DEF%']
        },
        HP: {
            nombre: 'DPS [HP + Crit] --sin Elemental DMG',
            stats: ['CR', 'CD', 'HP%']
        },
        EM: {
            nombre: 'DPS [EM + Crit] --sin Elemental DMG',
            stats: ['CR', 'CD', 'EM']
        },
        ER: {
            nombre: 'DPS [ER + Crit] --sin Elemental DMG',
            stats: ['CR', 'CD', 'ER']
        },
        max: 37
    },

    carryER: {
        ATK: {
            nombre: 'DPS [ATK + Crit + ER + Elemental DMG]',
            stats: ['CR', 'CD', 'ATK%', 'ER'],
            goblet: ''
        },
        DEF: {
            nombre: 'DPS [DEF + Crit + ER + Elemental DMG]',
            stats: ['CR', 'CD', 'DEF%', 'ER'],
            goblet: ''
        },
        HP: {
            nombre: 'DPS [HP + Crit + ER + Elemental DMG]',
            stats: ['CR', 'CD', 'HP%', 'ER'],
            goblet: ''
        },
        EM: {
            nombre: 'DPS [EM + Crit + ER + Elemental DMG]',
            stats: ['CR', 'CD', 'EM', 'ER'],
            goblet: ''
        },
        max: 43
    },

    carryERNoEle: {
        ATK: {
            nombre: 'DPS [ATK + Crit + ER] --sin Elemental DMG',
            stats: ['CR', 'CD', 'ATK%', 'ER']
        },
        DEF: {
            nombre: 'DPS [DEF + Crit + ER] --sin Elemental DMG',
            stats: ['CR', 'CD', 'DEF%', 'ER']
        },
        HP: {
            nombre: 'DPS [HP + Crit + ER] --sin Elemental DMG',
            stats: ['CR', 'CD', 'HP%', 'ER']
        },
        EM: {
            nombre: 'DPS [EM + Crit + ER] --sin Elemental DMG',
            stats: ['CR', 'CD', 'EM', 'ER']
        },
        max: 42
    },

    carryEM: {
        ATK: {
            nombre: 'DPS [ATK + Crit + EM + Elemental DMG]]',
            stats: ['CR', 'CD', 'ATK%', 'EM'],
            goblet: ''
        },
        DEF: {
            nombre: 'DPS [DEF + Crit + EM + Elemental DMG]]',
            stats: ['CR', 'CD', 'DEF%', 'EM'],
            goblet: ''
        },
        HP: {
            nombre: 'DPS [HP + Crit + EM + Elemental DMG]]',
            stats: ['CR', 'CD', 'HP%', 'EM'],
            goblet: ''
        },
        ER: {
            nombre: 'DPS [ER + Crit + EM + Elemental DMG]]',
            stats: ['CR', 'CD', 'ER', 'EM'],
            goblet: ''
        },
        max: 43
    },

    carryEMNoEle: {
        ATK: {
            nombre: 'DPS [ATK + Crit + EM] --sin Elemental DMG',
            stats: ['CR', 'CD', 'ATK%', 'EM']
        },
        DEF: {
            nombre: 'DPS [DEF + Crit + EM] --sin Elemental DMG',
            stats: ['CR', 'CD', 'DEF%', 'EM']
        },
        HP: {
            nombre: 'DPS [HP + Crit + EM] --sin Elemental DMG',
            stats: ['CR', 'CD', 'HP%', 'EM']
        },
        ER: {
            nombre: 'DPS [ER + Crit + EM] --sin Elemental DMG',
            stats: ['CR', 'CD', 'ER', 'EM']
        },
        max: 42
    },

    carryEMER: {
        ATK: {
            nombre: 'DPS [ATK + Crit + EM + ER + Elemental DMG]]',
            stats: ['CR', 'CD', 'ATK%', 'EM', 'ER'],
            goblet: ''
        },
        DEF: {
            nombre: 'DPS [DEF + Crit + EM + ER + Elemental DMG]]',
            stats: ['CR', 'CD', 'DEF%', 'EM', 'ER'],
            goblet: ''
        },
        HP: {
            nombre: 'DPS [HP + Crit + EM + ER + Elemental DMG]]',
            stats: ['CR', 'CD', 'HP%', 'EM', 'ER'],
            goblet: ''
        },
        max: 45
    },

    carryEMERNoEle: {
        ATK: {
            nombre: 'DPS [ATK + Crit + EM + ER] --sin Elemental DMG',
            stats: ['CR', 'CD', 'ATK%', 'EM', 'ER']
        },
        DEF: {
            nombre: 'DPS [DEF + Crit + EM + ER] --sin Elemental DMG',
            stats: ['CR', 'CD', 'DEF%', 'EM', 'ER']
        },
        HP: {
            nombre: 'DPS [HP + Crit + EM + ER] --sin Elemental DMG',
            stats: ['CR', 'CD', 'HP%', 'EM', 'ER']
        },
        max: 45
    },

    supp: {
        ATK: {
            nombre: 'Support [ATK + ER]',
            stats: ['ATK%', 'ER']
        },
        DEF: {
            nombre: 'Support [DEF + ER]',
            stats: ['DEF%', 'ER']
        },
        HP: {
            nombre: 'Support [HP + ER]',
            stats: ['HP%', 'ER']
        },
        EM: {
            nombre: 'Support [EM + ER]',
            stats: ['EM', 'ER']
        },
        max: 32
    },

    suppEM: {
        ATK: {
            nombre: 'Support [ATK + ER + EM]',
            stats: ['ATK%', 'ER', 'EM']
        },
        DEF: {
            nombre: 'Support [DEF + ER + EM]',
            stats: ['DEF%', 'ER', 'EM']
        },
        HP: {
            nombre: 'Support [HP + ER + EM]',
            stats: ['HP%', 'ER', 'EM']
        },
        max: 37
    },

    suppFav: {
        ATK: {
            nombre: 'Support con Favonius [ATK + ER + Crit rate]',
            stats: ['ATK%', 'ER', 'CR']
        },
        DEF: {
            nombre: 'Support con Favonius [DEF + ER + Crit rate]',
            stats: ['DEF%', 'ER', 'CR']
        },
        HP: {
            nombre: 'Support con Favonius [HP + ER + Crit rate]',
            stats: ['HP%', 'ER', 'CR']
        },
        EM: {
            nombre: 'Support con Favonius [EM + ER + Crit rate]',
            stats: ['EM', 'ER', 'CR']
        },
        max: 37
    },

    suppEMFav: {
        ATK: {
            nombre: 'Support [ATK + ER + EM + CR]',
            stats: ['ATK%', 'ER', 'EM', 'CR']
        },
        DEF: {
            nombre: 'Support [DEF + ER + EM + CR]',
            stats: ['DEF%', 'ER', 'EM', 'CR']
        },
        HP: {
            nombre: 'Support [HP + ER + EM + CR]',
            stats: ['HP%', 'ER', 'EM', 'CR']
        },
        max: 42
    },

    monoStat: {
        ATK: {
            nombre: 'Single stat [ATK]',
            stats: ['ATK%']
        },
        DEF: {
            nombre: 'Single stat [DEF]',
            stats: ['DEF%']
        },
        HP: {
            nombre: 'Single stat [HP]',
            stats: ['HP%']
        },
        EM: {
            nombre: 'Single stat [EM]',
            stats: ['EM']
        },
        max: 12
    },

    monoStatFav: {
        ATK: {
            nombre: 'Single stat con Favonius [ATK + Crit rate]',
            stats: ['ATK%', 'CR']
        },
        DEF: {
            nombre: 'Single stat con Favonius [DEF + Crit rate]',
            stats: ['DEF%', 'CR']
        },
        HP: {
            nombre: 'Single stat con Favonius [HP + Crit rate]',
            stats: ['HP%', 'CR']
        },
        EM: {
            nombre: 'Single stat con Favonius [EM + Crit rate]',
            stats: ['EM', 'CR']
        },
        max: 32
    },
}