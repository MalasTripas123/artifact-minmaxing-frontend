const loadingSteps = [
    { delay: 2500, message: 'Render puede tardar unos segundos si el servidor estaba en reposo.' },
    { delay: 8000, message: 'Seguimos esperando la respuesta del backend.' },
    { delay: 16000, message: 'El servidor sigue despertando. La busqueda continuara automaticamente.' },
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
    title = 'Buscando jugador',
    message = 'Conectando con el servidor...',
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
        messageElement.innerText = step.message;
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
