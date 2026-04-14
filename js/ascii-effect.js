// Using global THREE object loaded from CDN

const vertexShader = `
varying vec2 vUv;
uniform float uTime;
uniform float mouse;
uniform float uEnableWaves;
void main() {
    vUv = uv;
    float time = uTime * 5.;
    float waveFactor = uEnableWaves;
    vec3 transformed = position;
    transformed.x += sin(time + position.y) * 0.5 * waveFactor;
    transformed.y += cos(time + position.z) * 0.15 * waveFactor;
    transformed.z += sin(time + position.x) * waveFactor;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;
uniform float mouse;
uniform float uTime;
uniform sampler2D uTexture;
void main() {
    float time = uTime;
    vec2 pos = vUv;
    
    float move = sin(time + mouse) * 0.01;
    float r = texture2D(uTexture, pos + cos(time * 2. - time + pos.x) * .01).r;
    float g = texture2D(uTexture, pos + tan(time * .5 + pos.x - time) * .01).g;
    float b = texture2D(uTexture, pos - cos(time * 2. + time + pos.y) * .01).b;
    float a = texture2D(uTexture, pos).a;
    gl_FragColor = vec4(r, g, b, a);
}
`;

function map(n, start, stop, start2, stop2) {
  return ((n - start) / (stop - start)) * (stop2 - start2) + start2;
}

const PX_RATIO = typeof window !== 'undefined' ? window.devicePixelRatio : 1;

class AsciiFilter {
  constructor(renderer, { fontSize = 12, fontFamily = "'Courier New', monospace", charset, invert = true } = {}) {
    this.renderer = renderer;
    this.domElement = document.createElement('div');
    this.domElement.style.position = 'absolute';
    this.domElement.style.top = '0';
    this.domElement.style.left = '0';
    this.domElement.style.width = '100%';
    this.domElement.style.height = '100%';

    this.pre = document.createElement('pre');
    this.domElement.appendChild(this.pre);

    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
    this.domElement.appendChild(this.canvas);

    this.deg = 0;
    this.invert = invert;
    this.fontSize = fontSize;
    this.fontFamily = fontFamily;
    this.charset = charset ?? ` .'` + "^" + `",:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$`;

    if (this.context) {
      this.context.imageSmoothingEnabled = false;
    }

    this.onMouseMove = this.onMouseMove.bind(this);
    document.addEventListener('mousemove', this.onMouseMove);
  }

  setSize(width, height) {
    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height);
    this.reset();
    this.center = { x: width / 2, y: height / 2 };
    this.mouse = { x: this.center.x, y: this.center.y };
  }

  reset() {
    if (this.context) {
      this.context.font = `${this.fontSize}px ${this.fontFamily}`;
      const charWidth = this.context.measureText('A').width;
      this.cols = Math.floor(this.width / (this.fontSize * (charWidth / this.fontSize)));
      this.rows = Math.floor(this.height / this.fontSize);
      
      this.canvas.width = this.cols;
      this.canvas.height = this.rows;

      this.pre.style.fontFamily = this.fontFamily;
      this.pre.style.fontSize = `${this.fontSize}px`;
      this.pre.style.margin = '0';
      this.pre.style.padding = '0';
      this.pre.style.lineHeight = '1em';
      this.pre.style.position = 'absolute';
      this.pre.style.left = '50%';
      this.pre.style.top = '50%';
      this.pre.style.transform = 'translate(-50%, -50%)';
      this.pre.style.zIndex = '9';
      this.pre.style.backgroundAttachment = 'fixed';
      this.pre.style.mixBlendMode = 'difference';
    }
  }

  render(scene, camera) {
    this.renderer.render(scene, camera);
    const w = this.canvas.width;
    const h = this.canvas.height;
    
    if (this.context) {
      this.context.clearRect(0, 0, w, h);
      if (w && h) {
        this.context.drawImage(this.renderer.domElement, 0, 0, w, h);
      }
      this.asciify(this.context, w, h);
      this.hue();
    }
  }

  onMouseMove(e) {
    this.mouse = { x: e.clientX * PX_RATIO, y: e.clientY * PX_RATIO };
  }

  get dx() {
    return this.mouse.x - this.center.x;
  }

  get dy() {
    return this.mouse.y - this.center.y;
  }

  hue() {
    const deg = (Math.atan2(this.dy, this.dx) * 180) / Math.PI;
    this.deg += (deg - this.deg) * 0.075;
    this.domElement.style.filter = `hue-rotate(${this.deg.toFixed(1)}deg)`;
  }

  asciify(ctx, w, h) {
    if (w && h) {
      const imgData = ctx.getImageData(0, 0, w, h).data;
      let str = '';
      
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = x * 4 + y * 4 * w;
          const [r, g, b, a] = [imgData[i], imgData[i + 1], imgData[i + 2], imgData[i + 3]];
          
          if (a === 0) {
            str += ' ';
            continue;
          }

          let gray = (0.3 * r + 0.6 * g + 0.1 * b) / 255;
          let idx = Math.floor((1 - gray) * (this.charset.length - 1));
          
          if (this.invert) idx = this.charset.length - idx - 1;
          
          str += this.charset[idx];
        }
        str += '\n';
      }
      this.pre.innerHTML = str;
    }
  }

  dispose() {
    document.removeEventListener('mousemove', this.onMouseMove);
  }
}

class CanvasTxt {
  constructor(txt, { fontSize = 200, fontFamily = 'Arial', color = '#fdf9f3' } = {}) {
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
    this.txt = txt;
    this.fontSize = fontSize;
    this.fontFamily = fontFamily;
    this.color = color;
    this.lineHeight = 1.0; 
    this.font = `bold ${this.fontSize}px "${this.fontFamily}", Montserrat, sans-serif`;
    this.fontLogo = `${this.fontSize}px "KCY2KBanger-Bold", Montserrat, sans-serif`;
  }

  getLineChunks(line) {
    const chunks = [];
    let currentChunk = "";
    let currentIsLogo = null;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const isLogo = (i === 0 && (char === 'R' || char === 'W'));
        if (currentIsLogo === null) {
            currentIsLogo = isLogo;
            currentChunk = char;
        } else if (currentIsLogo === isLogo) {
            currentChunk += char;
        } else {
            chunks.push({ text: currentChunk, isLogo: currentIsLogo });
            currentIsLogo = isLogo;
            currentChunk = char;
        }
    }
    if (currentChunk) chunks.push({ text: currentChunk, isLogo: currentIsLogo });
    return chunks;
  }

  resize() {
    if (this.context) {
      const lines = this.txt.split('\n');
      let maxWidth = 0;
      
      lines.forEach(line => {
        const chunks = this.getLineChunks(line);
        let lineWidth = 0;
        chunks.forEach(chunk => {
            this.context.font = chunk.isLogo ? this.fontLogo : this.font;
            lineWidth += this.context.measureText(chunk.text).width;
        });
        maxWidth = Math.max(maxWidth, Math.ceil(lineWidth));
      });

      const textWidth = maxWidth + 40;
      const textHeight = (lines.length * this.fontSize) + 40;
      
      this.canvas.width = textWidth;
      this.canvas.height = textHeight;
    }
  }

  render() {
    if (this.context) {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.context.fillStyle = this.color;
      this.context.textAlign = 'left'; // Left aligned to draw chunk by chunk
      this.context.textBaseline = 'middle';
      
      const lines = this.txt.split('\n');
      const lineHeight = this.fontSize * this.lineHeight;
      const totalHeight = lines.length * lineHeight;
      
      lines.forEach((line, index) => {
        const yPos = (this.canvas.height / 2) - (totalHeight / 2) + (index * lineHeight) + (lineHeight / 2);
        
        // Measure line width
        const chunks = this.getLineChunks(line);
        let lineWidth = 0;
        chunks.forEach(chunk => {
            this.context.font = chunk.isLogo || this.fontFamily === 'KCY2KBanger-Bold' ? this.fontLogo : this.font;
            lineWidth += this.context.measureText(chunk.text).width;
        });

        // Calculate starting X to keep it centered globally
        let currentX = (this.canvas.width / 2) - (lineWidth / 2);

        chunks.forEach(chunk => {
            this.context.font = chunk.isLogo || this.fontFamily === 'KCY2KBanger-Bold' ? this.fontLogo : this.font;
            this.context.fillText(chunk.text, currentX, yPos);
            currentX += this.context.measureText(chunk.text).width;
        });
      });
    }
  }

  get width() {
    return this.canvas.width;
  }

  get height() {
    return this.canvas.height;
  }

  get texture() {
    return this.canvas;
  }
}

class CanvAscii {
  constructor(
    { text, asciiFontSize, textFontSize, textColor, fontFamily, planeBaseHeight, enableWaves, lineHeight = 1.0 },
    containerElem,
    width,
    height
  ) {
    this.textString = text;
    this.asciiFontSize = asciiFontSize;
    this.textFontSize = textFontSize;
    this.lineHeight = lineHeight;
    this.textColor = textColor;
    this.fontFamily = fontFamily || 'Arial, sans-serif';
    this.planeBaseHeight = planeBaseHeight;
    this.container = containerElem;
    this.width = width;
    this.height = height;
    this.enableWaves = enableWaves;

    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 1000);
    this.camera.position.z = 30;

    this.scene = new THREE.Scene();

    this.mouse = { x: 0, y: 0 };
    this.animationFrameId = 0;

    this.onMouseMove = this.onMouseMove.bind(this);
    this.setMesh();
    this.setRenderer();
  }

  setMesh() {
    this.textCanvas = new CanvasTxt(this.textString, {
      fontSize: this.textFontSize,
      fontFamily: this.fontFamily,
      color: this.textColor
    });
    this.textCanvas.lineHeight = this.lineHeight;
    this.textCanvas.resize();
    this.textCanvas.render();

    this.texture = new THREE.CanvasTexture(this.textCanvas.texture);
    this.texture.minFilter = THREE.NearestFilter;

    const textAspect = this.textCanvas.width / this.textCanvas.height;
    const baseH = this.planeBaseHeight;
    const planeW = baseH * textAspect;
    const planeH = baseH;

    this.geometry = new THREE.PlaneGeometry(planeW, planeH, 36, 36);
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        mouse: { value: 1.0 },
        uTexture: { value: this.texture },
        uEnableWaves: { value: this.enableWaves ? 1.0 : 0.0 }
      }
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  setRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    this.renderer.setPixelRatio(1);
    this.renderer.setClearColor(0x000000, 0);

    this.filter = new AsciiFilter(this.renderer, {
      fontFamily: 'monospace',
      fontSize: this.asciiFontSize,
      invert: true
    });

    this.container.appendChild(this.filter.domElement);
    this.setSize(this.width, this.height);

    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('touchmove', this.onMouseMove);
  }

  setSize(w, h) {
    this.width = w;
    this.height = h;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.filter.setSize(w, h);
    this.center = { x: w / 2, y: h / 2 };
  }

  load() {
    this.animate();
  }

  onMouseMove(evt) {
    const e = evt.touches ? evt.touches[0] : evt;
    this.mouse = { x: e.clientX, y: e.clientY };
  }

  animate() {
    const animateFrame = () => {
      this.animationFrameId = requestAnimationFrame(animateFrame);
      this.render();
    };
    animateFrame();
  }

  render() {
    const time = new Date().getTime() * 0.001;
    this.textCanvas.render();
    this.texture.needsUpdate = true;
    this.mesh.material.uniforms.uTime.value = Math.sin(time); // Restore bouncy wave deformation
    
    this.updateRotation();
    this.filter.render(this.scene, this.camera);
  }

  updateRotation() {
    const w = typeof window !== 'undefined' ? window.innerWidth : this.width;
    const h = typeof window !== 'undefined' ? window.innerHeight : this.height;
    
    const x = map(this.mouse.y, 0, h, 0.5, -0.5);
    const y = map(this.mouse.x, 0, w, -0.5, 0.5);
    
    this.mesh.rotation.x += (x - this.mesh.rotation.x) * 0.05;
    this.mesh.rotation.y += (y - this.mesh.rotation.y) * 0.05;
  }

  clear() {
    this.scene.traverse(object => {
      if (!object.isMesh) return;
      
      [object.material].flat().forEach(material => {
        material.dispose();
      });
      
      object.geometry.dispose();
    });
    this.scene.clear();
  }

  dispose() {
    cancelAnimationFrame(this.animationFrameId);
    this.filter.dispose();
    if (this.container.contains(this.filter.domElement)) {
      this.container.removeChild(this.filter.domElement);
    }
    this.container.removeEventListener('mousemove', this.onMouseMove);
    this.container.removeEventListener('touchmove', this.onMouseMove);
    this.clear();
    this.renderer.dispose();
  }
}

window.initAsciiEffect = function(container, options = {}) {
  const {
    text = 'HELLO',
    asciiFontSize = 8,
    textFontSize = 200,
    textColor = '#fdf9f3',
    planeBaseHeight = 8,
    enableWaves = true
  } = options;

  let asciiEffect = null;

  const init = (w, h) => {
    asciiEffect = new CanvAscii(
      { text, asciiFontSize, textFontSize, textColor, planeBaseHeight, enableWaves },
      container,
      w,
      h
    );
    asciiEffect.load();
  };

  const ro = new ResizeObserver(entries => {
    if (!entries[0]) return;
    const { width: w, height: h } = entries[0].contentRect;
    if (w > 0 && h > 0) {
      if (!asciiEffect) {
        init(w, h);
      } else {
        asciiEffect.setSize(w, h);
      }
    }
  });

  ro.observe(container);

  return () => {
    ro.disconnect();
    if (asciiEffect) {
      asciiEffect.dispose();
    }
  };
}
