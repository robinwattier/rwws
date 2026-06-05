/**
 * Music Portfolio — main.js
 * Pure HTML/CSS/JavaScript — no framework dependencies.
 *
 * Features:
 *  • Text-scramble animation on hover (custom, GSAP-free)
 *  • Background image crossfade per project
 *  • Idle staggered-pulse animation after 4 s of inactivity
 *  • Dimming of non-hovered rows
 */

'use strict';

/* ============================================================
   CONFIG
   ============================================================ */
const CONFIG = {
  timeZone: 'America/New_York',
  timeUpdateInterval: 1000,   // ms
  idleDelay: 4000,            // ms before idle animation kicks in
  scrambleChars: 'qwerty1337h@ck3r!#$%&*<>?/|~',
  scrambleDuration: 700,      // ms total duration of scramble
  scrambleSteps: 18,          // iterations during scramble
};

/* ============================================================
   DATA  (défini dans index.html → window.PROJECTS)
   ============================================================ */
const PROJECTS = window.PROJECTS || [];

/* Alias pratique pour les libellés UI (définis dans index.html → window.SITE_LABELS) */
const LABELS = window.SITE_LABELS || {};





/* ============================================================
   SCRAMBLE TEXT UTILITY
   ============================================================ */
class TextScrambler {
  constructor(el) {
    this.el = el;
    this.originalText = el.textContent;
    this._raf = null;
    this._timeout = null;
  }

  /**
   * Animate from current text to `targetText`.
   * @param {string} targetText
   */
  scramble(targetText) {
    this._cancel();
    const chars   = CONFIG.scrambleChars;
    const steps   = CONFIG.scrambleSteps;
    const duration = CONFIG.scrambleDuration;
    const stepMs  = duration / steps;

    let iteration = 0;
    const totalLen = targetText.length;

    const tick = () => {
      const progress = iteration / steps;                  // 0 → 1
      const revealedCount = Math.floor(progress * totalLen);

      let result = '';
      for (let i = 0; i < totalLen; i++) {
        if (i < revealedCount) {
          result += targetText[i];
        } else {
          result += chars[Math.floor(Math.random() * chars.length)];
        }
      }
      this.el.textContent = result;

      iteration++;
      if (iteration <= steps) {
        this._timeout = setTimeout(tick, stepMs);
      } else {
        this.el.textContent = targetText;
      }
    };

    tick();
  }

  /** Reset to original text immediately. */
  reset() {
    this._cancel();
    this.el.textContent = this.originalText;
  }

  _cancel() {
    if (this._timeout !== null) {
      clearTimeout(this._timeout);
      this._timeout = null;
    }
    if (this._raf !== null) {
      cancelAnimationFrame(this._raf);
      this._raf = null;
    }
  }
}

/* ============================================================
   DOM HELPERS
   ============================================================ */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ============================================================
   BACKGROUND IMAGE
   ============================================================ */
function initBackground() {
  const bgEl = $('#bgImage');
  const videoEl = $('#bgVideo');
  if (!bgEl) return;

  let currentUrl = '';
  let currentVideoUrl = '';

  // Preload all images
  PROJECTS.forEach(p => {
    if (p.image) {
      const img = new Image();
      img.src = p.image;
    }
  });

  return {
    show(imageUrl, videoUrl) {
      if (videoUrl) {
        // Hide image
        bgEl.classList.remove('is-visible');
        currentUrl = '';

        // Show & play video
        if (videoUrl !== currentVideoUrl) {
          currentVideoUrl = videoUrl;
          if (videoEl) {
            videoEl.src = videoUrl;
            videoEl.load();
          }
        }
        if (videoEl) {
          videoEl.play().catch(e => console.log('Video play failed:', e));
          videoEl.classList.add('is-visible');
        }
      } else {
        // Hide video
        if (videoEl) {
          videoEl.classList.remove('is-visible');
          videoEl.pause();
        }
        currentVideoUrl = '';

        // Show image
        if (imageUrl) {
          if (imageUrl !== currentUrl) {
            currentUrl = imageUrl;
            bgEl.style.backgroundImage = `url(${imageUrl})`;
          }
          bgEl.classList.add('is-visible');
        } else {
          bgEl.classList.remove('is-visible');
          currentUrl = '';
        }
      }
    },
    hide() {
      bgEl.classList.remove('is-visible');
      currentUrl = '';
      if (videoEl) {
        videoEl.classList.remove('is-visible');
        videoEl.pause();
      }
      currentVideoUrl = '';
    },
  };
}

/* ============================================================
   IDLE ANIMATION
   ============================================================ */
function createIdleManager(itemEls) {
  let idleTimer = null;
  let idleActive = false;
  let idleAnimationIds = [];

  /**
   * Stagger-pulse each item via CSS animation delay.
   */
  function startIdle() {
    if (idleActive) return;
    idleActive = true;

    itemEls.forEach((el, i) => {
      el.classList.add('is-idle');
      el.style.animationDelay = `${i * 80}ms`;
    });
  }

  function stopIdle() {
    if (!idleActive) return;
    idleActive = false;

    itemEls.forEach(el => {
      el.classList.remove('is-idle');
      el.style.animationDelay = '';
      el.style.opacity = '';
    });
  }

  function scheduleIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(startIdle, CONFIG.idleDelay);
  }

  function cancelIdle() {
    clearTimeout(idleTimer);
    stopIdle();
  }

  return { scheduleIdle, cancelIdle };
}

/* ============================================================
   PROJECT LIST RENDERING & INTERACTION
   ============================================================ */
function initProjectList(bg, detail) {
  const listEl = $('#projectList');
  if (!listEl) return;

  // Toggle glass banner background on scroll
  const headerEl = $('.list-header', listEl);
  if (headerEl) {
    const updateHeaderScroll = () => {
      headerEl.classList.toggle('scrolled', listEl.scrollTop > 4);
    };
    listEl.addEventListener('scroll', updateHeaderScroll, { passive: true });
    updateHeaderScroll(); // Run immediately to handle scroll restoration on reload
  }

  /* --- Apply UI labels from SITE_LABELS (index.html) --- */
  const headerSpans = $$('span', headerEl || listEl);
  if (headerEl && LABELS) {
    const cols = ['colName', 'colType', 'colAuthor', 'colYear'];
    const spans = $$('span', headerEl);
    cols.forEach((key, i) => { if (spans[i] && LABELS[key]) spans[i].textContent = LABELS[key]; });
  }

  /* --- Render items --- */
  PROJECTS.forEach((project, index) => {
    const li = document.createElement('li');
    li.className = 'project-item';
    li.setAttribute('role', 'listitem');
    li.dataset.index = index;
    li.dataset.image = project.image || '';
    li.dataset.video = project.video || '';

    const fields = [
      { key: 'name',     cls: 'album'    },
      { key: 'type',     cls: 'category' },
      { key: 'author',   cls: 'label'    },
      { key: 'year',     cls: 'year'     },
    ];

    fields.forEach(({ key, cls }) => {
      const span = document.createElement('span');
      span.className = `project-data ${cls}`;
      span.textContent = project[key];
      li.appendChild(span);
    });

    listEl.appendChild(li);
  });

  /* --- Scramble instances per row --- */
  const itemEls    = $$('.project-item', listEl);
  const scramblers = itemEls.map(el => {
    const spans = $$('.project-data', el);
    return spans.map(span => new TextScrambler(span));
  });

  /* --- Idle manager --- */
  const idle = createIdleManager(itemEls);
  idle.scheduleIdle();

  let activeIndex = -1;
  let leaveDebounce = null;

  const siteBgEl   = $('#site-bg');

  /* --- Mouse enter on item --- */
  itemEls.forEach((el, i) => {
    el.addEventListener('mouseenter', () => {
      clearTimeout(leaveDebounce);
      idle.cancelIdle();

      if (activeIndex === i) return;
      activeIndex = i;

      // Mark active item + dim siblings
      itemEls.forEach((item, j) => {
        item.classList.toggle('is-active', j === i);
      });
      listEl.classList.add('has-active');
      if (siteBgEl) {
        siteBgEl.classList.add('has-hover');
      }

      // Scramble all data cells of hovered item
      scramblers[i].forEach((sc, k) => {
        const project = PROJECTS[i];
        const keys    = ['name', 'type', 'author', 'year'];
        sc.originalText = project[keys[k]]; // ensure original is synced
        sc.scramble(project[keys[k]]);
      });

      // Show background
      bg.show(el.dataset.image, el.dataset.video);
    });

    el.addEventListener('mouseleave', () => {
      // Reset scramble on leave
      scramblers[i].forEach(sc => sc.reset());
    });

    // Click → open detail view
    el.addEventListener('click', () => {
      if (detail && detail.openDetail) {
        detail.openDetail(PROJECTS[i]);
      }
    });
  });

  /* --- Mouse leave on container --- */
  listEl.addEventListener('mouseleave', () => {
    if (document.body.classList.contains('detail-open')) return;
    leaveDebounce = setTimeout(() => {
      if (document.body.classList.contains('detail-open')) return;
      activeIndex = -1;
      itemEls.forEach(el => el.classList.remove('is-active'));
      listEl.classList.remove('has-active');
      if (siteBgEl) {
        siteBgEl.classList.remove('has-hover');
      }
      bg.hide();
      idle.scheduleIdle();
    }, 60);
  });

  function resetListState() {
    clearTimeout(leaveDebounce);
    activeIndex = -1;
    itemEls.forEach(el => el.classList.remove('is-active'));
    scramblers.forEach((rowScramblers) => {
      rowScramblers.forEach(sc => sc.reset());
    });
    listEl.classList.remove('has-active');
    if (siteBgEl) {
      siteBgEl.classList.remove('has-hover');
    }
    bg.hide();
    idle.scheduleIdle();
  }

  return { resetListState };
}

/* ============================================================
   WEBGL WATER RIPPLE SHADER EFFECT
   ============================================================ */
class WaterRippleImageEffect {
  constructor(canvas, src, options = {}) {
    this.canvas = canvas;
    this.src = src;
    
    // Default visual params mirroring demo.tsx / gallery.md exactly
    this.options = Object.assign({
      blueish: 0.6,
      scale: 7.0,
      illumination: 0.15,
      surfaceDistortion: 0.07,
      waterDistortion: 0.03,
      scaleFactor: 1.05, // decreased from 1.12 to expand photographic cutouts virtually edge-to-edge
    }, options);

    this.gl = this.canvas.getContext('webgl', { alpha: true, antialias: true }) ||
              this.canvas.getContext('experimental-webgl');
    if (!this.gl) {
      console.warn('WebGL not supported on this browser or limit exceeded.');
      const wrapper = this.canvas.closest('.gallery-img-wrapper');
      if (wrapper) {
        wrapper.style.display = 'none';
      }
      return;
    }

    this.program = null;
    this.texture = null;
    this.image = null;
    this.vbo = null;
    this.animationFrameId = null;
    
    this.isLoaded = false;
    this.isActive = true;
    this.startTime = performance.now();

    this.init();
  }

  init() {
    const gl = this.gl;
    try {
      // Identical shaders matching the source react component
      const VERT = `
        precision mediump float;
        varying vec2 vUv;
        attribute vec2 a_position;
        void main() {
          vUv = .5 * (a_position + 1.);
          gl_Position = vec4(a_position, 0.0, 1.0);
        }
      `;

      const FRAG = `
        precision highp float;

        varying vec2 vUv;
        uniform sampler2D u_image_texture;
        uniform float u_time;
        uniform float u_ratio;
        uniform float u_img_ratio;
        uniform float u_blueish;
        uniform float u_scale;
        uniform float u_illumination;
        uniform float u_surface_distortion;
        uniform float u_water_distortion;
        uniform float u_scale_factor;

        #define TWO_PI 6.28318530718
        #define PI 3.14159265358979323846

        vec3 mod289(vec3 x) { return x - floor(x * (1. / 289.)) * 289.; }
        vec2 mod289(vec2 x) { return x - floor(x * (1. / 289.)) * 289.; }
        vec3 permute(vec3 x) { return mod289(((x*34.)+1.)*x); }
        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
          vec2 i = floor(v + dot(v, C.yy));
          vec2 x0 = v - i + dot(i, C.xx);
          vec2 i1;
          i1 = (x0.x > x0.y) ? vec2(1., 0.) : vec2(0., 1.);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute(permute(i.y + vec3(0., i1.y, 1.)) + i.x + vec3(0., i1.x, 1.));
          vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.);
          m = m*m;
          m = m*m;
          vec3 x = 2. * fract(p * C.www) - 1.;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
          vec3 g;
          g.x = a0.x * x0.x + h.x * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130. * dot(m, g);
        }

        mat2 rotate2D(float r) {
          return mat2(cos(r), sin(r), -sin(r), cos(r));
        }

        float surface_noise(vec2 uv, float t, float scale) {
          vec2 n = vec2(.1);
          vec2 N = vec2(.1);
          mat2 m = rotate2D(.5);
          for (int j = 0; j < 10; j++) {
            uv *= m;
            n *= m;
            vec2 q = uv * scale + float(j) + n + (.5 + .5 * float(j)) * (mod(float(j), 2.) - 1.) * t;
            n += sin(q);
            N += cos(q) / scale;
            scale *= 1.2;
          }
          return (N.x + N.y + .1);
        }

        void main() {
          vec2 uv = vUv;
          uv.y = 1. - uv.y;
          uv.x *= u_ratio;

          float t = .002 * u_time;
          vec3 color = vec3(0.);
          float opacity = 0.;

          float outer_noise = snoise((.3 + .1 * sin(t)) * uv + vec2(0., .2 * t));
          vec2 surface_noise_uv = 2. * uv + (outer_noise * .2);

          float surf = surface_noise(surface_noise_uv, t, u_scale);
          surf *= pow(uv.y, .3);
          surf = pow(surf, 2.);

          vec2 img_uv = vUv;
          img_uv -= .5;
          if (u_ratio > u_img_ratio) {
            img_uv.y = img_uv.y * u_img_ratio / u_ratio;
          } else {
            img_uv.x = img_uv.x * u_ratio / u_img_ratio;
          }
          float scale_factor = u_scale_factor;
          img_uv *= scale_factor;
          img_uv += .5;
          img_uv.y = 1. - img_uv.y;

          img_uv += (u_water_distortion * outer_noise);
          img_uv += (u_surface_distortion * surf);

          vec4 img = texture2D(u_image_texture, img_uv);
          img *= (1. + u_illumination * surf);

          color += img.rgb;
          color += u_illumination * vec3(1. - u_blueish, 1., 1.) * surf;
          opacity += img.a;

          // Apply organic water ripple distortion to the canvas UV coordinates for wavy card borders
          vec2 distorted_vUv = vUv;
          distorted_vUv += (u_water_distortion * outer_noise);
          distorted_vUv += (u_surface_distortion * surf);

          // Original React component vignette math on distorted_vUv for floating wavy card look
          float edge_width = .02;
          float edge_alpha = smoothstep(0., edge_width, distorted_vUv.x) * smoothstep(1., 1. - edge_width, distorted_vUv.x);
          edge_alpha *= smoothstep(0., edge_width, distorted_vUv.y) * smoothstep(1., 1. - edge_width, distorted_vUv.y);
          color *= edge_alpha;
          opacity *= edge_alpha;

          gl_FragColor = vec4(color, opacity);
        }
      `;

      const compile = (src, type) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.error('Ripple shader compile failed:', gl.getShaderInfoLog(shader));
          return null;
        }
        return shader;
      };

      const vs = compile(VERT, gl.VERTEX_SHADER);
      const fs = compile(FRAG, gl.FRAGMENT_SHADER);
      if (!vs || !fs) return;

      this.program = gl.createProgram();
      gl.attachShader(this.program, vs);
      gl.attachShader(this.program, fs);
      gl.linkProgram(this.program);

      if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
        console.error('Ripple program linking failed:', gl.getProgramInfoLog(this.program));
        return;
      }

      gl.useProgram(this.program);

      // Map uniform locations
      this.uniforms = {};
      const uniforms = [
        'u_image_texture', 'u_time', 'u_ratio', 'u_img_ratio',
        'u_blueish', 'u_scale', 'u_illumination',
        'u_surface_distortion', 'u_water_distortion', 'u_scale_factor'
      ];
      uniforms.forEach(name => {
        this.uniforms[name] = gl.getUniformLocation(this.program, name);
      });

      // Vertices buffer
      const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
      this.vbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

      const posLoc = gl.getAttribLocation(this.program, 'a_position');
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      // Observe size changes automatically for perfect fluid ratios
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.canvas);

      this.loadImage();
    } catch (e) {
      console.error('WebGL init error:', e);
    }
  }

  loadImage() {
    const gl = this.gl;
    this.image = new Image();
    this.image.crossOrigin = 'anonymous';
    this.image.onload = () => {
      if (!this.isActive) return;
      try {
        this.texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);

        gl.useProgram(this.program);
        gl.uniform1i(this.uniforms['u_image_texture'], 0);

        this.isLoaded = true;
        this.resize();
        this.render();
      } catch (err) {
        console.error('Error binding texture:', err);
        const wrapper = this.canvas.closest('.gallery-img-wrapper');
        if (wrapper) {
          wrapper.style.display = 'none';
        }
      }
    };
    this.image.onerror = () => {
      console.warn('Image failed to load:', this.src);
      const wrapper = this.canvas.closest('.gallery-img-wrapper');
      if (wrapper) {
        wrapper.style.display = 'none';
      }
    };
    this.image.src = this.src;
  }

  resize() {
    if (!this.isLoaded || !this.isActive) return;
    const gl = this.gl;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.floor((rect.width || 300) * dpr);
    const h = Math.floor((rect.height || 300) * dpr);

    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }

    gl.viewport(0, 0, w, h);
    gl.useProgram(this.program);
    gl.uniform1f(this.uniforms['u_ratio'], w / h);
    
    const imgRatio = this.image.naturalWidth / this.image.naturalHeight;
    gl.uniform1f(this.uniforms['u_img_ratio'], imgRatio);

    gl.uniform1f(this.uniforms['u_blueish'], this.options.blueish);
    gl.uniform1f(this.uniforms['u_scale'], this.options.scale);
    gl.uniform1f(this.uniforms['u_illumination'], this.options.illumination);
    gl.uniform1f(this.uniforms['u_surface_distortion'], this.options.surfaceDistortion);
    gl.uniform1f(this.uniforms['u_water_distortion'], this.options.waterDistortion);
    gl.uniform1f(this.uniforms['u_scale_factor'], this.options.scaleFactor);
  }

  render() {
    if (!this.isLoaded || !this.isActive) return;
    const gl = this.gl;

    gl.useProgram(this.program);
    gl.uniform1f(this.uniforms['u_time'], performance.now() - this.startTime);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    
    const posLoc = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    this.animationFrameId = requestAnimationFrame(() => this.render());
  }

  destroy() {
    this.isActive = false;
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.resizeObserver) this.resizeObserver.disconnect();
    
    const gl = this.gl;
    if (gl) {
      if (this.texture) gl.deleteTexture(this.texture);
      if (this.vbo) gl.deleteBuffer(this.vbo);
      if (this.program) gl.deleteProgram(this.program);
    }
  }
}

/* ============================================================
   DETAIL VIEW
   ============================================================ */
function initDetailView(bg, onClose) {
  const detailEl   = document.getElementById('projectDetail');
  const backBtn    = document.getElementById('backBtn');
  const titleEl    = document.getElementById('detailTitle');
  const artistEl   = document.getElementById('detailArtist');
  const descEl     = document.getElementById('detailDesc');
  const categoryEl = document.getElementById('detailCategory');
  const yearEl     = document.getElementById('detailYear');
  const labelEl    = document.getElementById('detailLabel');

  // Navigation buttons
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  if (!detailEl) return;

  let isOpen = false;
  let currentProjectIndex = -1;
  let activeGalleryEffects = [];

  function updateGallery(project) {
    // Clear previous canvases
    activeGalleryEffects.forEach(effect => effect.destroy());
    activeGalleryEffects = [];

    const canvasIds = ['galleryCanvas1', 'galleryCanvas2', 'galleryCanvas3', 'galleryCanvas4'];
    canvasIds.forEach((id, index) => {
      const canvas = document.getElementById(id);
      if (!canvas) return;

      const wrapper = canvas.closest('.gallery-img-wrapper');

      if (project.gallery && project.gallery[index]) {
        // Show wrapper by default, let loading status manage it
        if (wrapper) wrapper.style.display = '';
        const effect = new WaterRippleImageEffect(canvas, project.gallery[index]);
        activeGalleryEffects.push(effect);
      } else {
        // Hide wrapper if no image defined for this index
        if (wrapper) wrapper.style.display = 'none';
      }
    });

    // Handle visibility of .detail-gallery-top if all its children are hidden
    const topGallery = document.querySelector('.detail-gallery-top');
    const detailGrid = document.querySelector('.detail-grid');
    if (topGallery) {
      setTimeout(() => {
        const visibleChildren = [...topGallery.children].filter(child => child.style.display !== 'none');
        if (visibleChildren.length === 0) {
          topGallery.style.display = 'none';
          if (detailGrid) detailGrid.classList.add('only-bottom');
        } else {
          topGallery.style.display = '';
          if (detailGrid) detailGrid.classList.remove('only-bottom');
        }

        // Handle class for when the bottom wide image is hidden
        const bottomCanvas = document.getElementById('galleryCanvas4');
        const bottomWrapper = bottomCanvas ? bottomCanvas.closest('.gallery-img-wrapper') : null;
        if (bottomWrapper && bottomWrapper.style.display === 'none') {
          if (detailGrid) detailGrid.classList.add('no-wide-image');
        } else {
          if (detailGrid) detailGrid.classList.remove('no-wide-image');
        }
      }, 0);
    }
  }

  function updateYoutubeLink(project) {
    const canvas4 = document.getElementById('galleryCanvas4');
    const canvas4Wrapper = canvas4 ? canvas4.closest('.gallery-img-wrapper') : null;
    if (canvas4Wrapper) {
      if (project.youtube) {
        canvas4Wrapper.style.cursor = 'pointer';
        canvas4Wrapper.onclick = () => {
          window.open(project.youtube, '_blank');
        };
      } else {
        canvas4Wrapper.style.cursor = '';
        canvas4Wrapper.onclick = null;
      }
    }
  }

  function openDetail(project) {
    currentProjectIndex = PROJECTS.indexOf(project);

    // Reset detail page scroll to the top immediately (supports both desktop and mobile scroll containers)
    if (detailEl) {
      detailEl.scrollTop = 0;
      const gridEl = detailEl.querySelector('.detail-grid');
      if (gridEl) gridEl.scrollTop = 0;
      const siteHeader = document.getElementById('siteHeader');
      if (siteHeader) {
        siteHeader.classList.remove('scrolled');
      }
    }

    // Populate fields
    titleEl.textContent    = project.name;
    if (artistEl) artistEl.textContent   = project.artist;
    descEl.textContent     = project.description || '';
    if (categoryEl) categoryEl.textContent = project.type;
    if (yearEl) yearEl.textContent     = project.year;
    if (labelEl) labelEl.textContent    = project.author;

    // Populate the WebGL Water Ripple canvases
    updateGallery(project);
    updateYoutubeLink(project);

    // Make sure the bg image/video is shown at full opacity
    bg.show(project.image, project.video);

    // Open transitions
    detailEl.setAttribute('aria-hidden', 'false');
    detailEl.classList.add('is-open');
    document.body.classList.add('detail-open');
    isOpen = true;

    // Force a resize re-calculation after transition finishes to guarantee perfect rendering size
    setTimeout(() => window.dispatchEvent(new Event('resize')), 150);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 600);
  }

  function navigateToProject(index) {
    if (index < 0) {
      index = PROJECTS.length - 1; // Wrap to end
    } else if (index >= PROJECTS.length) {
      index = 0; // Wrap to start
    }
    
    currentProjectIndex = index;
    const project = PROJECTS[index];

    // Scroll detail page back to the top immediately (supports both desktop and mobile scroll containers)
    if (detailEl) {
      detailEl.scrollTop = 0;
      const gridEl = detailEl.querySelector('.detail-grid');
      if (gridEl) gridEl.scrollTop = 0;
      const siteHeader = document.getElementById('siteHeader');
      if (siteHeader) {
        siteHeader.classList.remove('scrolled');
      }
    }

    // Premium scramble transition on title
    if (titleEl) {
      const scrambler = new TextScrambler(titleEl);
      scrambler.scramble(project.name);
    }

    // Update other fields
    descEl.textContent = project.description || '';
    if (artistEl) artistEl.textContent   = project.artist;
    if (categoryEl) categoryEl.textContent = project.type;
    if (yearEl) yearEl.textContent     = project.year;
    if (labelEl) labelEl.textContent    = project.author;

    // Update WebGL ripple images
    updateGallery(project);
    updateYoutubeLink(project);

    // Crossfade background image/video
    bg.show(project.image, project.video);

    // Force a resize re-calculation after transition finishes to guarantee perfect rendering size
    setTimeout(() => window.dispatchEvent(new Event('resize')), 150);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 600);
  }

  function closeDetail() {
    // Clear all rendering loops to release CPU/GPU
    activeGalleryEffects.forEach(effect => effect.destroy());
    activeGalleryEffects = [];

    detailEl.classList.remove('is-open');
    detailEl.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('detail-open');
    isOpen = false;

    // Reset navbar scrolled state
    const siteHeader = document.getElementById('siteHeader');
    if (siteHeader) {
      siteHeader.classList.remove('scrolled');
    }

    // Immediately trigger onClose to reset the list and background state
    if (onClose) {
      onClose();
    }
  }

  // Click on Nav Buttons
  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateToProject(currentProjectIndex - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateToProject(currentProjectIndex + 1);
    });
  }

  // Swipe Gestures for Mobile (with diagonal check and default prevention support)
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;
  let isSwiping = false;

  detailEl.addEventListener('touchstart', (e) => {
    if (!isOpen) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchEndX = touchStartX;
    touchEndY = touchStartY;
    isSwiping = true;
  }, { passive: true });

  detailEl.addEventListener('touchmove', (e) => {
    if (!isOpen || !isSwiping) return;
    touchEndX = e.touches[0].clientX;
    touchEndY = e.touches[0].clientY;

    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    // If gesture is clearly horizontal, prevent vertical/default scroll
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
      if (e.cancelable) {
        e.preventDefault();
      }
    }
  }, { passive: false });

  detailEl.addEventListener('touchend', (e) => {
    if (!isOpen || !isSwiping) return;
    isSwiping = false;
    handleSwipe();
  }, { passive: true });

  detailEl.addEventListener('touchcancel', () => {
    isSwiping = false;
  }, { passive: true });

  function handleSwipe() {
    const swipeThreshold = 50; // px
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    // Only trigger horizontal swipe if it is the dominant direction
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > swipeThreshold) {
      if (diffX < 0) {
        // Swiped left -> Next project
        navigateToProject(currentProjectIndex + 1);
      } else {
        // Swiped right -> Previous project
        navigateToProject(currentProjectIndex - 1);
      }
    }
  }

  // Touchpad (Trackpad) Swipe Support with Momentum Filtering
  let isWheelLocked = false;
  let wheelAccumulatorX = 0;
  let wheelAccumulatorY = 0;
  let wheelResetTimeout = null;

  detailEl.addEventListener('wheel', (e) => {
    if (!isOpen) return;

    // Prevent default browser history swipe gestures or standard page scrolling
    if (e.cancelable) {
      e.preventDefault();
    }

    if (isWheelLocked) return;

    wheelAccumulatorX += e.deltaX;
    wheelAccumulatorY += e.deltaY;

    // Custom threshold for trackpad gestures (80px is optimal for both Windows & macOS)
    const threshold = 80;

    if (Math.abs(wheelAccumulatorX) > threshold) {
      if (wheelAccumulatorX > 0) {
        // Swiped left (scrolled right) -> Next project
        navigateToProject(currentProjectIndex + 1);
      } else {
        // Swiped right (scrolled left) -> Previous project
        navigateToProject(currentProjectIndex - 1);
      }
      lockWheelGesture();
    } else if (Math.abs(wheelAccumulatorY) > threshold) {
      if (wheelAccumulatorY > 0) {
        // Scrolled down -> Next project
        navigateToProject(currentProjectIndex + 1);
      } else {
        // Scrolled up -> Previous project
        navigateToProject(currentProjectIndex - 1);
      }
      lockWheelGesture();
    }

    // Reset accumulator when user stops swiping for 150ms
    clearTimeout(wheelResetTimeout);
    wheelResetTimeout = setTimeout(() => {
      wheelAccumulatorX = 0;
      wheelAccumulatorY = 0;
    }, 150);
  }, { passive: false });

  function lockWheelGesture() {
    isWheelLocked = true;
    wheelAccumulatorX = 0;
    wheelAccumulatorY = 0;
    // Cooldown lock to let trackpad inertial/momentum scrolling finish without re-triggering
    setTimeout(() => {
      isWheelLocked = false;
    }, 600);
  }

  // Back button
  if (backBtn) backBtn.addEventListener('click', closeDetail);

  // Scroll event listener for glassmorphism navbar (handles mobile and desktop containers using capture phase)
  if (detailEl) {
    detailEl.addEventListener('scroll', (e) => {
      if (!isOpen) return;
      const siteHeader = document.getElementById('siteHeader');
      if (siteHeader) {
        const scrollTop = e.target.scrollTop || 0;
        if (scrollTop > 10) {
          siteHeader.classList.add('scrolled');
        } else {
          siteHeader.classList.remove('scrolled');
        }
      }
    }, true); // use capture to capture events from the scrollable .detail-grid on mobile
  }

  // Keyboard navigation (Escape, Left/Right Arrow Keys)
  document.addEventListener('keydown', (e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') {
      closeDetail();
    } else if (e.key === 'ArrowLeft') {
      navigateToProject(currentProjectIndex - 1);
    } else if (e.key === 'ArrowRight') {
      navigateToProject(currentProjectIndex + 1);
    }
  });

  return { openDetail, closeDetail };
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  /* Apply SITE_LABELS to static HTML elements */
  if (window.SITE_LABELS) {
    const L = window.SITE_LABELS;
    if (L.logoText)  { const el = document.querySelector('.logo');       if (el) el.textContent = L.logoText; }
    if (L.backLabel) { const el = document.querySelector('.back-label'); if (el) el.textContent = L.backLabel; }
    if (L.h1)        { const el = document.querySelector('.sr-only');    if (el) el.textContent = L.h1; }
    if (L.pageTitle) { document.title = L.pageTitle; }
    if (L.metaDesc)  {
      let meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', L.metaDesc);
    }
  }

  const bg     = initBackground();
  let projectListController = null;
  const detail = initDetailView(bg, () => {
    if (projectListController) {
      projectListController.resetListState();
    }
  });
  projectListController = initProjectList(bg, detail);

  // Logo home button behavior (acts as home link)
  const logo = document.querySelector('.logo');
  if (logo && detail && detail.closeDetail) {
    logo.addEventListener('click', detail.closeDetail);
  }
});
