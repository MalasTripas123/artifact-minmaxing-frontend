import { catalog } from '../catalog/store.js';
import { currentSelectedChar, selectedFilterStats } from '../state.js';
import { getCurrentLanguage, t } from './language.js';
import { escapeHtml } from './html.js';
import { assignRolls, FLAT_STATS, initialPlan, MAIN_VALUES, plannerCharacter, planSetCounts, reconcileRolls, ROLL_TIERS, rollBudget, rollValue, simulatePlan, SLOT_OPTIONS } from '../domain/attribute-planner.js';

const messages = {
    es: {
        title: 'Planificador de Atributos', equipment: 'Equipamiento', distribution: 'Distribución de sub atributos',
        none: 'Ninguno', level: 'Nivel', ascension: 'Ascensión', refinement: 'Refinamiento', weapon: 'Arma',
        sets: 'Combinación de sets', set1: 'Primer set', set2: 'Segundo set', quality: 'Control de Valor de Atributo',
        qualities: ['Mínimo', 'Bajo', 'Promedio', 'Alto', 'Máximo'], points: 'Puntos de Rolls',
        remaining: 'disponibles', perRoll: 'por roll', empty: 'Selecciona atributos en el maximizador para distribuir rolls.',
        mains: 'Atributos principales · 5★ al máximo', reset: 'Restablecer equipamiento y rolls',
        scope: 'Simulación con la base del personaje a su nivel y ascensión, el arma y los artefactos de este panel. No copia los substats equipados ni los totales del perfil.',
        note: 'Los rolls usan los valores visibles del juego. «Promedio» es la media de los cuatro valores. Sin atributo principal, la pieza sigue disponible para distribuir substats.',
        effects: 'Bonificaciones y alcance', effectsNote: 'Se suman los bonos permanentes a atributos generales. Las pasivas de personaje, constelaciones, buffs de equipo y efectos condicionados de combate no se simulan.',
        notAdded: 'No sumado a los atributos generales', applied: 'Bono permanente aplicado',
        limited: 'Distribución ajustada al presupuesto disponible.', error: 'No hay datos suficientes para calcular esta combinación de nivel y ascensión.',
        passiveMissing: 'Selecciona el refinamiento para incluir la pasiva del arma.',
        weaponIncomplete: 'Selecciona el nivel y la ascensión para incluir el arma en los atributos.',
        flower: 'Flor', plume: 'Pluma', sands: 'Reloj', goblet: 'Copa', circlet: 'Tiara', healing: 'Bono de Curación',
    },
    en: {
        title: 'Attribute Planner', equipment: 'Equipment', distribution: 'Substat distribution',
        none: 'None', level: 'Level', ascension: 'Ascension', refinement: 'Refinement', weapon: 'Weapon',
        sets: 'Set combination', set1: 'First set', set2: 'Second set', quality: 'Roll value control',
        qualities: ['Minimum', 'Low', 'Average', 'High', 'Maximum'], points: 'Roll Points',
        remaining: 'available', perRoll: 'per roll', empty: 'Select stats in the maximizer to allocate rolls.',
        mains: 'Main stats · Max-level 5★', reset: 'Reset equipment and rolls',
        scope: 'Simulation using the character’s base at their level and ascension, plus this panel’s weapon and artifacts. Equipped substats and profile totals are not copied.',
        note: 'Rolls use the values displayed in game. Average is the mean of all four tiers. A slot without a main stat still contributes to the substat budget.',
        effects: 'Bonuses and scope', effectsNote: 'Permanent general-stat bonuses are included. Character passives, constellations, team buffs and conditional combat effects are not simulated.',
        notAdded: 'Not added to general stats', applied: 'Permanent bonus applied',
        limited: 'Allocation adjusted to the available budget.', error: 'Insufficient data for this level and ascension combination.',
        passiveMissing: 'Select a refinement to include the weapon passive.',
        weaponIncomplete: 'Select a level and ascension to include the weapon in the stats.',
        flower: 'Flower', plume: 'Plume', sands: 'Sands', goblet: 'Goblet', circlet: 'Circlet', healing: 'Healing Bonus',
    },
};
const words = () => messages[getCurrentLanguage()] ?? messages.es;
const g = catalog.generated;
let plan;
const filterKeys = { 'HP%': 'hp', 'ATK%': 'attack', 'DEF%': 'defense', CR: 'critRate', CD: 'critDamage', EM: 'mastery', ER: 'recharge', HP: 'HP', ATK: 'ATK', DEF: 'DEF' };
const number = value => Number(value.toFixed(2)).toLocaleString(getCurrentLanguage(), { maximumFractionDigits: 2 });
const nameOf = item => item?.names?.[getCurrentLanguage()] ?? item?.names?.es ?? '';

function statName(stat) {
    if (filterKeys[stat]) return t('maximizer.filters.' + filterKeys[stat]);
    if (stat === 'Healing%') return words().healing;
    const key = stat.replace('%', '').toLowerCase();
    return t('character.stats.' + (key === 'physical' ? 'physicalDamage' : `${key}Damage`));
}
const option = (value, label, chosen) => `<option value="${escapeHtml(value)}"${String(value) === String(chosen) ? ' selected' : ''}>${escapeHtml(label)}</option>`;
const field = (label, id, content, attrs = '') => `<label class="planner-field"><span>${escapeHtml(label)}</span><select id="${id}" ${attrs}>${content}</select></label>`;
const none = chosen => option('', words().none, chosen);

export function plannerTitle() { return words().title; }

export function renderPlanner() {
    plan = initialPlan(currentSelectedChar, g);
    reconcileRolls(plan, selectedFilterStats);
    return `<div class="attribute-planner" id="attribute-planner">
        <p class="planner-help">${words().scope}</p>
        <section aria-labelledby="planner-attributes-title">
            <h4 id="planner-attributes-title">${t('sections.attributes')}</h4>
            <div id="planner-stats" class="stats-list"></div>
        </section>
        <details class="planner-equipment" open>
            <summary>${words().equipment}</summary>
            <div id="planner-equipment-fields">${equipmentFields()}</div>
        </details>
        <section class="planner-distribution" aria-labelledby="planner-distribution-title">
            <h4 id="planner-distribution-title">${words().distribution}</h4>
            <div class="planner-roll-toolbar">
                <label class="planner-quality" for="planner-quality"><span>${words().quality}: <strong id="planner-quality-name">${words().qualities[plan.quality - 1]}</strong></span>
                    <input id="planner-quality" type="range" min="1" max="5" step="1" value="${plan.quality}">
                    <span class="planner-quality-labels" aria-hidden="true">${words().qualities.map(q => `<span>${q}</span>`).join('')}</span>
                </label>
                <div class="planner-budget"><span>${words().points}</span><strong id="planner-points"></strong><small id="planner-remaining"></small></div>
            </div>
            <div id="planner-sliders"></div>
            <p id="planner-status" class="planner-help" role="status"></p>
            <p class="planner-help">${words().note}</p>
        </section>
        <details class="planner-effects"><summary>${words().effects}</summary><p class="planner-help">${words().effectsNote}</p><div id="planner-effects"></div></details>
        <button type="button" class="view-toggle-btn" id="planner-reset">${words().reset}</button>
    </div>`;
}

function equipmentFields() {
    const w = words();
    const characterData = plannerCharacter(g, currentSelectedChar);
    const weapon = g.weapons[plan.weaponId];
    const weapons = Object.entries(g.weapons).filter(([, item]) => item.progression && item.availability !== 'source-placeholder' && item.weaponType === characterData?.weaponType)
        .sort((a, b) => nameOf(a[1]).localeCompare(nameOf(b[1]), getCurrentLanguage()));
    const stage = weapon?.progression.ascensions[plan.weaponAscension];
    const sets = Object.entries(g.artifactSets ?? {}).filter(([, item]) => item.bonuses.some(b => b.pieces === 2))
        .sort((a, b) => nameOf(a[1]).localeCompare(nameOf(b[1]), getCurrentLanguage()));
    const setOptions = (chosen, excluded = '') => none(chosen) + sets.filter(([id]) => id !== excluded).map(([id, data]) => option(id, nameOf(data), chosen)).join('');
    return `<div class="planner-equipment-grid">
        ${field(w.weapon, 'planner-weapon', none(plan.weaponId) + weapons.map(([id, item]) => option(id, nameOf(item), plan.weaponId)).join(''), 'class="planner-weapon-select"')}
        ${field(w.ascension, 'planner-ascension', none(plan.weaponAscension ?? '') + Object.entries(weapon?.progression.ascensions ?? {}).map(([id, s]) => option(id, `${id} · ${s.minLevel}–${s.maxLevel}`, plan.weaponAscension)).join(''), weapon ? '' : 'disabled')}
        ${field(w.level, 'planner-level', none(plan.weaponLevel ?? '') + Array.from({ length: (stage?.maxLevel ?? weapon?.maxLevel ?? 90) - (stage?.minLevel ?? 1) + 1 }, (_, i) => { const level = i + (stage?.minLevel ?? 1); return option(level, level, plan.weaponLevel); }).join(''), weapon ? '' : 'disabled')}
        ${field(w.refinement, 'planner-refinement', option('', w.none, plan.refinement ?? '') + Array.from({ length: weapon?.maxRefinement ?? 1 }, (_, i) => option(i + 1, `R${i + 1}`, plan.refinement)).join(''), weapon ? '' : 'disabled')}
        ${field(w.sets, 'planner-set-mode', [['', w.none], ['2', '×2'], ['4', '×4'], ['2+2', '×2 + ×2']].map(([id, label]) => option(id, label, plan.setMode)).join(''))}
        ${field(w.set1, 'planner-set1', setOptions(plan.set1), plan.setMode ? '' : 'disabled')}
        ${field(w.set2, 'planner-set2', setOptions(plan.set2, plan.set1), plan.setMode === '2+2' ? '' : 'disabled')}
    </div><h5>${w.mains}</h5><div class="planner-mains">
        ${Object.entries(SLOT_OPTIONS).map(([slot, stats]) => field(w[slot], `planner-main-${slot}`, none(plan.mains[slot]) + stats.map(stat => option(stat, `${statName(stat)} · ${number(MAIN_VALUES[stat])}${FLAT_STATS.has(stat) ? '' : '%'}`, plan.mains[slot])).join(''))).join('')}
    </div>`;
}

function renderSliders() {
    return Object.keys(plan.rolls).map(stat => `<div class="planner-roll-row">
        <label for="planner-roll-${stat}">${statName(stat)}</label>
        <input id="planner-roll-${stat}" type="range" data-roll-stat="${stat}" min="0" max="30" step="1" value="${plan.rolls[stat]}">
        <output data-roll-count="${stat}" for="planner-roll-${stat}">${plan.rolls[stat]}</output>
        <span class="planner-roll-value" data-roll-value="${stat}"></span>
    </div>`).join('') || `<p class="planner-help">${words().empty}</p>`;
}

export function refreshPlanner(rebuildSliders = true) {
    if (!plan || !document.getElementById('attribute-planner')) return;
    const before = Object.values(plan.rolls).reduce((a, b) => a + b, 0);
    reconcileRolls(plan, selectedFilterStats);
    const used = Object.values(plan.rolls).reduce((a, b) => a + b, 0);
    const budget = rollBudget(selectedFilterStats, plan.mains);
    document.getElementById('planner-status').textContent = before > used ? words().limited : '';
    if (rebuildSliders) document.getElementById('planner-sliders').innerHTML = renderSliders();
    const counter = document.getElementById('planner-points');
    counter.textContent = `${used} / ${budget.total}`;
    counter.title = Object.entries(budget.pieces).map(([slot, count]) => `${words()[slot]}: ${count}`).join(' · ');
    document.getElementById('planner-remaining').textContent = `${budget.total - used} ${words().remaining}`;
    document.getElementById('planner-quality-name').textContent = words().qualities[plan.quality - 1];
    document.getElementById('planner-quality').setAttribute('aria-valuetext', words().qualities[plan.quality - 1]);
    document.querySelectorAll('[data-roll-stat]').forEach(input => {
        const stat = input.dataset.rollStat;
        input.value = plan.rolls[stat];
        const row = input.closest('.planner-roll-row');
        row.querySelector('output').textContent = plan.rolls[stat];
        const value = rollValue(stat, plan.quality);
        const suffix = FLAT_STATS.has(stat) ? '' : '%';
        row.querySelector('[data-roll-value]').innerHTML = `<strong>+${number(value * plan.rolls[stat])}${suffix}</strong><small>${number(value)}${suffix} ${words().perRoll}</small>`;
    });
    try {
        const result = simulatePlan(g, currentSelectedChar, plan);
        document.getElementById('planner-stats').innerHTML = renderAttributes(result.stats);
        document.getElementById('planner-effects').innerHTML = renderEffects(result);
    } catch {
        document.getElementById('planner-stats').innerHTML = `<p class="planner-help" role="status">${words().error}</p>`;
        document.getElementById('planner-effects').textContent = '';
    }
}

function renderAttributes(stats) {
    const entries = [
        ['MAX_HP', 'hp', 'HP.webp', false, 'BASE_HP'], ['CUR_ATTACK', 'attack', 'ATK.webp', false, 'BASE_ATTACK'],
        ['CUR_DEFENSE', 'defense', 'DEF.webp', false, 'BASE_DEFENSE'], ['CHARGE_EFFICIENCY', 'energyRecharge', 'ER.webp', true],
        ['ELEMENT_MASTERY', 'elementalMastery', 'EM.webp', false], ['CRITICAL', 'critRate', 'CR.webp', true], ['CRITICAL_HURT', 'critDamage', 'CD.webp', true],
        ...[['FIRE', 'pyro'], ['ELEC', 'electro'], ['WATER', 'hydro'], ['GRASS', 'dendro'], ['WIND', 'anemo'], ['ROCK', 'geo'], ['ICE', 'cryo'], ['PHYSICAL', 'physical']]
            .map(([prop, element]) => [`${prop}_ADD_HURT`, `${element}Damage`, `${element === 'physical' ? 'phys' : element}.png`, true]),
        ['HEAL_ADD', 'healing', null, true],
    ];
    return entries.map(([prop, label, icon, percent, base]) => {
        const value = stats[`FIGHT_PROP_${prop}`] ?? 0;
        const shown = percent ? Math.round(value * 1000) / 10 : Math.round(value);
        if (!shown) return '';
        const baseValue = stats[`FIGHT_PROP_${base}`] ?? 0;
        return `<div class="stat-item">${icon ? `<div class="stat-icon" style="background-image:url('./assets/attributes/${icon}')"></div>` : ''}
            <div class="stat-content"><div class="stat-top-row"><span class="stat-label"><b>${label === 'healing' ? words().healing : t('character.stats.' + label)}</b></span>
            <div class="stat-value-group"><span class="stat-value">${number(shown)}${percent ? '%' : ''}</span>${base ? `<div class="stat-breakdown">${number(Math.round(baseValue))} <span>+${number(Math.round(value - baseValue))}</span></div>` : ''}</div></div></div></div>`;
    }).join('');
}

function renderEffects(result) {
    const lang = getCurrentLanguage();
    const weapon = g.weapons[plan.weaponId];
    const descriptions = (weapon?.passives ?? []).map(passive => passive.refinements[plan.refinement]?.descriptions?.[lang]).filter(Boolean);
    const weaponText = descriptions.map(text => `<p><b>${escapeHtml(nameOf(weapon))}</b> · ${escapeHtml(text)}</p>`).join('');
    const sets = Object.entries(planSetCounts(plan)).flatMap(([id, count]) => g.artifactSets[id].bonuses.filter(b => b.pieces <= count).map(b => {
        const applied = b.effects.some(effect => effect.kind === 'stat' && effect.activation === 'always');
        return `<p><b>${escapeHtml(nameOf(g.artifactSets[id]))} ×${b.pieces}</b> · ${escapeHtml(b.descriptions[lang])}<small>${applied ? words().applied : words().notAdded}</small></p>`;
    })).join('');
    return `${plan.weaponId && !result.weapon ? `<p>${words().weaponIncomplete}</p>` : ''}${result.weapon?.issues.some(issue => issue.code === 'refinement-unavailable') ? `<p>${words().passiveMissing}</p>` : ''}${weaponText}${sets}`;
}

export function initPlannerEvents() {
    document.addEventListener('input', event => {
        if (!event.target.closest('#attribute-planner')) return;
        if (event.target.id === 'planner-quality') plan.quality = Number(event.target.value);
        else if (event.target.dataset.rollStat) assignRolls(plan, selectedFilterStats, event.target.dataset.rollStat, event.target.value);
        else return;
        refreshPlanner(false);
    });
    document.addEventListener('change', event => {
        const id = event.target.id;
        if (!event.target.closest('#planner-equipment-fields')) return;
        const value = event.target.value;
        if (id.startsWith('planner-main-')) plan.mains[id.replace('planner-main-', '')] = value;
        else if (id === 'planner-weapon') {
            plan.weaponId = value;
            const weapon = g.weapons[value];
            if (weapon) {
                plan.weaponAscension = Math.min(plan.weaponAscension ?? 0, Math.max(...Object.keys(weapon.progression.ascensions).map(Number)));
                const stage = weapon.progression.ascensions[plan.weaponAscension];
                plan.weaponLevel = Math.max(stage.minLevel, Math.min(stage.maxLevel, plan.weaponLevel ?? stage.minLevel));
                plan.refinement = Math.min(plan.refinement ?? 1, weapon.maxRefinement);
            }
        } else if (id === 'planner-ascension') {
            plan.weaponAscension = value ? Number(value) : null;
            const stage = g.weapons[plan.weaponId].progression.ascensions[value];
            if (stage && plan.weaponLevel !== null) plan.weaponLevel = Math.max(stage.minLevel, Math.min(stage.maxLevel, plan.weaponLevel));
        } else if (id === 'planner-level') {
            const stage = g.weapons[plan.weaponId].progression.ascensions[plan.weaponAscension];
            plan.weaponLevel = value ? Math.max(stage?.minLevel ?? 1, Math.min(stage?.maxLevel ?? g.weapons[plan.weaponId].maxLevel, Math.floor(Number(value)))) : null;
        } else if (id === 'planner-refinement') plan.refinement = value ? Number(value) : null;
        else if (id === 'planner-set-mode') plan.setMode = value;
        else if (id === 'planner-set1') { plan.set1 = value; if (plan.set2 === value) plan.set2 = ''; }
        else if (id === 'planner-set2') plan.set2 = value;
        else return;
        document.getElementById('planner-equipment-fields').innerHTML = equipmentFields();
        refreshPlanner();
        document.getElementById(id)?.focus();
    });
    document.addEventListener('click', event => {
        if (event.target.closest('#planner-reset')) {
            plan = initialPlan(currentSelectedChar, g);
            document.getElementById('planner-quality').value = plan.quality;
            document.getElementById('planner-equipment-fields').innerHTML = equipmentFields();
            refreshPlanner();
        }
        const tab = event.target.closest('[data-maximizer-tab]');
        if (tab) activateTab(tab.dataset.maximizerTab);
    });
    document.addEventListener('keydown', event => {
        const tab = event.target.closest('[data-maximizer-tab]');
        if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const target = event.key === 'Home' ? 'analysis' : event.key === 'End' ? 'planner' : tab.dataset.maximizerTab === 'analysis' ? 'planner' : 'analysis';
        activateTab(target);
        document.getElementById(`maximizer-tab-${target}`).focus();
    });
}

function activateTab(name) {
    document.querySelectorAll('[data-maximizer-tab]').forEach(tab => {
        const active = tab.dataset.maximizerTab === name;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
    });
    if (name === 'planner') refreshPlanner();
}
