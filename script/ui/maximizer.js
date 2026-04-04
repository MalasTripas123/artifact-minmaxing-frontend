import {
    currentSelectedChar,
    gearInitialStats,
    selectedFilterStats,
    elementalCupEnabled,
    setElementalCupEnabled
} from '../state.js';
import { getBuildById, getCharNameById, getElementById } from '../parcing/character-names.js'
import { getArtifactTypeParced } from '../parcing/artifact-properties.js'
import { getArtifacts, applyRVValues } from './character.js'

const dataId = [
    { name: "Vida %", id: "HP%" },
    { name: "Ataque %", id: "ATK%" },
    { name: "Defensa %", id: "DEF%" },
    { name: "Prob. Crit", id: "CR" },
    { name: "Daño Crit", id: "CD"},
    { name: "Maestría", id: "EM"},
    { name: "Recarga", id: "ER"}
];

export let selectedBuild;

export function initMaximizerEvents(){
    document.addEventListener('click', (e) => {
            if (e.target.closest('.toggle-stat-btn')) {
                const dataId = e.target.dataset.id;
                if (dataId === "goblet") {
                    toggleCup();
                } else {
                    toggleFilter(dataId);
                    applyRVValues();
                }
            }
    
            if (e.target.closest('.initial-stats-toggle')) {
                const parent = e.target.closest('.initial-stats-toggle');
                toggleInitialStats(parent.id);
            }

            if (e.target.closest('.build-select')) {
                selectBuild();
            }
        });
}

export function renderMaximizerSection(){
    return `
        <div class="maximizer-section">
            <div style="display: flex; flex-direction: row;">
                <div class="artif-header-icon" style="background-image: ${`url('./assets/artifacts/artifacts.webp')`}"></div>
                <h3 class="section-title">Maximizador de atributos</h3>
            </div>
            
            <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:15px">Optimización teórica de tu build.</p>
            <div class="build-selector-container">
                <label for="build-presets">Builds predeterminadas:</label>
                <select id="build-presets" class="build-select">
                    ${fillBuilds()}
                </select>
            </div>
            
            <div class="maximizer-grid">
                ${dataId.map(s => `
                    <button class="toggle-stat-btn ${selectedFilterStats.has(s.id) ? 'active' : ''}" data-id='${s.id}'">${s.name}</button>
                `).join('')}
            </div>
            
            <div style="margin-top:10px; margin-bottom:25px">
                <button class="toggle-stat-btn ${elementalCupEnabled ? 'active' : ''}" data-id="goblet">Copa con daño elemental</button>
                <select id="build-presets" class="build-select" style="margin-left: 5px">
                    <option class="build-presets-opt" value="custom" selected>Cualquiera</option>
                    <option class="build-presets-opt" value="pyro">Pyro</option>
                    <option class="build-presets-opt" value="hydro">Hydro</option>
                    <option class="build-presets-opt" value="electro">Electro</option>
                    <option class="build-presets-opt" value="cryo">Cryo</option>
                    <option class="build-presets-opt" value="anemo">Anemo</option>
                    <option class="build-presets-opt" value="geo">Geo</option>
                    <option class="build-presets-opt" value="dendro">Dendro</option>
                    <option class="build-presets-opt" value="physical">Físico</option>
                </select>
            </div>

            <div class="summary-panel" id="maximizer-output">
                ${renderMaximizerData()}
            </div>

            <div class="breakdown-column">
                <h4 style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px">Análisis de Eficiencia por Pieza</h4>
                <div id="vertical-breakdown-container">
                    ${renderVerticalBreakdown()}
                </div>
            </div>
        </div>
    `;
}

function renderMaximizerData() {

    const max = calcularRollsMaximos(elementalCupEnabled);
    let theoreticalMax = max.totalRollsMaximos;
    const foundSubs = countStats();

    // <span class="label"></span>
    return `
        <div class="info-tile">
            
            <span class="label" style="font-size: 16px"><b>Máximo de Sub-atributos Teóricos</b></span>
            <div>
                <span class="label">Cantidad máxima de sub atributos: </span>
                <span class="value">${theoreticalMax || 0}</span>
            </div>
            <div>
                <span class="label">Eficiencia máxima de sub atributos: </span>
                <span class="value">${theoreticalMax * 100 + '%'}</span>
            </div>
            <span class="label">Cada roll en un sub atributo puede tener una eficiencia de entre 70 y 100%.</span>
            <span class="label">El sistema calcula el máximo considerando artefactos de 4 stats iniciales.</span>
            <span class="label">El sistema calcula la eficiencia considerando que todos los atributos tienen el mismo impacto en el personaje, ya que es un calculo de completitud más que de eficiencia para cada caso. El equilibrio en tu build depende de ti.</span>
        </div>
        <div class="info-tile">
            <span class="label" style="font-size: 16px"><b>Atributos en los artefactos del personaje</b></span>
            <div>
                <span class="label">Sub-atributos actuales:</span>
                <span class="value">${foundSubs.count}</span>
            </div>
            <div>
                <span class="label">Eficiencia actual:</span>
                <span class="value">${foundSubs.rollQuality + '%'}</span>
            </div>
            <div>
                <span class="label">% de perfección <b>sin considerar la calidad de los rolls</b>: </span>
                <span class="value">${ theoreticalMax === 0 ? '0%' : Number(((foundSubs.count*100)/theoreticalMax).toFixed(1)) + '%' }</span>
            </div>
            <div>
                <span class="label">% de perfección <b>considerando la calidad de los rolls</b>: </span>
                <span class="value">${ theoreticalMax === 0 ? '0%' : Number(((foundSubs.rollQuality*100)/(theoreticalMax*100)).toFixed(1)) + '%' }</span>
            </div>

            <div>
                <span class="label">Atributos principales</span>
                <span class="value">${foundSubs.principalStatsCount}/3</span>
            </div>
        </div>
    `;
}

function renderVerticalBreakdown() {
    const artifacts = getArtifacts();
        // - notas
        // --- mejor/peor artefacto
        // -
        // - extra: actualizar el RV en las tarjetas de artefactos. 
        
        
    return artifacts.map((artifact, i) => {
        let statIsUseful = artifact.type === 'Flor' || artifact.type === 'Pluma' ? '' : 
            selectedFilterStats.has(artifact.mainStat)? '✅':
            !artifact.isElemental? '❌':
            elementalCupEnabled? '✅' : '❌';

        let rvActual = 0;
        let rvMaximo = 0;
        let rvMaxTotal = 0;
        let upgrades = []
        let totalUpgrades = calcularRollsMaximos(elementalCupEnabled);

        const subs = artifact.subStats;
        subs.forEach(sub => {
            let upsListTxt = '';
            let name = '';
            let totalValue = 0;
            let totalRollValue = 0;
            
            const ups = sub.upgrades;
            // por cada mejora:
            ups.forEach(up => {
                // si el sub está en la lista de seleccionados:
                if (selectedFilterStats.has(sub.subStatName)){
                    // suma el valor del rv a el rv total
                    rvActual += up.rv;
                    upsListTxt += ' +' + up.value + ' (' + up.rv + '%)';
                    totalValue += up.value;
                    totalRollValue += up.rv;
                }
                totalUpgrades++;
            });
            // una variable que almacena las mejoras
            if (selectedFilterStats.has(sub.subStatName)) {
                rvMaximo++
                name = sub.subStatName;
                upgrades.push({upsListTxt, name, totalValue, totalRollValue});
            };
        });

        //const maxSubs = getMaxSubs(artifact.type.toLocaleLowerCase());
        if (rvMaximo !== 0) rvMaximo += artifact.totalRolls === 9 ? 5 : 4;

        rvMaxTotal = calcularRolls(getMaxSubs(artifact.type.toLocaleLowerCase()));



        let type = '';
        switch (artifact.type) {
            case 'Flor':
                type = 'flower';
                break;
            case 'Pluma':
                type = 'plume';
                break;
            case 'Reloj':
                type = 'sands';
                break;
            case 'Copa':
                type = 'goblet';
                break;
            case 'Corona':
                type = 'circlet';
                break;
        }
        const icon = `url('./assets/artifacts/${type}.webp')`;

        return `
        <div class="gear-row-analisys">

            <div class="gear-section-lateral">
                <div class="gear-icon-sm" style="background-image: ${icon}"></div>
                <div class="grid-column align-left">
                    <span class="analysis-label">${artifact.type}</span>
                    <span class="analysis-val">${artifact.mainStat}: ${artifact.mainStatValue} ${statIsUseful}</span>
                    <span class="analysis-label">Subs iniciales: ${artifact.totalRolls === 9 ? '4': '3'}</span>
                </div>
            </div>

            <div class="gear-section-central">
                <div class="analysis-grid">

                    <div class="grid-column align-right">
                        <span class="analysis-label">RV Actual</span>
                        <span class="analysis-val">${rvActual}%</span>
                        <span class="analysis-label">(${rvActual === 0 && rvMaximo === 0? 0 : Number((rvActual*100)/(rvMaximo*100)).toFixed(1)}% de esta pieza)</span>
                        <span class="analysis-label">(${rvMaxTotal === 0? 0 : Number((rvActual*100)/(rvMaxTotal*100)).toFixed(1)}% del total)</span>
                    </div>

                    <div class="grid-separator">/</div>

                    <div class="grid-column align-center">
                        <span class="analysis-label">RV max para esta pieza</span>
                        <span class="analysis-val">${rvMaximo*100}%</span>
                        <span class="analysis-label">(${rvMaxTotal === 0? 0 : Number((rvMaximo*100)/(rvMaxTotal)).toFixed(1)}% del total)</span>
                        <span class="analysis-label">&nbsp;</span>
                    </div>

                    <div class="grid-separator">/</div>

                    <div class="grid-column align-left">
                        <span class="analysis-label">RV mav. teórico</span>
                        <span class="analysis-val">${rvMaxTotal*100}%</span>
                        <span class="analysis-label">&nbsp;</span>
                        <span class="analysis-label">&nbsp;</span>
                    </div>

                </div>
            </div>

            <div class="gear-section-lateral">

                <div class="subs-container">

                    <div class="subs-default">
                        ${upgrades.map(u => 
                            `<span class="analysis-label r">${'✦ ' + u.name + ': ' + u.totalValue.toFixed(1) + ' - RV: '+ u.totalRollValue  +'%'}</span><br>`
                        ).join('')}
                    </div>

                    <div class="subs-hover">
                        ${upgrades.map(u => 
                            `
                            <div class="hover-detail-row">
                                <span class="analysis-label">${'✦ ' + u.name + ': ' + u.totalValue.toFixed(1) + ' - RV: '+ u.totalRollValue  +'%'}</span>
                                <span class="analysis-val" style="font-size: 0.7rem;">${u.upsListTxt}</span>
                            </div>`
                        ).join('')}
                        <div class="hover-detail-row">
                            <span class="analysis-label">RV total:</span>
                            <span class="analysis-val" style="font-size: 0.7rem; color: #4ade80;">${rvActual}%</span>
                        </div>
                    </div>

                </div>

            </div>
        </div>`;
    }).join('');
}


// llena las opciones del combo box de builds predterminadas
function fillBuilds(){
    const builds = getBuildById(currentSelectedChar.avatarId);
    if (builds.length == 0) return '<option value="custom" selected>El personaje no tiene builds predeterminadas</option>'
    // elegir primera build disponible
    selectedBuild = builds[0];
    selectedBuild.stats.forEach(s => selectedFilterStats.add(s));
    if (selectedBuild.goblet === '') setElementalCupEnabled(true);
    // crea las opciones en el select
    const masBuilds = [...builds];
    delete masBuilds[0];
    const options = masBuilds.map(b => `<option class="build-presets-opt" value="${b.nombre}">${b.nombre}</option>`).join('');
    
    return `
        <option class="build-presets-opt" value="custom">Personalizada</option>
        <option class="build-presets-opt" value="${selectedBuild.nombre}" selected>${selectedBuild.nombre}</option>
        ${options}
    `;
}

function selectBuild(){
    if (document.getElementById('build-presets').value !== 'custom') {
        selectedFilterStats.clear();
        setElementalCupEnabled(false);
        
    }
    
    const builds = getBuildById(currentSelectedChar.avatarId);
    builds.forEach(b => {
            if (b.nombre === document.getElementById('build-presets').value) {
                b.stats.forEach(s => selectedFilterStats.add(s));
                if (b.goblet === '') setElementalCupEnabled(true);
            }
        }
    );

    refreshMaximizerSection();
}

function toggleFilter(stat) {
    document.getElementById('build-presets').value = 'custom';
    if(selectedFilterStats.has(stat)) selectedFilterStats.delete(stat);
    else selectedFilterStats.add(stat);
    refreshMaximizerSection();
}

function toggleCup() {
    setElementalCupEnabled(!elementalCupEnabled);
    refreshMaximizerSection();
}

export function countStats(){
    let count = 0;
    let rollQuality = 0;
    let principalStatsCount = 0;
    let artifactBreakDown = {};
    const artifacts = getArtifacts();

    artifacts.forEach(artifact => {

        artifactBreakDown[artifact.type] = { artifCount: 0, artifRV: 0, principalIsUsefull: false };

        artifact.subStats.forEach(subStat => {
            if (selectedFilterStats.has(subStat.subStatName)) {
                artifactBreakDown[artifact.type].artifCount += subStat.upgrades.length;
                count += subStat.upgrades.length;
                subStat.upgrades.map(u => {
                    artifactBreakDown[artifact.type].artifRV += u.r;
                    rollQuality += u.rv;
                });
            }
        });
        if (!['Flor', 'Pluma'].includes(artifact.type)){
            if (selectedFilterStats.has(artifact.mainStat)) {
                artifactBreakDown[artifact.type].principalIsUsefull = true;
                principalStatsCount++;
            }
            if (artifact.type === 'Copa' && elementalCupEnabled && artifact.isElemental) {
                artifactBreakDown[artifact.type].principalIsUsefull = true;
                principalStatsCount++;
            }
        }
    });
    return { count, rollQuality, principalStatsCount, artifactBreakDown };
}

function toggleInitialStats(id) {
    const charId = currentSelectedChar.id;
    console.log(document.getElementById(id));
    console.log(document.getElementById(id).dataset);
    console.log(document.getElementById(id).dataset.position);
    const artifactIndex = document.getElementById(id).dataset.position;
    gearInitialStats[charId][artifactIndex] = gearInitialStats[charId][index] === 3 ? 4 : 3;

    
    document.getElementById(id).innerHTML = `
        <div class="initial-opt ${init === 4 ? 'active' : ''}">3 Subs</div>
        <div class="initial-opt ${init === 3 ? 'active' : ''}">4 Subs</div>
    `;
    //document.getElementById('maximizer-output').innerHTML = renderMaximizerData();
    //document.getElementById('vertical-breakdown-container').innerHTML = renderVerticalBreakdown();
}

function refreshMaximizerSection() {
    // 1. Actualizar cálculos y desgloses
    document.getElementById('maximizer-output').innerHTML = renderMaximizerData();
    document.getElementById('vertical-breakdown-container').innerHTML = renderVerticalBreakdown();

    // 2. Actualizar visualmente los botones (Clase .active)
    const btns = document.querySelectorAll('.toggle-stat-btn');
    btns.forEach(btn => {
        const text = btn.dataset.id;
        // Verificar si el botón es un sub-atributo o el de la Copa
        if (selectedFilterStats.has(text)) {
            btn.classList.add('active');
        } else if (text === "goblet") {
            if (elementalCupEnabled) btn.classList.add('active');
            else btn.classList.remove('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function calcularRollsMaximos( usaDanoElemental = true, subsIniciales = 4 ) {
    const piezas = ["flor", "pluma", "reloj", "copa", "corona"];

    let total = 0;
    const detalle = {};

    // itera por cada pieza
    for (const pieza of piezas) {
        const maxSubs = getMaxSubs(pieza, usaDanoElemental); // obtiene la cantidad máxima de subs por cada pieza
        const rolls = calcularRolls(maxSubs, subsIniciales);
        detalle[pieza] = {
            maxSubs,
            rolls
        };
        total += rolls;
    }

    return {
        totalRollsMaximos: total,
        detalle
    };
}

// se llama una vez por cada iteración (pieza)
// calcula el máximo de subatributos posibles en cada pieza
function getMaxSubs(pieza, usaDanoElemental = true) {
    usaDanoElemental = elementalCupEnabled;
    let critCount = 0;
    let erNeeded = false;
    // itera por cada stat seleccionado
    for (let stat of selectedFilterStats) {
        if (stat == "CR" || stat == "CD") {
            critCount++;
        }
        if (stat == "ER") erNeeded = true;
    }

    switch (selectedFilterStats.size) {
        case 7:
            return 4;
        case 6:
            return 4;
        case 5:
            return 4;

        case 4:
            if (pieza === "reloj" || pieza === "corona") return 3;
            if (pieza === "copa" && !usaDanoElemental) return 3;
            return 4;

        case 3:
            if (pieza === "reloj" || pieza === "corona") return 2;
            if (pieza === "copa" && !usaDanoElemental) return 2;
            return 3;

        case 2:
            if (pieza === "reloj" && critCount < 2) return 1;
            if (pieza === "corona") return 1;
            // si:
            // - no usa daño elemental
            // - el conteo de críticos es 2 o 1 de crítico y er
            // el valor es 1.
            if (pieza === "copa" && !usaDanoElemental && (critCount > 1 || (critCount > 0 && erNeeded))) return 1;
            return 2;

        case 1:
            if (pieza === "reloj" && critCount == 0) return 0;
            if (pieza === "copa") {
                if (!usaDanoElemental) {
                    if (selectedFilterStats.has('ATK%')) return 0;
                    if (selectedFilterStats.has('HP%')) return 0;
                    if (selectedFilterStats.has('DEF%')) return 0;
                    if (selectedFilterStats.has('EM')) return 0;
                } // SI LA COPA NO DA DAÑO ELEMENTAL, Y EL ATRIBUTO NO ES CRIT NI ER
            }
            if (pieza === "corona") {
                if (!selectedFilterStats.has('ER')) return 0; // SI EL ATRIBUTO SELECCIONADO NO ES ER, TIENE QUE SER PRINCIPAL
            }
            return 1;

        default:
            return 0;
    }
}

// se llama una vez por cada iteración (pieza)
// calcula la cantidad de rolls para cada pieza
function calcularRolls(maxSubs, subsIniciales = 4) {
    // Si parte con 4 subs → 9 rolls, si no → 8
    const base = subsIniciales === 4 ? 9 : 8;
    
    // Ajuste según cantidad de subs útiles
    if (maxSubs < 1) return 0;
    return base - (4 - maxSubs);
}