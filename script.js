/* ============================================================
   MUSIC PORTFOLIO — SCRIPT.JS
   Logique interactive : horloge, hover, text scramble, idle,
   background dynamique
   ============================================================ */

/* ============================================================
   SECTION : CONFIGURATION
   Modifier ici le fuseau horaire, les délais et les paramètres
   ============================================================ */
const CONFIG = {
  timeZone: "America/New_York",     // Fuseau horaire pour l'horloge
  timeUpdateInterval: 1000,          // Intervalle de mise à jour horloge (ms)
  idleDelay: 4000,                   // Délai avant animation idle (ms)
  debounceDelay: 100,                // Anti-rebond sur mouseleave (ms)
  scrambleDuration: 0.8,             // Durée de l'animation scramble (s)
  scrambleChars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%", // Caractères utilisés pour le scramble
};

/* ============================================================
   SECTION : DONNÉES DES PROJETS
   Les projets sont définis directement dans index.html
   dans les <div class="project-data-item"> avec data-*.
   Cette fonction lit le HTML et construit le tableau.
   ============================================================ */
function loadProjectsFromDOM() {
  const items = document.querySelectorAll(".project-data-item");
  return Array.from(items).map((el, i) => ({
    id: i + 1,
    artist: el.dataset.artist || "",
    album:  el.dataset.album  || "",
    label:  el.dataset.label  || "",
    year:   el.dataset.year   || "",
    image:  el.dataset.image  || "",
    url:    el.dataset.url    || "",
  }));
}

let PROJECTS_DATA = []; // rempli au DOMContentLoaded

/* ============================================================
   SECTION : LIENS SOCIAUX
   Modifier ici les URLs des liens affichés en haut à droite
   ============================================================ */
const SOCIAL_LINKS = {
  contact: "https://linktr.ee/robinwattier",
};

/* ============================================================
   SECTION : LOCALISATION
   Modifier ici les coordonnées GPS affichées en bas à gauche
   ============================================================ */
const LOCATION = {
  display: "43.9250° N, 19.5530° E",
};

/* ============================================================
   SECTION : ÉTAT INTERNE (ne pas modifier)
   ============================================================ */
let activeIndex = -1;
let isIdle = true;
let idleTimerRef = null;
let idleAnimationRef = null;
let debounceRef = null;

/* ============================================================
   SECTION : RÉFÉRENCES DOM
   ============================================================ */
const backgroundEl = document.getElementById("backgroundImage");
const portfolioContainer = document.getElementById("portfolioContainer");
const projectList = document.getElementById("projectList");
const timeDisplay = document.getElementById("currentTime");
const locationDisplay = document.getElementById("locationDisplay");

/* ============================================================
   SECTION : INITIALISATION — Construction du DOM
   Lit les projets depuis le HTML (index.html > #projectsData)
   et génère dynamiquement les lignes de la liste.
   ============================================================ */
function buildProjectList() {
  PROJECTS_DATA = loadProjectsFromDOM();
  projectList.innerHTML = "";

  PROJECTS_DATA.forEach((project, index) => {
    const li = document.createElement("li");
    li.className = "project-item";
    li.dataset.index = index;
    li.dataset.image = project.image;

    li.innerHTML = `
      <span class="project-index">${String(index + 1).padStart(2, "0")}</span>
      <span class="project-data artist hover-text" data-field="artist">${project.artist}</span>
      <span class="project-data album hover-text" data-field="album">${project.album}</span>
      <span class="project-data label hover-text" data-field="label">${project.label}</span>
      <span class="project-data year hover-text" data-field="year">${project.year}</span>
    `;

    if (project.url) {
      li.classList.add("has-link");
      li.addEventListener("click", (e) => {
        if (!e.target.closest("a")) {
          window.open(project.url, "_blank", "noopener,noreferrer");
        }
      });
    }

    // — Événements hover —
    li.addEventListener("mouseenter", () =>
      handleProjectMouseEnter(index, project.image)
    );
    li.addEventListener("mouseleave", handleProjectMouseLeave);

    projectList.appendChild(li);
  });
}

/* ============================================================
   SECTION : INITIALISATION — Coordonnées GPS
   ============================================================ */
function initLocation() {
  if (locationDisplay) {
    locationDisplay.textContent = LOCATION.display;
  }
}

/* ============================================================
   SECTION : INITIALISATION — Liens sociaux
   ============================================================ */
function initSocialLinks() {
  const contactLink = document.getElementById("linkContact");
  if (contactLink) contactLink.href = SOCIAL_LINKS.contact;
}

/* ============================================================
   SECTION : HORLOGE EN TEMPS RÉEL
   Met à jour l'heure chaque seconde dans le fuseau configuré
   ============================================================ */
function updateTime() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: CONFIG.timeZone,
    hour12: true,
    hour: "numeric",
    minute: "numeric",
  });
  const parts = formatter.formatToParts(now);

  const hours = parts.find((p) => p.type === "hour")?.value || "";
  const minutes = parts.find((p) => p.type === "minute")?.value || "";
  const dayPeriod = parts.find((p) => p.type === "dayPeriod")?.value || "";

  if (timeDisplay) {
    timeDisplay.innerHTML = `${hours}<span class="time-blink">:</span>${minutes} ${dayPeriod}`;
  }
}

/* ============================================================
   SECTION : PRELOAD DES IMAGES
   Charge les images en arrière-plan pour un affichage instantané
   ============================================================ */
function preloadImages() {
  PROJECTS_DATA.forEach((project) => {
    if (project.image) {
      const img = new Image();
      img.src = project.image;
    }
  });
}

/* ============================================================
   SECTION : TEXT SCRAMBLE — Implémentation vanilla
   Reproduit l'effet GSAP ScrambleTextPlugin sans dépendance
   payante. Remplace progressivement les caractères aléatoires
   par le texte final.
   ============================================================ */
const activeScrambles = new Map(); // track running scrambles

function scrambleText(element, targetText, duration, chars) {
  // Kill any running scramble on this element
  if (activeScrambles.has(element)) {
    cancelAnimationFrame(activeScrambles.get(element));
    activeScrambles.delete(element);
  }

  const startTime = performance.now();
  const durationMs = duration * 1000;
  const revealDelay = 0.3 * durationMs; // 30% delay before revealing starts
  const len = targetText.length;

  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / durationMs, 1);

    let result = "";

    for (let i = 0; i < len; i++) {
      // Calculate per-character reveal progress
      const charProgress = Math.max(
        0,
        (elapsed - revealDelay) / (durationMs - revealDelay)
      );
      const revealThreshold = i / len;

      if (charProgress > revealThreshold) {
        // Revealed — show real character
        result += targetText[i];
      } else {
        // Still scrambling — random char
        result += chars[Math.floor(Math.random() * chars.length)];
      }
    }

    if (progress < 1) {
      element.textContent = result;
      const rafId = requestAnimationFrame(animate);
      activeScrambles.set(element, rafId);
    } else {
      element.textContent = targetText;
      activeScrambles.delete(element);
    }
  }

  const rafId = requestAnimationFrame(animate);
  activeScrambles.set(element, rafId);
}

function killScramble(element) {
  if (activeScrambles.has(element)) {
    cancelAnimationFrame(activeScrambles.get(element));
    activeScrambles.delete(element);
  }
}

/* ============================================================
   SECTION : HOVER — Entrée sur un projet
   Active le scramble, affiche le background, dimme les autres
   ============================================================ */
function handleProjectMouseEnter(index, imageUrl) {
  if (debounceRef) {
    clearTimeout(debounceRef);
    debounceRef = null;
  }

  stopIdleAnimation();
  stopIdleTimer();
  isIdle = false;

  if (activeIndex === index) return;
  activeIndex = index;

  // Ajouter classe active sur le container
  portfolioContainer.classList.add("has-active");

  // Mettre à jour les classes active sur les items
  const items = projectList.querySelectorAll(".project-item");
  items.forEach((item, i) => {
    item.classList.toggle("active", i === index);
  });

  // — Text scramble sur l'item actif —
  const activeItem = items[index];
  if (activeItem) {
    const fields = activeItem.querySelectorAll(".hover-text");
    const project = PROJECTS_DATA[index];

    fields.forEach((field) => {
      const key = field.dataset.field;
      if (key && project[key]) {
        scrambleText(
          field,
          project[key],
          CONFIG.scrambleDuration,
          CONFIG.scrambleChars
        );
      }
    });
  }

  // — Background image avec animation scale —
  if (imageUrl && backgroundEl) {
    backgroundEl.style.transition = "none";
    backgroundEl.style.transform = "scale(1.08)";
    backgroundEl.style.backgroundImage = `url(${imageUrl})`;
    backgroundEl.style.opacity = "1";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        backgroundEl.style.transition =
          "opacity 0.6s ease, transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
        backgroundEl.style.transform = "scale(1.0)";
      });
    });
  }
}

/* ============================================================
   SECTION : HOVER — Sortie d'un projet
   Anti-rebond léger pour éviter les clignotements
   ============================================================ */
function handleProjectMouseLeave() {
  debounceRef = setTimeout(() => {
    // Reset text handled by next mouseenter or container leave
  }, CONFIG.debounceDelay);
}

/* ============================================================
   SECTION : HOVER — Sortie du container
   Reset complet : masque le background, relance le timer idle
   ============================================================ */
function handleContainerMouseLeave() {
  if (debounceRef) {
    clearTimeout(debounceRef);
    debounceRef = null;
  }

  activeIndex = -1;

  // Retirer les classes active
  portfolioContainer.classList.remove("has-active");
  const items = projectList.querySelectorAll(".project-item");
  items.forEach((item) => {
    item.classList.remove("active");

    // Reset text content
    const idx = parseInt(item.dataset.index);
    const project = PROJECTS_DATA[idx];
    if (project) {
      item.querySelectorAll(".hover-text").forEach((field) => {
        const key = field.dataset.field;
        killScramble(field);
        if (key && project[key]) {
          field.textContent = project[key];
        }
      });
    }
  });

  // Masquer le background
  if (backgroundEl) {
    backgroundEl.style.opacity = "0";
  }

  // Relancer le timer idle
  startIdleTimer();
}

/* ============================================================
   SECTION : ANIMATION IDLE
   Cascade de fade-out / fade-in sur les items quand l'utilisateur
   n'interagit plus avec la liste (après CONFIG.idleDelay ms)
   ============================================================ */
function startIdleAnimation() {
  if (idleAnimationRef) return;

  const items = projectList.querySelectorAll(".project-item");
  if (items.length === 0) return;

  // GSAP-like idle timeline using CSS + JS
  const totalItems = items.length;
  const stagger = 0.05; // secondes entre chaque item
  const fadeDuration = 100; // ms
  const cyclePause = 2000; // ms pause entre les cycles

  function runCycle() {
    // Phase 1: Cascade fade-out
    items.forEach((item, i) => {
      setTimeout(() => {
        item.style.transition = `opacity ${fadeDuration}ms ease-in-out`;
        item.style.opacity = "0.05";
      }, i * stagger * 1000);
    });

    // Phase 2: Cascade fade-in (after all have faded out)
    const fadeOutEnd = totalItems * stagger * 1000 * 0.5;
    items.forEach((item, i) => {
      setTimeout(() => {
        item.style.transition = `opacity ${fadeDuration}ms ease-in-out`;
        item.style.opacity = "1";
      }, fadeOutEnd + totalItems * stagger * 1000 + i * stagger * 1000);
    });

    // Schedule next cycle
    const cycleTotal =
      fadeOutEnd + totalItems * stagger * 1000 * 2 + cyclePause;
    idleAnimationRef = setTimeout(runCycle, cycleTotal);
  }

  runCycle();
}

function stopIdleAnimation() {
  if (idleAnimationRef) {
    clearTimeout(idleAnimationRef);
    idleAnimationRef = null;

    // Reset all items to full opacity
    const items = projectList.querySelectorAll(".project-item");
    items.forEach((item) => {
      item.style.transition = "opacity 0.2s ease";
      item.style.opacity = "1";
    });
  }
}

/* ============================================================
   SECTION : TIMER IDLE
   Attend CONFIG.idleDelay ms après la dernière interaction
   puis lance l'animation idle
   ============================================================ */
function startIdleTimer() {
  stopIdleTimer();
  idleTimerRef = setTimeout(() => {
    if (activeIndex === -1) {
      isIdle = true;
      startIdleAnimation();
    }
  }, CONFIG.idleDelay);
}

function stopIdleTimer() {
  if (idleTimerRef) {
    clearTimeout(idleTimerRef);
    idleTimerRef = null;
  }
}

/* ============================================================
   SECTION : MENU HAMBURGER MOBILE
   Gère l'ouverture et fermeture du menu plein écran sur mobile
   ============================================================ */
function initMobileMenu() {
  const toggleBtn = document.getElementById("menuToggle");
  const closeBtn = document.getElementById("menuCloseBtn");
  const mobileMenu = document.getElementById("mobileMenu");

  if (!toggleBtn || !mobileMenu) return;

  function closeMenu() {
    mobileMenu.classList.remove("is-open");
    toggleBtn.classList.remove("is-active");
    toggleBtn.setAttribute("aria-expanded", "false");
    mobileMenu.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function openMenu() {
    mobileMenu.classList.add("is-open");
    toggleBtn.classList.add("is-active");
    toggleBtn.setAttribute("aria-expanded", "true");
    mobileMenu.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  toggleBtn.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.contains("is-open");
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", closeMenu);
  }

  // Fermer avec la touche Échap
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mobileMenu.classList.contains("is-open")) {
      closeMenu();
    }
  });

  // Fermer le menu lors d'un clic sur un lien
  const links = mobileMenu.querySelectorAll("a");
  links.forEach((link) => {
    link.addEventListener("click", closeMenu);
  });
}

/* ============================================================
   SECTION : INITIALISATION AU CHARGEMENT
   Lance toutes les fonctions d'init au DOMContentLoaded
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  // Construire la liste des projets
  buildProjectList();

  // Initialiser les coins (liens, coordonnées)
  initSocialLinks();
  initLocation();
  initMobileMenu();

  // Année dynamique dans le footer
  const footerYear = document.getElementById("footerYear");
  if (footerYear) footerYear.textContent = new Date().getFullYear();

  // Preloader les images
  preloadImages();

  // Démarrer l'horloge
  updateTime();
  setInterval(updateTime, CONFIG.timeUpdateInterval);

  // Attacher le mouseleave sur le container
  portfolioContainer.addEventListener("mouseleave", handleContainerMouseLeave);

  // Lancer le timer idle
  startIdleTimer();
});
