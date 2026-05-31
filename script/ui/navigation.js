const NAV_BREAKPOINT_QUERY = '(min-width: 1320px)';
const SECTION_NAV_HEIGHT_VAR = '--section-nav-height';
const SECTION_NAV_TOP_VAR = '--section-nav-top';

let sectionNav;
let layoutFrame = null;

export function initSectionNavigation() {
    sectionNav = document.getElementById('section-nav');
    if (!sectionNav) return;

    sectionNav.addEventListener('click', (event) => {
        const button = event.target.closest('.section-nav-btn');
        if (!button) return;

        scrollToNavTarget(button.dataset.navTarget);
    });

    window.addEventListener('scroll', updateActiveNavItem, { passive: true });
    window.addEventListener('resize', requestSectionNavigationSync);

    requestSectionNavigationSync();
}

export function requestSectionNavigationSync() {
    if (layoutFrame) cancelAnimationFrame(layoutFrame);

    syncSectionNavigation();

    layoutFrame = requestAnimationFrame(() => {
        layoutFrame = null;
        syncSectionNavigation();
    });
}

function syncSectionNavigation() {
    if (!sectionNav) return;

    const hasResults = isResultsVisible();
    sectionNav.hidden = !hasResults;
    sectionNav.classList.toggle('is-visible', hasResults);
    document.body.classList.toggle('has-results-nav', hasResults);
    void document.body.offsetWidth;

    if (!hasResults) {
        document.documentElement.style.setProperty(SECTION_NAV_HEIGHT_VAR, '0px');
        return;
    }

    const hasCharacter = isCharacterVisible();
    sectionNav.classList.toggle('has-character', hasCharacter);
    updateCharacterNavLabel();
    updateNavLayout();
    updateActiveNavItem();
}

function updateCharacterNavLabel() {
    const label = document.getElementById('section-nav-character-label');
    const characterName = document.querySelector('#char-header h2')?.innerText.trim();

    if (label) label.innerText = characterName || 'Personaje';
}

function updateNavLayout() {
    const navHeight = sectionNav.hidden ? 0 : sectionNav.offsetHeight;
    document.documentElement.style.setProperty(SECTION_NAV_HEIGHT_VAR, `${navHeight}px`);

    if (!isDesktopNav()) return;

    const headerRect = document.getElementById('header-section').getBoundingClientRect();

    sectionNav.style.setProperty(SECTION_NAV_TOP_VAR, `${Math.max(14, headerRect.bottom + 12)}px`);
}

function scrollToNavTarget(target) {
    if (target === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    const targetElement = getNavTargetElement(target);
    if (!targetElement) return;

    const top = getDocumentTop(targetElement) - getScrollOffset(target) - 8;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

function updateActiveNavItem() {
    if (!sectionNav || sectionNav.hidden) return;

    const sections = getVisibleSections();
    if (sections.length === 0) return;

    const probeY = window.scrollY + getCurrentStickyOffset() + 24;
    let activeSection = sections[0].id;

    for (const section of sections) {
        if (getDocumentTop(section.element) <= probeY) {
            activeSection = section.id;
        }
    }

    sectionNav.querySelectorAll('.section-nav-btn').forEach(button => {
        button.classList.toggle('active', button.dataset.navTarget === activeSection);
    });
}

function getVisibleSections() {
    const sections = [
        { id: 'home', element: document.getElementById('header-section') },
        { id: 'characters', element: document.getElementById('characters-section-title') },
        { id: 'character', element: document.getElementById('character-detail') },
        { id: 'artifacts', element: document.getElementById('artifacts-section-title') },
        { id: 'maximizer', element: document.getElementById('maximizer-section-title') },
    ];

    return sections.filter(section => section.element && isNavButtonVisible(section.id));
}

function getNavTargetElement(target) {
    const targets = {
        characters: 'characters-section-title',
        character: 'character-detail',
        artifacts: 'artifacts-section-title',
        maximizer: 'maximizer-section-title',
    };

    return document.getElementById(targets[target]);
}

function isNavButtonVisible(target) {
    const button = sectionNav.querySelector(`[data-nav-target="${target}"]`);
    return button && getComputedStyle(button).display !== 'none';
}

function getScrollOffset(target) {
    const mobileNavOffset = isDesktopNav() ? 0 : sectionNav.offsetHeight;
    const characterHeaderOffset = target === 'artifacts' || target === 'maximizer'
        ? getCharacterHeaderHeight()
        : 0;

    return mobileNavOffset + characterHeaderOffset;
}

function getCurrentStickyOffset() {
    const mobileNavOffset = isDesktopNav() ? 0 : sectionNav.offsetHeight;
    const charHeader = document.getElementById('char-header');
    if (!charHeader) return mobileNavOffset;

    const charHeaderTop = getDocumentTop(charHeader);
    const isCharHeaderSticky = window.scrollY + mobileNavOffset >= charHeaderTop;

    return mobileNavOffset + (isCharHeaderSticky ? getCharacterHeaderHeight() : 0);
}

function getCharacterHeaderHeight() {
    const charHeader = document.getElementById('char-header');
    return charHeader ? charHeader.offsetHeight : 0;
}

function isResultsVisible() {
    const resultsArea = document.getElementById('results-area');
    return resultsArea && getComputedStyle(resultsArea).display !== 'none';
}

function isCharacterVisible() {
    const characterDetail = document.getElementById('character-detail');
    return characterDetail && getComputedStyle(characterDetail).display !== 'none';
}

function isDesktopNav() {
    return window.matchMedia(NAV_BREAKPOINT_QUERY).matches;
}

function getDocumentTop(element) {
    return window.scrollY + element.getBoundingClientRect().top;
}
