import {
    currentSelectedChar,
    selectedFilterStats,
    elementalCupEnabled,
    setElementalCupEnabled
} from '../state.js';
import { getArtifacts, applyRVValues } from './character.js';
import {
    analyzeArtifact,
    calculateMaxRolls,
    countArtifactStats,
} from '../domain/maximizer-calculator.js';

const dataId = [
    { name: 'Vida %', id: 'HP%' },
    { name: 'Ataque %', id: 'ATK%' },
    { name: 'Defensa %', id: 'DEF%' },
    { name: 'Prob. Crit', id: 'CR' },
    { name: 'Daño Crit', id: 'CD' },
    { name: 'Maestría', id: 'EM' },
    { name: 'Recarga', id: 'ER' }
];

const artifactIcons = {
    Flor: 'flower',
    Pluma: 'plume',
    Reloj: 'sands',
    Copa: 'goblet',
    Corona: 'circlet',
};

export let selectedBuild;

export function initMaximizerEvents() {
    document.addEventListener('click', (e) => {
        const statButton = e.target.closest('.toggle-stat-btn');
        if (!statButton) return;

        const stat = statButton.dataset.id;
        if (stat === 'goblet') {
            toggleCup();
            return;
        }

        toggleFilter(stat);
    });

    document.addEventListener('change', (e) => {
        if (e.target.closest('.build-select')) {
            selectBuild();
        }
    });
}

export function renderMaximizerSection() {
    return `
        <div class="maximizer-section">
            <div style="display: flex; flex-direction: row;">
                <div class="artif-header-icon" style="background-image: url('./assets/artifacts/artifacts.webp')"></div>
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
                    <button class="toggle-stat-btn ${selectedFilterStats.has(s.id) ? 'active' : ''}" data-id="${s.id}">${s.name}</button>
                `).join('')}
            </div>
            
            <div style="margin-top:10px; margin-bottom:25px">
                <button class="toggle-stat-btn ${elementalCupEnabled ? 'active' : ''}" data-id="goblet">Copa con daño elemental</button>
                <select id="goblet-element" class="goblet-element-select" style="margin-left: 5px">
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
    const theoreticalMax = calculateMaxRolls(selectedFilterStats, elementalCupEnabled).totalRollsMaximos;
    const foundSubs = countStats();

    return `
        <div class="info-tile">
            <span class="label" style="font-size: 16px"><b>Máximo de Sub-atributos Teóricos</b></span>
            <div>
                <span class="label">Cantidad máxima de sub atributos: </span>
                <span class="value">${theoreticalMax || 0}</span>
            </div>
            <div>
                <span class="label">Eficiencia máxima de sub atributos: </span>
                <span class="value">${theoreticalMax * 100}%</span>
            </div>
            <span class="label">Cada roll en un sub atributo puede tener una eficiencia de entre 70 y 100%.</span>
            <span class="label">El sistema calcula el máximo considerando artefactos de 4 stats iniciales.</span>
            <span class="label">El sistema calcula la eficiencia considerando que todos los atributos tienen el mismo impacto en el personaje, ya que es un cálculo de completitud más que de eficiencia para cada caso. El equilibrio en tu build depende de ti.</span>
        </div>
        <div class="info-tile">
            <span class="label" style="font-size: 16px"><b>Atributos en los artefactos del personaje</b></span>
            <div>
                <span class="label">Sub-atributos actuales:</span>
                <span class="value">${foundSubs.count}</span>
            </div>
            <div>
                <span class="label">Eficiencia actual:</span>
                <span class="value">${foundSubs.rollQuality}%</span>
            </div>
            <div>
                <span class="label">% de perfección <b>sin considerar la calidad de los rolls</b>: </span>
                <span class="value">${theoreticalMax === 0 ? '0%' : Number(((foundSubs.count * 100) / theoreticalMax).toFixed(1)) + '%'}</span>
            </div>
            <div>
                <span class="label">% de perfección <b>considerando la calidad de los rolls</b>: </span>
                <span class="value">${theoreticalMax === 0 ? '0%' : Number(((foundSubs.rollQuality * 100) / (theoreticalMax * 100)).toFixed(1)) + '%'}</span>
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

    return artifacts.map((artifact) => {
        const analysis = analyzeArtifact(artifact, selectedFilterStats, elementalCupEnabled);
        const statIsUseful = getMainStatMarker(artifact, analysis.mainStatUseful);
        const icon = `url('./assets/artifacts/${artifactIcons[artifact.type]}.webp')`;

        return `
        <div class="gear-row-analisys">
            <div class="gear-section-lateral">
                <div class="gear-icon-sm" style="background-image: ${icon}"></div>
                <div class="grid-column align-left">
                    <span class="analysis-label">${artifact.type}</span>
                    <span class="analysis-val">${artifact.mainStat}: ${artifact.mainStatValue} ${statIsUseful}</span>
                    <span class="analysis-label">Subs iniciales: ${artifact.totalRolls === 9 ? '4' : '3'}</span>
                </div>
            </div>

            <div class="gear-section-central">
                <div class="analysis-grid">
                    <div class="grid-column align-right">
                        <span class="analysis-label">RV Actual</span>
                        <span class="analysis-val">${analysis.currentRv}%</span>
                        <span class="analysis-label">(${analysis.currentPiecePercent}% de esta pieza)</span>
                        <span class="analysis-label">(${analysis.theoreticalTotalPercent}% del total)</span>
                    </div>

                    <div class="grid-separator">/</div>

                    <div class="grid-column align-center">
                        <span class="analysis-label">RV max para esta pieza</span>
                        <span class="analysis-val">${analysis.currentMaxRolls * 100}%</span>
                        <span class="analysis-label">(${analysis.maxPiecePercentOfTotal}% del total)</span>
                        <span class="analysis-label">&nbsp;</span>
                    </div>

                    <div class="grid-separator">/</div>

                    <div class="grid-column align-left">
                        <span class="analysis-label">RV max. teórico</span>
                        <span class="analysis-val">${analysis.theoreticalMaxRolls * 100}%</span>
                        <span class="analysis-label">&nbsp;</span>
                        <span class="analysis-label">&nbsp;</span>
                    </div>
                </div>
            </div>

            <div class="gear-section-lateral">
                <div class="subs-container">
                    <div class="subs-default">
                        ${analysis.usefulSubstats.map(renderSubstatSummary).join('')}
                    </div>

                    <div class="subs-hover">
                        ${analysis.usefulSubstats.map(renderSubstatHover).join('')}
                        <div class="hover-detail-row">
                            <span class="analysis-label">RV total:</span>
                            <span class="analysis-val" style="font-size: 0.7rem; color: #4ade80;">${analysis.currentRv}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
}

function renderSubstatSummary(subStat) {
    return `<span class="analysis-label r">&#10022; ${subStat.name}: ${subStat.totalValue.toFixed(1)} - RV: ${subStat.totalRollValue}%</span><br>`;
}

function renderSubstatHover(subStat) {
    const upgradesText = subStat.upgrades.map(up => ` +${up.value} (${up.rv}%)`).join('');

    return `
        <div class="hover-detail-row">
            <span class="analysis-label">&#10022; ${subStat.name}: ${subStat.totalValue.toFixed(1)} - RV: ${subStat.totalRollValue}%</span>
            <span class="analysis-val" style="font-size: 0.7rem;">${upgradesText}</span>
        </div>`;
}

function getMainStatMarker(artifact, isUseful) {
    if (artifact.type === 'Flor' || artifact.type === 'Pluma') return '';
    return isUseful ? '&#10003;' : '&#10007;';
}

function fillBuilds() {
    const builds = currentSelectedChar.builds ?? [];
    if (builds.length === 0) return '<option value="custom" selected>El personaje no tiene builds predeterminadas</option>';

    selectedBuild = builds[0];
    selectedBuild.stats.forEach(s => selectedFilterStats.add(s));
    if (selectedBuild.goblet === '') setElementalCupEnabled(true);

    const options = builds
        .slice(1)
        .map(b => `<option class="build-presets-opt" value="${b.nombre}">${b.nombre}</option>`)
        .join('');

    return `
        <option class="build-presets-opt" value="custom">Personalizada</option>
        <option class="build-presets-opt" value="${selectedBuild.nombre}" selected>${selectedBuild.nombre}</option>
        ${options}
    `;
}

function selectBuild() {
    const buildSelect = document.getElementById('build-presets');
    if (!buildSelect || buildSelect.value === 'custom') return;

    selectedFilterStats.clear();
    setElementalCupEnabled(false);

    const builds = currentSelectedChar.builds ?? [];
    const build = builds.find(b => b.nombre === buildSelect.value);
    if (build) {
        build.stats.forEach(s => selectedFilterStats.add(s));
        if (build.goblet === '') setElementalCupEnabled(true);
    }

    refreshMaximizerSection();
}

function toggleFilter(stat) {
    const buildSelect = document.getElementById('build-presets');
    if (buildSelect) buildSelect.value = 'custom';

    if (selectedFilterStats.has(stat)) selectedFilterStats.delete(stat);
    else selectedFilterStats.add(stat);

    refreshMaximizerSection();
}

function toggleCup() {
    setElementalCupEnabled(!elementalCupEnabled);
    refreshMaximizerSection();
}

export function countStats() {
    return countArtifactStats(getArtifacts(), selectedFilterStats, elementalCupEnabled);
}

function refreshMaximizerSection() {
    document.getElementById('maximizer-output').innerHTML = renderMaximizerData();
    document.getElementById('vertical-breakdown-container').innerHTML = renderVerticalBreakdown();
    applyRVValues();

    const btns = document.querySelectorAll('.toggle-stat-btn');
    btns.forEach(btn => {
        const stat = btn.dataset.id;
        if (stat === 'goblet') {
            btn.classList.toggle('active', elementalCupEnabled);
            return;
        }
        btn.classList.toggle('active', selectedFilterStats.has(stat));
    });
}
