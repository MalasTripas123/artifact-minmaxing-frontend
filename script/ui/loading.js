import { t } from './language.js';

const loadingSteps = [
    { delay: 2500, messageKey: 'loading.renderDelay' },
    { delay: 8000, messageKey: 'loading.stillWaiting' },
    { delay: 16000, messageKey: 'loading.waking' },
];

let activeTimers = [];

function getLoadingElements() {
    return {
        overlay: document.getElementById('loading-overlay'),
        title: document.getElementById('loading-title'),
        message: document.getElementById('loading-message'),
    };
}

function clearLoadingTimers() {
    activeTimers.forEach(timer => clearTimeout(timer));
    activeTimers = [];
}

export function showLoading({
    title = t('search.loadingSearch'),
    message = t('loading.connecting'),
} = {}) {
    const { overlay, title: titleElement, message: messageElement } = getLoadingElements();
    if (!overlay || !titleElement || !messageElement) return;

    clearLoadingTimers();
    titleElement.innerText = title;
    messageElement.innerText = message;
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-loading');

    activeTimers = loadingSteps.map(step => setTimeout(() => {
        messageElement.innerText = t(step.messageKey);
    }, step.delay));
}

export function hideLoading() {
    const { overlay } = getLoadingElements();
    if (!overlay) return;

    clearLoadingTimers();
    overlay.classList.remove('show');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-loading');
}
