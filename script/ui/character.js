import {
    characters,
    gearInitialStats,
    selectedFilterStats,
    elementalCupEnabled,
    setElementalCupEnabled,
    setCurrentSelectedChar,
    currentSelectedChar,
    setEqViewMode,
    eqViewMode
} from '../state.js';
import { renderMaximizerSection } from './maximizer.js';
import { 
    getArtifactTypeParced, 
    getSetName, 
    getStatNameParced,
    getUpgradesValue,
} from '../parcing/artifact-properties.js';
import {
    calculateArtifactRv,
    calculateCritValue,
} from '../domain/maximizer-calculator.js';
import { requestSectionNavigationSync } from './navigation.js';

// inicia los eventos relevantes de character.js
export function initCharacterEvents() {
    // agrega al documento el evento 'click' - 
    // asigna a una variable true o false según si el elemento clickeado más cercano es de clase '.char-btn'
    document.addEventListener('click', (e) => {
        const charBtn = e.target.closest('.char-btn');
        // si charBtn truthy, llama a showCharacter(id)
        if (charBtn) {
            showCharacter(Number(charBtn.dataset.id));
        }

        if (e.target.closest('.view-toggle-btn')) {
            toggleView();
        }
    });
}

// muestra a un personaje
export function showCharacter(id, shouldScroll = true) {
    const char = characters.find(c => c.avatarId === id);
    if (!char) return;

    setCurrentSelectedChar(char);
    selectedFilterStats.clear();
    setElementalCupEnabled(false);
    const detail = document.getElementById('character-detail');
    detail.style.display = 'block';
    
    char.equipList.forEach((element, i) => {
        if (element.reliquary) {
            const initialStatsAmmount = element.reliquary.appendPropIdList.length == 8 ? 3 : 4;
            if (!gearInitialStats[id]) {
                gearInitialStats[id] ??= {};
            }
            gearInitialStats[id][i] = initialStatsAmmount;
        }
        
    });
    
    const stats = [
        { label: "Vida", val: Math.round(char.fightPropMap['2000']), base: Math.round(char.fightPropMap['1']), bonus: Math.round(char.fightPropMap['2']), icon: `url('./assets/attributes/HP.webp')`, special: true },
        { label: "Ataque", val: Math.round(char.fightPropMap['2001']), base: Math.round(char.fightPropMap['4']), bonus: Math.round((char.fightPropMap['2001']) - Math.round(char.fightPropMap['4'])), icon: `url('./assets/attributes/ATK.webp')`, special: true },
        { label: "Defensa", val: Math.round(char.fightPropMap['2002']), base: Math.round(char.fightPropMap['7']), bonus: Math.round((char.fightPropMap['2002']) - Math.round(char.fightPropMap['7'])), icon: `url('./assets/attributes/DEF.webp')`, special: true },
        { label: "Recarga Energía", val: Math.round((Math.round(char.fightPropMap['23']*10000)/100)*10)/10, icon: `url('./assets/attributes/ER.webp')`, special: false },
        { label: "Maestría Elemental", val: Math.round(char.fightPropMap['28']), icon: `url('./assets/attributes/EM.webp')`, special: false },
        { label: "Prob. Crítico", val: Math.round((Math.round(char.fightPropMap['20']*10000)/100)*10)/10, icon: `url('./assets/attributes/CR.webp')`, special: false },
        { label: "Daño Crítico", val: Math.round((Math.round(char.fightPropMap['22']*10000)/100)*10)/10, icon: `url('./assets/attributes/CD.webp')`, special: false },
        { label: "Bono de daño Pyro", val: Math.round((Math.round(char.fightPropMap['40']*10000)/100)*10)/10, icon: `url('./assets/attributes/pyro.png')`, special: false },
        { label: "Bono de daño Electro", val: Math.round((Math.round(char.fightPropMap['41']*10000)/100)*10)/10, icon: `url('./assets/attributes/electro.png')`, special: false },
        { label: "Bono de daño Hydro", val: Math.round((Math.round(char.fightPropMap['42']*10000)/100)*10)/10, icon: `url('./assets/attributes/hydro.png')`, special: false },
        { label: "Bono de daño Dendro", val: Math.round((Math.round(char.fightPropMap['43']*10000)/100)*10)/10, icon: `url('./assets/attributes/dendro.png')`, special: false },
        { label: "Bono de daño Anemo", val: Math.round((Math.round(char.fightPropMap['44']*10000)/100)*10)/10, icon: `url('./assets/attributes/anemo.png')`, special: false },
        { label: "Bono de daño Geo", val: Math.round((Math.round(char.fightPropMap['45']*10000)/100)*10)/10, icon: `url('./assets/attributes/geo.png')`, special: false },
        { label: "Bono de daño Cryo", val: Math.round((Math.round(char.fightPropMap['46']*10000)/100)*10)/10, icon: `url('./assets/attributes/cryo.png')`, special: false },
        { label: "Bono de daño Físico", val: Math.round((Math.round(char.fightPropMap['30']*10000)/100)*10)/10, icon: `url('./assets/attributes/phys.png')`, special: false },
    ];

    detail.innerHTML = `
        <div class="detail-header" id="char-header">
            <div class="detail-icon" id="element-icon"></div>
            <div>
                <h2 style="font-size: 1.8rem; margin-bottom: 2px;">${char.name}</h2>
                <p style="color:var(--accent-lavender); font-weight:700">Nivel ${char.level} / 90</p>
            </div>
        </div>

        <div class="detail-stats">
            <h3 class="section-title">Atributos del Personaje</h3>
            <div class="stats-list">
                ${stats.map(s => {
                    if (s.val != 0) {
                        return `<div class="stat-item">
                            <div class="stat-icon" style="background-image: ${s.icon}"></div>
                            <div class="stat-content">
                                <div class="stat-top-row">
                                    <span class="stat-label"><b>${s.label}</b></span>
                                    <div class="stat-value-group">
                                        <span class="stat-value">${s.val}${
                                            s.label === 'Vida'||
                                            s.label === 'Ataque'||
                                            s.label === 'Defensa' ||
                                            s.label === 'Maestría Elemental'
                                            ? '' : '%'}</span>
                                        ${s.special ? `<div class="stat-breakdown">${s.base} <span style="opacity:0.6">+${s.bonus}</span></div>` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>`
                    }
                }).join('')}
            </div>
        </div>

        <div class="detail-equipment" id="eq-section">
            <div class="eq-controls">
                <div style="display: flex; flex-direction: row;">
                    <div class="artif-header-icon" style="background-image: ${`url('./assets/artifacts/artifacts.webp')`}"></div>
                    <h3 class="section-title" id="artifacts-section-title" style="margin-bottom:0">ARTEFACTOS</h3>
                </div>
                <button class="view-toggle-btn">Alternar Vista</button>
            </div>
            <div class="equipment-row ${eqViewMode}" id="equipment-row-container">
                ${renderGears()}
            </div>
        </div>

        ${''}
    `;
    detail.innerHTML += renderMaximizerSection();

    applyRVValues();

    const elementIcon = document.getElementById('element-icon');
    if (char.assets.elementIcon) {
        elementIcon.style.backgroundImage = `url('${char.assets.elementIcon}')`;
    } else {
        elementIcon.style.display = 'none';
    }

    document.getElementById('char-header').style.backgroundImage = `url('${char.assets.banner}')`;
    requestSectionNavigationSync();
    
    
    if (shouldScroll) {
        setTimeout(() => detail.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
}

export function getArtifacts(){
    let artifacts = [];
    const items = currentSelectedChar.equipList;
    for (const item of items) {
        if (item.reliquary) {
            let artifact = {
                type: '',
                set: '',
                level: 0,
                mainStat: '',
                mainStatValue: 0,
                subStats: [],
                isElemental: false,
                totalRolls: 0
            };
            // tipo
            artifact.type = getArtifactTypeParced(item.flat.equipType);
            // set
            artifact.set = getSetName(item.flat.setNameTextMapHash);
            // nivel
            artifact.level = item.reliquary.level - 1;
            // stat principal
            artifact.mainStat = getStatNameParced(item.flat.reliquaryMainstat.mainPropId);
            artifact.mainStatValue = item.flat.reliquaryMainstat.statValue;
            const elementalIdList = ['FIGHT_PROP_ELEC_ADD_HURT', 'FIGHT_PROP_FIRE_ADD_HURT', 'FIGHT_PROP_ICE_ADD_HURT', 'FIGHT_PROP_WATER_ADD_HURT', 'FIGHT_PROP_GRASS_ADD_HURT', 'FIGHT_PROP_WIND_ADD_HURT', 'FIGHT_PROP_ROCK_ADD_HURT', 'FIGHT_PROP_PHYSICAL_ADD_HURT'];
            //es elemental
            if (elementalIdList.includes(item.flat.reliquaryMainstat.mainPropId)) artifact.isElemental = true;
            // total rolls
            artifact.totalRolls = item.reliquary.appendPropIdList.length;
            // subs
            let upgradesList = item.reliquary.appendPropIdList; // lista de todos los upgrades del artefacto
            for (let i = 0; i < 4; i++) { // 4 por 4 substats que tiene un artefacto
                // crea un objeto que representa a un substat y le asigna un nombre que es el nombre del substat conseguido del artefacto del json
                let subStat = {
                    subStatName: getStatNameParced(item.flat.reliquarySubstats[i].appendPropId),
                    value: item.flat.reliquarySubstats[i].statValue,
                    upgrades: []
                };

                // upgrades
                // por cada mejora de la lista de mejoras del artefacto
                for (let upgrade of upgradesList) {
                    // asigna a una variable el objeto de esa mejora - props: valor, stat (nombre del stat), RV
                    const stat = getUpgradesValue(upgrade);
                    // si el nombre de la mejora conseguida es igual al nombre del substat asignado antes
                    if (stat.stat == subStat.subStatName) {
                        // parcea el valor
                        let value = stat.valor;
                        if (subStat.subStatName == 'ER' || 
                            subStat.subStatName == 'HP%' || 
                            subStat.subStatName == 'ATK%' || 
                            subStat.subStatName == 'DEF%' || 
                            subStat.subStatName == 'CR' || 
                            subStat.subStatName == 'CD') 
                        {
                            value = Math.round((Math.round(value*10000)/100)*10)/10;
                        } else {
                            // EM, ATK, HP, DEF
                            value = Math.round(value);
                        }
                        const rv = stat.RV;
                        subStat.upgrades.push({value, rv});
                    }
                }
                artifact.subStats.push(subStat);
            }
            artifacts.push(artifact);
        }
    }
    return artifacts;
}

// crea los artefactos del personaje en pantalla
function renderGears() {
    const artifacts = getArtifacts();

    //const abd = countStats().artifactBreakDown;

    let i = 0;
    return artifacts.map(artifact => {
        return `
        <div class="equipment-card">
            <div class="eq-header" style="font-size:0.80rem;"><span>${artifact.type}</span><span>+${artifact.level}</span></div>
            <div class="eq-header"><span>${artifact.set}</span></div>
            <div class="eq-main-box">
                <b style="font-size:1.1rem">${artifact.mainStatValue}${
                    artifact.mainStat === 'HP'||
                    artifact.mainStat === 'ATK'||
                    artifact.mainStat === 'DEF' ||
                    artifact.mainStat === 'EM'
                     ? '' : '%'}</b>
                <div style="font-size:0.65rem; color:var(--text-muted)">${artifact.mainStat}</div>
            </div>
            <div class="substats-list">
                ${renderSub(artifact.subStats[0].subStatName, artifact.subStats[0].upgrades, artifact.subStats[0].subStatName)}
                ${renderSub(artifact.subStats[1].subStatName, artifact.subStats[1].upgrades, artifact.subStats[1].subStatName)}
                ${renderSub(artifact.subStats[2].subStatName, artifact.subStats[2].upgrades, artifact.subStats[2].subStatName)}
                ${renderSub(artifact.subStats[3].subStatName, artifact.subStats[3].upgrades, artifact.subStats[3].subStatName)}
            </div>
            <div class="eq-footer"><span id="rv-${i++}">RV: - %</span></div>
            <div class="eq-footer"><span id="cv-${artifact.type}">CV: ${calculateCritValue(artifact).toFixed(1)}</span></div>
        </div>`}).join('');
}

// crea los substats de cada artefaco
function renderSub(name, rollsWithValue, type) {
    const rolls = [];
    for (const roll of rollsWithValue) {
        rolls.push(roll.value);
    }
    
    const sum = rolls.reduce((a, b) => a + b, 0);
    const total = Number.isInteger(sum) ? sum : sum.toFixed(1);
    return `
        <div class="substat">
            <div style="display:flex; justify-content:space-between"><span>${name}</span><b>${total}${
                    type === 'HP'||
                    type === 'ATK'||
                    type === 'DEF'
                     ? '' : '%'}</b></div>
            <div class="substat-upgrades">
                ${[1, 2, 3, 4, 5].map(j => `<div class="upgrade-dot ${j <= rolls.length ? '' : 'empty'}"></div>`).join('')}
                <div class="upgrade-tooltip">${rolls.join(' + ')} = ${total}</div>
            </div>
        </div>
    `;
}

export function applyRVValues(){
    const artifacts = getArtifacts();

    artifacts.forEach((artifact, i) => {
        const rv = calculateArtifactRv(artifact, selectedFilterStats);
        document.getElementById('rv-'+i).innerText = 'RV: ' + rv + '%';
    });
}

// alterna la vista de los artefactos
function toggleView() {
    const row = document.getElementById('equipment-row-container');
    if (eqViewMode === 'scrollable') {
        setEqViewMode('fixed');
        row.classList.remove('scrollable');
        row.classList.add('fixed');
    } else {
        setEqViewMode('scrollable');
        row.classList.remove('fixed');
        row.classList.add('scrollable');
    }
    //document.querySelector('.view-toggle-btn').innerText = eqViewMode === 'scrollable' ? 'Alternar Vista' : 'Vista Fija';
}
