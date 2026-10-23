import { initializePlanner, initPlannerEvents, renderPlanner, refreshPlanner, plannerTitle, getPlannerRollGoals, getPlannerComparisons, rollGoalLabel, PLANNER_CHANGE_EVENT } from './attribute-planner.js';
import { applyRollGoals } from '../domain/roll-goals.js';
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
import { t } from './language.js';
import { escapeHtml } from './html.js';
import { statRollCounts, statValueTotals } from '../domain/artifact-summary.js';

function getStatFilters() {
    return [
        { name: t('maximizer.filters.hp'), id: 'HP%' },
        { name: t('maximizer.filters.attack'), id: 'ATK%' },
        { name: t('maximizer.filters.defense'), id: 'DEF%' },
        { name: t('maximizer.filters.critRate'), id: 'CR' },
        { name: t('maximizer.filters.critDamage'), id: 'CD' },
        { name: t('maximizer.filters.mastery'), id: 'EM' },
        { name: t('maximizer.filters.recharge'), id: 'ER' }
    ];
}

const artifactIcons = {
    Flor: 'flower',
    Pluma: 'plume',
    Reloj: 'sands',
    Copa: 'goblet',
    Corona: 'circlet',
};

export let selectedBuild;

function hoverStatFrom(target) {
    if (!(target instanceof Element)) return null;
    const source = target.closest('.substat[data-stat], .toggle-stat-btn[data-id]');
    const stat = source?.dataset.stat ?? source?.dataset.id;
    return stat && stat !== 'goblet' ? stat : null;
}

function highlightMatchingSubstats(stat) {
    document.querySelectorAll('.substat[data-stat]').forEach(row => {
        row.classList.toggle('hovered-substat', row.dataset.stat === stat);
    });
}

export function initMaximizerEvents() {
    initPlannerEvents();
    document.addEventListener(PLANNER_CHANGE_EVENT, refreshGoalAnalysis);
    // Delegation also covers artifact cards and filters rendered after a character change.
    document.addEventListener('mouseover', event => {
        highlightMatchingSubstats(hoverStatFrom(event.target));
    });
    document.addEventListener('mouseout', event => {
        highlightMatchingSubstats(hoverStatFrom(event.relatedTarget));
    });
    window.addEventListener('blur', () => highlightMatchingSubstats(null));
    document.addEventListener('click', (e) => {
        const summaryToggle = e.target.closest('.summary-toggle');
        if (summaryToggle) {
            const expanded = document.getElementById('maximizer-output').classList.toggle('expanded');
            summaryToggle.textContent = expanded ? '−' : '+';
            summaryToggle.setAttribute('aria-expanded', String(expanded));
            summaryToggle.setAttribute('aria-label', t(expanded ? 'maximizer.collapseSummary' : 'maximizer.expandSummary'));
            return;
        }
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
    const artifacts = getArtifacts();
    const buildOptions = fillBuilds();
    initializePlanner(artifacts);
    const rollCounts = statRollCounts(artifacts);
    const totals = statValueTotals(artifacts);
    return `
        <div class="maximizer-section">
            <div style="display: flex; flex-direction: row;">
                <div class="artif-header-icon" style="background-image: url('./assets/artifacts/artifacts.webp')"></div>
                <h3 class="section-title" id="maximizer-section-title">${t('sections.maximizer')}</h3>
            </div>
            
            <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:15px">${t('maximizer.description')}</p>
            <div class="build-selector-container">
                <label for="build-presets">${t('maximizer.presets')}</label>
                <select id="build-presets" class="build-select">
                    ${buildOptions}
                </select>
            </div>
            
            <div class="maximizer-grid">
                ${getStatFilters().map(s => `
                    <div class="stat-filter-option">
                    <button class="toggle-stat-btn ${selectedFilterStats.has(s.id) ? 'active' : ''}" data-id="${s.id}">
                        <span class="stat-filter-heading">${s.name}<span class="stat-roll-count">×${rollCounts[s.id] ?? 0}</span></span>
                        <span class="stat-filter-total">${totals[s.id] ?? 0}${s.id === 'EM' ? '' : '%'}</span>
                    </button>
                    <span class="stat-goal-indicator" data-stat-goal="${s.id}" hidden></span>
                    </div>
                `).join('')}
            </div>
            
            <div class="maximizer-secondary-row">
                <button class="toggle-stat-btn ${elementalCupEnabled ? 'active' : ''}" data-id="goblet">${t('maximizer.elementalGoblet')}</button>
                <div class="flat-stat-filters">
                    ${['HP', 'ATK', 'DEF'].map(id => `
                        <div class="stat-filter-option">
                        <button class="toggle-stat-btn flat-stat-btn ${selectedFilterStats.has(id) ? 'active' : ''}" data-id="${id}">
                            <span class="stat-filter-heading">${t('maximizer.filters.' + id)}<span class="stat-roll-count">×${rollCounts[id] ?? 0}</span></span>
                            <span class="stat-filter-total">${totals[id] ?? 0}</span>
                        </button>
                        <span class="stat-goal-indicator" data-stat-goal="${id}" hidden></span>
                        </div>`).join('')}
                </div>

            </div>

            <button class="summary-toggle" type="button" aria-controls="maximizer-output" aria-expanded="false" aria-label="${t('maximizer.expandSummary')}">+</button>
            <div class="summary-panel" id="maximizer-output">
                ${renderMaximizerData()}
            </div>

            <div class="maximizer-workspace">
                <div class="maximizer-tabs" role="tablist" aria-label="${t('sections.maximizer')}">
                    <button type="button" role="tab" id="maximizer-tab-analysis" data-maximizer-tab="analysis" aria-controls="maximizer-panel-analysis" aria-selected="true">${t('maximizer.efficiencyTitle')}</button>
                    <button type="button" role="tab" id="maximizer-tab-planner" data-maximizer-tab="planner" aria-controls="maximizer-panel-planner" aria-selected="false" tabindex="-1">${plannerTitle()}</button>
                </div>
                <div id="maximizer-panel-analysis" class="breakdown-column" role="tabpanel" aria-labelledby="maximizer-tab-analysis">
                    <div id="vertical-breakdown-container">${renderVerticalBreakdown()}</div>
                </div>
                <div id="maximizer-panel-planner" role="tabpanel" aria-labelledby="maximizer-tab-planner" hidden>${renderPlanner()}</div>
            </div>
        </div>
    `;
}

function renderMaximizerData() {
    const theoreticalMax = calculateMaxRolls(selectedFilterStats, elementalCupEnabled).totalRollsMaximos;
    const foundSubs = countStats();
    const comparisons = Object.values(getPlannerComparisons());
    const excess = comparisons.reduce((sum, stat) => sum + stat.excess, 0);
    const missing = comparisons.reduce((sum, stat) => sum + stat.missing, 0);

    return `
        <div class="info-tile">
            <span class="label" style="font-size: 16px"><b>${t('maximizer.theoreticalTitle')}</b></span>
            <div>
                <span class="label">${t('maximizer.maxSubstats')} </span>
                <span class="value">${theoreticalMax || 0}</span>
            </div>
            <div>
                <span class="label">${t('maximizer.maxEfficiency')} </span>
                <span class="value">${theoreticalMax * 100}%</span>
            </div>
            <div class="summary-extra summary-help"><span class="label">${t('maximizer.rollEfficiencyHelp')}</span>
            <span class="label">${t('maximizer.fourStatsHelp')}</span>
            <span class="label">${t('maximizer.balanceHelp')}</span></div>
        </div>
        <div class="info-tile">
            <span class="label" style="font-size: 16px"><b>${t('maximizer.currentTitle')}</b></span>
            <p class="roll-goal-summary" role="status">${comparisons.length ? `${t('maximizer.rollGoalSummary', { missing, excess })}${excess ? ` ${t('maximizer.rollGoalQuality')}` : ''}` : ''}</p>
            <div class="summary-current-row"><div>
                <span class="label">${t('maximizer.currentSubstats')}</span>
                <span class="value">${foundSubs.count}</span>
            </div>
            <div>
                <span class="label">${t('maximizer.currentEfficiency')}</span>
                <span class="value">${foundSubs.rollQuality}%</span>
            </div></div>
            <div class="summary-extra">
                <span class="label">${t('maximizer.perfectionNoQuality')} </span>
                <span class="value">${theoreticalMax === 0 ? '0%' : Number(((foundSubs.count * 100) / theoreticalMax).toFixed(1)) + '%'}</span>
            </div>
            <div>
                <span class="label">${t('maximizer.perfectionWithQuality')} </span>
                <span class="value">${theoreticalMax === 0 ? '0%' : Number(((foundSubs.rollQuality * 100) / (theoreticalMax * 100)).toFixed(1)) + '%'}</span>
            </div>

            <div class="summary-extra">
                <span class="label">${t('maximizer.mainStats')}</span>
                <span class="value">${foundSubs.principalStatsCount}/3</span>
            </div>
        </div>
    `;
}

function renderVerticalBreakdown() {
    const artifacts = applyRollGoals(getArtifacts(), getPlannerRollGoals());

    return artifacts.map((artifact) => {
        const analysis = analyzeArtifact(artifact, selectedFilterStats, elementalCupEnabled);
        const statIsUseful = getMainStatMarker(artifact, analysis.mainStatUseful);
        const icon = `url('./assets/artifacts/${artifactIcons[artifact.type]}.webp')`;
        const excluded = artifact.subStats.reduce((sum, stat) => sum + (stat.excludedRolls ?? 0), 0);

        return `
        <div class="gear-row-analisys">
            <div class="gear-section-lateral">
                <div class="gear-icon-sm" style="background-image: ${icon}"></div>
                <div class="grid-column align-left">
                    <span class="analysis-label">${artifact.typeLabel ?? artifact.type}</span>
                    <span class="analysis-val">${artifact.mainStat}: ${artifact.mainStatValue} ${statIsUseful}</span>
                    <span class="analysis-label">${t('maximizer.initialSubs')}: ${artifact.totalRolls === 9 ? '4' : '3'}</span>
                    ${excluded ? `<span class="analysis-label goal-excess">${t('maximizer.excludedRolls', { count: excluded })}</span>` : ''}
                </div>
            </div>

            <div class="gear-section-central">
                <div class="analysis-grid">
                    <div class="grid-column align-right">
                        <span class="analysis-label">${t('maximizer.currentRv')}</span>
                        <span class="analysis-val">${analysis.currentRv}%</span>
                        <span class="analysis-label">(${analysis.currentPiecePercent}% ${t('maximizer.piecePercent')})</span>
                        <span class="analysis-label">(${analysis.theoreticalTotalPercent}% ${t('maximizer.totalPercent')})</span>
                    </div>

                    <div class="grid-separator">/</div>

                    <div class="grid-column align-center">
                        <span class="analysis-label">${t('maximizer.maxPieceRv')}</span>
                        <span class="analysis-val">${analysis.currentMaxRolls * 100}%</span>
                        <span class="analysis-label">(${analysis.maxPiecePercentOfTotal}% ${t('maximizer.totalPercent')})</span>
                        <span class="analysis-label">&nbsp;</span>
                    </div>

                    <div class="grid-separator">/</div>

                    <div class="grid-column align-left">
                        <span class="analysis-label">${t('maximizer.theoreticalRv')}</span>
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
                            <span class="analysis-label">${t('maximizer.totalRv')}</span>
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
    if (builds.length === 0) return `<option value="custom" selected>${t('maximizer.noPresets')}</option>`;

    selectedBuild = builds[0];
    selectedBuild.stats.filter(s => !['HP', 'ATK', 'DEF'].includes(s)).forEach(s => selectedFilterStats.add(s));
    if (selectedBuild.goblet === '') setElementalCupEnabled(true);

    const options = builds
        .slice(1)
        .map(b => `<option class="build-presets-opt" value="${escapeHtml(b.id)}">${escapeHtml(b.nombre)}</option>`)
        .join('');

    return `
        <option class="build-presets-opt" value="custom">${t('maximizer.custom')}</option>
        <option class="build-presets-opt" value="${escapeHtml(selectedBuild.id)}" selected>${escapeHtml(selectedBuild.nombre)}</option>
        ${options}
    `;
}

function selectBuild() {
    const buildSelect = document.getElementById('build-presets');
    if (!buildSelect || buildSelect.value === 'custom') return;

    selectedFilterStats.clear();
    setElementalCupEnabled(false);

    const builds = currentSelectedChar.builds ?? [];
    const build = builds.find(b => b.id === buildSelect.value);
    if (build) {
        build.stats.filter(s => !['HP', 'ATK', 'DEF'].includes(s)).forEach(s => selectedFilterStats.add(s));
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
    return countArtifactStats(applyRollGoals(getArtifacts(), getPlannerRollGoals()), selectedFilterStats, elementalCupEnabled);
}

function refreshGoalAnalysis() {
    const output = document.getElementById('maximizer-output');
    if (!output) return;
    output.innerHTML = renderMaximizerData();
    document.getElementById('vertical-breakdown-container').innerHTML = renderVerticalBreakdown();
    applyRVValues();
    const comparisons = getPlannerComparisons();
    document.querySelectorAll('[data-stat-goal]').forEach(badge => {
        const comparison = comparisons[badge.dataset.statGoal];
        badge.hidden = !comparison;
        badge.textContent = rollGoalLabel(comparison);
        badge.classList.toggle('goal-excess', Boolean(comparison?.excess));
        badge.classList.toggle('goal-missing', Boolean(comparison?.missing));
    });
}

function refreshMaximizerSection() {
    refreshPlanner();
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
