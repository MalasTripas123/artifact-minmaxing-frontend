import { currentPlayer } from '../state.js';
import { t } from './language.js';
import { playerStats, playerImages, playerServer, formatDuration, stygianIcon } from '../domain/player-profile.js';

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
    background.onerror = () => {
        if (background.src.endsWith('.png')) {
            background.src = background.src.replace(/\.png$/, '.jpg');
        } else background.hidden = true;
    };
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
        background.src = images.namecard.replace(/\.jpg$/, '.png');
        background.hidden = false;
    }
}

export function renderPlayerStats(player = currentPlayer) {
    const stats = playerStats(player);
    const rows = [
        ['achievements', stats.achievements ?? '—'],
        ['abyss', `${stats.floor ?? '—'}-${stats.chamber ?? '—'} · ${stats.abyss ?? '—'}`,
            ''],
        ['theater', `${t('player.act', { act: stats.theaterAct ?? '—' })} · ${stats.theater ?? '—'}`,
            ''],
        ['stygian', stats.stygianSeconds !== null && stats.stygianLevel > 0
            ? formatDuration(stats.stygianSeconds) : '—'],
    ];
    const container = document.getElementById('player-stats');
    container.replaceChildren(...rows.map(([key, value, detail]) => {
        const item = document.createElement('div');
        item.className = 'player-stat';
        const label = document.createElement('dt');
        label.textContent = t(`player.${key}`);
        const titleIcon = { achievements: 'achievement', abyss: 'abyss', theater: 'theater' }[key];
        if (titleIcon) {
            const icon = document.createElement('img');
            icon.className = 'player-stat-title-icon';
            icon.src = `./assets/profile/${titleIcon}.webp`;
            icon.alt = '';
            label.prepend(icon);
        }
        const result = document.createElement('dd');
        result.textContent = value;
        if (key === 'abyss' || key === 'theater') {
            const stars = document.createElement('img');
            stars.className = 'player-stat-stars-icon';
            stars.src = `./assets/profile/${key}_stars.png`;
            stars.alt = t('player.stars');
            result.classList.add('player-stat-star-result');
            result.append(stars);
        }
        if (key === 'stygian' && stats.stygianLevel >= 1 && stats.stygianLevel <= 6) {
            const icon = document.createElement('img');
            icon.className = 'stygian-difficulty-icon';
            icon.src = stygianIcon(stats.stygianLevel, stats.stygianSeconds);
            icon.alt = t('player.difficulty', { level: stats.stygianLevel });
            icon.title = icon.alt;
            result.classList.add('stygian-result');
            result.prepend(icon);
        }
        item.append(label, result);
        return item;
    }));
    const note = document.getElementById('player-stats-note');
    note.hidden = true;
    note.textContent = '';
}
