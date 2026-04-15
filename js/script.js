const projectsData = [
    { id: 'p1', title: 'TrustUp', img: 'images/trustup.png', ratio: 'ratio-portrait', desc: 'Gestion de chantier & immobilier.', url: 'https://robinwattier.github.io/trust-up/', fullDesc: 'TrustUp est une plateforme minimaliste et performante dédiée à la gestion de projets de construction et immobiliers. Elle optimise le suivi des chantiers avec une interface premium en dark mode.' },
    { id: 'p2', title: 'Sonic Void', img: 'images/p2.png', ratio: 'ratio-square', desc: 'Generative audio visualization.', prompt: 'Abstract sculpture of sound waves, glowing neon particles.' },
    { id: 'p3', title: 'Ethereal Muse', img: 'images/p3.png', ratio: 'ratio-tall', desc: 'Avant-garde fashion visual.', prompt: 'Minimalist fashion editorial, metallic clothing, harsh shadows.' },
    { id: 'p4', title: 'Brutalist Echo', img: 'images/p4.png', ratio: 'ratio-square', desc: 'Architectural monolith study.', prompt: 'Brutalist concrete architecture, floating monolith, sunlight thru fog.' },
    { id: 'p5', title: 'Data Pulse', img: 'images/p5.png', ratio: 'ratio-portrait', desc: 'Complex network visualization.', prompt: 'Neural network data flow, interconnected golden nodes.' },
    { id: 'p6', title: 'Bio-Core', img: 'images/p6.png', ratio: 'ratio-tall', desc: 'Organic character rendering.', prompt: 'Surreal organic character, translucent glass skin, glowing core.' },
    { id: 'p7', title: 'Neon Solitude', img: 'images/p1.png', ratio: 'ratio-square', desc: 'A cyberpunk street exploration.', prompt: 'Neon-lit cyberpunk street, deep shadows, rainy atmosphere.' },
    { id: 'p8', title: 'Solar Flare', img: 'images/p2.png', ratio: 'ratio-tall', desc: 'Abstract generative art piece.', prompt: 'Solar flare abstract simulation, warm color palette, particle chaos.' },
    { id: 'p9', title: 'Zenith', img: 'images/p3.png', ratio: 'ratio-portrait', desc: 'Minimalist architecture exploration.', prompt: 'Zen garden floating in space, minimalist architecture, white marble.' }
];

// ============================================
// DOM READY
// ============================================
document.addEventListener('DOMContentLoaded', () => {

    // ── Elements ──────────────────────────────
    const navbar         = document.getElementById('navbar');
    const burgerMenu     = document.getElementById('burger-menu');
    const fullScreenMenu = document.getElementById('fullscreen-menu');
    const closeMenuBtn   = document.getElementById('close-menu');
    const projectsContainer = document.getElementById('projects-container');

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
        const scrollRatio = Math.min(scrollY / 700, 1); // Max out a bit earlier
        if (siteBg) {
            // Drastic blur (up to 40px)
            siteBg.style.filter = `blur(${scrollRatio * 40}px) brightness(${1.0 - scrollRatio * 0.5})`;
            // Scale up slightly to prevent blurred edges from creating transparent borders
            siteBg.style.transform = `scale(${1 + scrollRatio * 0.15})`;
        }
    }, { passive: true });

    // ── Burger Menu ───────────────────────────
    const openMenu = () => {
        fullScreenMenu.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    };

    const closeMenu = () => {
        fullScreenMenu.classList.add('hidden');
        document.body.style.overflow = '';
    };

    burgerMenu.addEventListener('click', openMenu);
    closeMenuBtn.addEventListener('click', closeMenu);

    // Close on backdrop click (not on links)
    fullScreenMenu.addEventListener('click', (e) => {
        if (!e.target.closest('.menu-link') && !e.target.closest('.close-btn')) {
            closeMenu();
        }
    });

    fullScreenMenu.querySelectorAll('.menu-link').forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    // ── Render Work Grid ──────────────────────
    const renderProjects = () => {
        if (!projectsContainer) return;
        projectsContainer.innerHTML = '';

        projectsData.forEach(project => {
            const article = document.createElement('article');
            article.className = 'project-card';
            article.setAttribute('role', 'button');
            article.setAttribute('tabindex', '0');
            article.innerHTML = `
                <div class="card-image-wrapper ${project.ratio || ''}">
                    <img src="${project.img}" alt="${project.title}" class="card-img" loading="lazy">
                    <div class="card-overlay">
                        <span class="card-overlay-title">${project.title}</span>
                    </div>
                </div>
            `;
            article.addEventListener('click', () => openProjectModal(project));
            article.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') openProjectModal(project);
            });
            projectsContainer.appendChild(article);
        });
    };

    renderProjects();

    // ── Project Modal ─────────────────────────
    const showToast = (message) => {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    };

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            showToast("Prompt copié dans le presse-papier !");
        } catch (err) {
            console.error("Erreur de copie :", err);
        }
    };

    const openProjectModal = (project) => {
        const projectModal   = document.getElementById('project-modal');
        const projectDetails = document.getElementById('project-details');

        const defaultDesc = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Explorant les frontières entre l'intelligence artificielle et le design visuel, ce projet illustre une quête d'esthétique minimaliste et de fonctionnalité futuriste. Chaque détail est pensé pour créer une expérience immersive et inspirante.";

        const mediaHTML = project.img
            ? `<div class="project-modal-gallery"><img src="${project.img}" alt="${project.title}"></div>`
            : '';

        const promptSection = project.prompt
            ? `<p class="modal-prompt">Prompt</p>
               <div class="modal-prompt-container">
                   <button class="copy-prompt-btn" title="Copier le prompt">
                       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                   </button>
                   <blockquote class="modal-prompt-text">${project.prompt}</blockquote>
               </div>`
            : '';

        projectDetails.innerHTML = `
            ${mediaHTML}
            <div class="project-modal-details">
                <h2 class="modal-title">${project.title}</h2>
                <p class="modal-desc">${project.fullDesc || defaultDesc}</p>
                ${promptSection}
                ${project.url ? `<a href="${project.url}" target="_blank" rel="noopener noreferrer" class="visit-project-btn">Visit Website</a>` : ''}
            </div>
        `;

        // Attach copy event
        if (project.prompt) {
            const copyBtn = projectDetails.querySelector('.copy-prompt-btn');
            if (copyBtn) {
                copyBtn.addEventListener('click', () => copyToClipboard(project.prompt));
            }
        }

        projectModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    };

    // Close modal
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            if (modal) {
                modal.classList.add('hidden');
                document.body.style.overflow = '';
            }
        });
    });

    // Click on backdrop
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.add('hidden');
            document.body.style.overflow = '';
        }
    });

    // Typewriter removed for ASCII intro
});
