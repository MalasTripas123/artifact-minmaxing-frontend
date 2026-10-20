import { currentPlayer } from '../state.js';
import { t } from './language.js';
import { playerStats, playerImages, playerServer, formatDuration } from '../domain/player-profile.js';

let assetsPromise;
let renderId = 0;
const placeholder = './assets/character-placeholder.svg';

export async function renderPlayerCard(player = currentPlayer) {
    const id = ++renderId;
    document.getElementById('display-player-name').removeAttribute('data-i18n');
    document.getElementById('display-player-lv').removeAttribute('data-i18n');
    document.getElementById('display-player-name').textContent = player.nickname;
    const server = playerServer(player.uid);
    document.getElementById('display-player-lv').textContent = `AR ${player.level} · UID ${player.uid}${server ? ` · ${server}` : ''}`;
    const signature = document.getElementById('player-signature');
    signature.textContent = typeof player.signature === 'string' ? player.signature.trim() : '';
    signature.hidden = !signature.textContent;
    renderPlayerStats(player);
    const portrait = document.getElementById('player-portrait');
    const background = document.getElementById('player-namecard');
    portrait.src = placeholder;
    background.hidden = true;
    background.removeAttribute('src');
    portrait.onerror = () => { portrait.onerror = null; portrait.src = placeholder; };
    background.onerror = () => { background.hidden = true; };
    assetsPromise ??= fetch(new URL('../../data/profile-assets.json', import.meta.url))
        .then(response => {
            if (!response.ok) throw new Error('Profile assets unavailable');
            return response.json();
        }).catch(() => { assetsPromise = null; return {}; });
    const assets = await assetsPromise;
    if (id !== renderId) return;
    const images = playerImages(player, assets);
    portrait.src = images.portrait || placeholder;
    if (images.namecard) {
        background.src = images.namecard;
        background.hidden = false;
    }
}

export function renderPlayerStats(player = currentPlayer) {
    const stats = playerStats(player);
    const missing = t('player.noData');
    const rows = [
        ['achievements', stats.achievements ?? '—', t('player.achievementsDetail')],
        ['abyss', `${stats.floor ?? '—'}-${stats.chamber ?? '—'} · ${stats.abyss ?? '—'} ★`,
            t('player.abyssDetail')],
        ['theater', `${t('player.act', { act: stats.theaterAct ?? '—' })} · ${stats.theater ?? '—'} ★`,
            t('player.arcana', { count: stats.theaterArcana ?? '—' })],
        ['stygian', stats.stygianSeconds !== null && stats.stygianLevel > 0 ? formatDuration(stats.stygianSeconds) : '—',
            stats.stygianLevel > 0 ? t('player.difficulty', { level: stats.stygianLevel }) : missing],
    ];
    const container = document.getElementById('player-stats');
    container.replaceChildren(...rows.map(([key, value, detail]) => {
        const item = document.createElement('div');
        item.className = 'player-stat';
        const label = document.createElement('dt');
        label.textContent = t(`player.${key}`);
        const result = document.createElement('dd');
        result.textContent = value;
        const context = document.createElement('span');
        context.textContent = value === '—' ? missing : detail;
        if (key === 'theater' && stats.theaterArcana === null) context.title = t('player.arcanaUnavailable');
        item.append(label, result, context);
        return item;
    }));
    const note = document.getElementById('player-stats-note');
    note.hidden = stats.theaterArcana !== null;
    note.textContent = t('player.arcanaUnavailable');
}
