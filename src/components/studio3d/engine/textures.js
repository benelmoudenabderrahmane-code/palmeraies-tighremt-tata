import * as THREE from 'three';

/*
 * Textures procédurales générées sur <canvas> : aucun fichier externe,
 * compatible avec la CSP du site et léger à charger.
 */

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return [c, c.getContext('2d')];
}

function finish(c, repeat = 1, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Bruit granuleux : sol, gravier, sable, terre */
function speckle(base, palette, count, size, seed, minR = 0.4, maxR = 1.6) {
  const [c, g] = canvas(size);
  g.fillStyle = base;
  g.fillRect(0, 0, size, size);
  const r = rng(seed);
  for (let i = 0; i < count; i++) {
    g.fillStyle = palette[(r() * palette.length) | 0];
    g.globalAlpha = 0.25 + r() * 0.6;
    const x = r() * size, y = r() * size, rad = minR + r() * (maxR - minR);
    g.beginPath();
    g.arc(x, y, rad, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
  return c;
}

const cache = new Map();
function cached(key, make) {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key);
}

export const textures = {
  desert: () =>
    cached('desert', () => {
      // reg (désert de cailloux) : grain fin, la variation globale vient du sol
      const c = speckle('#c8b39c', ['#a8957f', '#ddcdb9', '#968470', '#e9ddcd', '#7d6c5c', '#b7b0a8'], 30000, 1024, 1, 0.5, 2.2);
      const g = c.getContext('2d');
      const r = rng(7);
      // petits cailloux plus sombres
      for (let i = 0; i < 1800; i++) {
        g.fillStyle = `rgba(${70 + r() * 40},${55 + r() * 30},${45 + r() * 25},${0.35 + r() * 0.4})`;
        g.beginPath();
        g.ellipse(r() * 1024, r() * 1024, 1.5 + r() * 3.5, 1 + r() * 2.5, r() * Math.PI, 0, Math.PI * 2);
        g.fill();
      }
      return finish(c, 1);
    }),
  gravel: () => cached('gravel', () => finish(speckle('#d6c4a3', ['#bfae8d', '#e8dcc3', '#a8977a', '#f2eadb', '#9d8a6b'], 14000, 512, 2, 0.6, 2.2), 1)),
  sand: () => cached('sand', () => finish(speckle('#c9a57a', ['#b8936a', '#d8b78d', '#a98560', '#e0c39c'], 12000, 512, 3, 0.4, 1.4), 1)),
  grass: () =>
    cached('grass', () => {
      const [c, g] = canvas(512);
      g.fillStyle = '#4d7a2e';
      g.fillRect(0, 0, 512, 512);
      const r = rng(4);
      for (let i = 0; i < 26000; i++) {
        const x = r() * 512, y = r() * 512;
        const l = 25 + r() * 25;
        g.strokeStyle = `hsl(${88 + r() * 22}, ${45 + r() * 25}%, ${l}%)`;
        g.globalAlpha = 0.55;
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + (r() - 0.5) * 3, y - 2 - r() * 4);
        g.stroke();
      }
      g.globalAlpha = 1;
      return finish(c, 1);
    }),
  turf: () =>
    cached('turf', () => {
      const [c, g] = canvas(512);
      // bandes de tonte
      for (let i = 0; i < 8; i++) {
        g.fillStyle = i % 2 ? '#3f8a35' : '#4a9a3d';
        g.fillRect(0, i * 64, 512, 64);
      }
      const r = rng(5);
      for (let i = 0; i < 15000; i++) {
        g.fillStyle = r() > 0.5 ? 'rgba(30,70,25,0.25)' : 'rgba(120,180,90,0.2)';
        g.fillRect(r() * 512, r() * 512, 1, 2);
      }
      return finish(c, 1);
    }),
  earthPitch: () =>
    cached('earthPitch', () => {
      const c = speckle('#cdb08a', ['#bb9d78', '#dcc29e', '#a98c69', '#e6d2b2'], 16000, 512, 6, 0.4, 1.5);
      const g = c.getContext('2d');
      // très légères traces de nivellement
      g.globalAlpha = 0.015;
      for (let i = 0; i < 16; i++) {
        g.fillStyle = i % 2 ? '#8c7050' : '#f2e2c6';
        g.fillRect(0, i * 32, 512, 32);
      }
      g.globalAlpha = 1;
      return finish(c, 1);
    }),
  pise: () =>
    cached('pise', () => {
      // enduit ocre rouge du vestiaire
      const c = speckle('#b4573f', ['#a14c37', '#c26750', '#93432f', '#cf7a62'], 6000, 256, 8, 0.4, 1.4);
      return finish(c, 1);
    }),
  wall: () =>
    cached('wall', () => {
      const c = speckle('#b9906c', ['#a57e5b', '#c9a17c', '#8f6d4d'], 5000, 256, 9, 0.4, 1.6);
      const g = c.getContext('2d');
      g.strokeStyle = 'rgba(80,55,35,0.35)';
      for (let y = 0; y < 256; y += 32) {
        g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke();
        for (let x = (y / 32) % 2 ? 0 : 32; x < 256; x += 64) {
          g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 32); g.stroke();
        }
      }
      return finish(c, 1);
    }),
  concrete: () => cached('concrete', () => finish(speckle('#dad6cc', ['#c9c4b8', '#e6e2d8', '#bdb7aa'], 7000, 256, 10, 0.3, 1.2), 1)),
  bark: () =>
    cached('bark', () => {
      // anneaux du stipe de palmier
      const [c, g] = canvas(128);
      g.fillStyle = '#7a5f45';
      g.fillRect(0, 0, 128, 128);
      for (let y = 0; y < 128; y += 8) {
        const gr = g.createLinearGradient(0, y, 0, y + 8);
        gr.addColorStop(0, '#5a4532');
        gr.addColorStop(0.35, '#8d7154');
        gr.addColorStop(1, '#6b533d');
        g.fillStyle = gr;
        g.fillRect(0, y, 128, 8);
      }
      const r = rng(11);
      for (let i = 0; i < 600; i++) {
        g.fillStyle = `rgba(40,30,20,${r() * 0.3})`;
        g.fillRect(r() * 128, r() * 128, 2, 1);
      }
      return finish(c, 1);
    }),
  frond: () =>
    cached('frond', () => {
      // palme : rachis + folioles, avec transparence (alphaTest)
      const [c, g] = canvas(256);
      g.clearRect(0, 0, 256, 256);
      const r = rng(12);
      g.lineCap = 'round';
      for (let i = 0; i < 46; i++) {
        const t = i / 46;
        const y = 8 + t * 240;
        const len = 105 * Math.sin(Math.PI * (0.12 + t * 0.85)) + 8;
        const hue = 85 + r() * 18, light = 26 + r() * 14;
        g.strokeStyle = `hsl(${hue}, 38%, ${light}%)`;
        g.lineWidth = 3.2 - t * 1.5;
        for (const side of [-1, 1]) {
          g.beginPath();
          g.moveTo(128, y);
          g.quadraticCurveTo(128 + side * len * 0.5, y - 6, 128 + side * len, y - 18 - r() * 8);
          g.stroke();
        }
      }
      g.strokeStyle = '#6d6a3a';
      g.lineWidth = 4;
      g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 256); g.stroke();
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      return t;
    }),
  foliage: () =>
    cached('foliage', () => {
      const [c, g] = canvas(256);
      g.clearRect(0, 0, 256, 256);
      const r = rng(13);
      for (let i = 0; i < 900; i++) {
        const x = 128 + (r() - 0.5) * 220 * Math.sqrt(r()), y = 128 + (r() - 0.5) * 220 * Math.sqrt(r());
        if (Math.hypot(x - 128, y - 128) > 118) continue;
        g.fillStyle = `hsl(${80 + r() * 30}, ${25 + r() * 20}%, ${22 + r() * 22}%)`;
        g.beginPath();
        g.ellipse(x, y, 3 + r() * 4, 1.6 + r() * 2, r() * Math.PI, 0, Math.PI * 2);
        g.fill();
      }
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    }),
  water: () =>
    cached('water', () => {
      const [c, g] = canvas(256);
      g.fillStyle = '#5f9ea0';
      g.fillRect(0, 0, 256, 256);
      const r = rng(14);
      for (let i = 0; i < 260; i++) {
        g.strokeStyle = `rgba(255,255,255,${0.05 + r() * 0.12})`;
        g.lineWidth = 1 + r() * 2;
        const x = r() * 256, y = r() * 256, w = 10 + r() * 30;
        g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y - 3, x + w, y); g.stroke();
      }
      return finish(c, 1, true);
    }),
};

/** Étiquette texte en sprite (pour les noms de zones) */
export function textSprite(text, { color = '#ffffff', bg = 'rgba(19,61,32,0.88)', size = 48 } = {}) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  g.font = `600 ${size}px "Plus Jakarta Sans", system-ui, sans-serif`;
  const w = Math.ceil(g.measureText(text).width) + size;
  c.width = w;
  c.height = size * 1.7;
  g.font = `600 ${size}px "Plus Jakarta Sans", system-ui, sans-serif`;
  g.fillStyle = bg;
  const rad = c.height / 2;
  g.beginPath();
  g.roundRect(0, 0, w, c.height, rad);
  g.fill();
  g.fillStyle = color;
  g.textBaseline = 'middle';
  g.fillText(text, size / 2, c.height / 2 + 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true });
  const s = new THREE.Sprite(m);
  s.renderOrder = 10;
  s.userData.aspect = w / c.height;
  return s;
}
