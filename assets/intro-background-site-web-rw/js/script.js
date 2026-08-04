// ============================================
// DOM READY
// ============================================
document.addEventListener('DOMContentLoaded', () => {

    // ── Elements ──────────────────────────────
    const navbar = document.getElementById('navbar');

    // ── Mobile Menu ─────────────────────────────
    const menuToggle = document.getElementById('menu-toggle');
    const menuClose = document.getElementById('menu-close');
    const mobileMenu = document.getElementById('mobile-menu');

    const openMobileMenu = () => {
        if (!mobileMenu || !menuToggle) return;
        mobileMenu.classList.remove('hidden');
        menuToggle.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
        // Focus the close button after transition
        setTimeout(() => menuClose?.focus(), 100);
    };

    const closeMobileMenu = () => {
        if (!mobileMenu || !menuToggle) return;
        mobileMenu.classList.add('hidden');
        menuToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        menuToggle.focus();
    };

    if (menuToggle) menuToggle.addEventListener('click', openMobileMenu);
    if (menuClose) menuClose.addEventListener('click', closeMobileMenu);

    // Close on backdrop click
    if (mobileMenu) {
        mobileMenu.addEventListener('click', (e) => {
            if (e.target === mobileMenu) closeMobileMenu();
        });
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileMenu && !mobileMenu.classList.contains('hidden')) {
            closeMobileMenu();
        }
    });

    // Close when a menu link is clicked
    if (mobileMenu) {
        mobileMenu.querySelectorAll('.menu-link').forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });
    }

    // ── Navbar Scroll & Background Blur ─────────
    const siteBg = document.getElementById('site-bg');

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;

        // Glassmorphism trigger
        if (scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Progressive blur + darken on scroll
        const scrollRatio = Math.min(scrollY / 700, 1);
        if (siteBg) {
            // Drastic blur (up to 40px)
            siteBg.style.filter = `blur(${scrollRatio * 40}px) brightness(${1.0 - scrollRatio * 0.5})`;
            // Scale up slightly to prevent blurred edges from creating transparent borders
            siteBg.style.transform = `scale(${1 + scrollRatio * 0.15})`;
        }
    }, { passive: true });
});
