import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { textures } from './textures';
import { planarUV } from './geo';
import { vegetationParts } from './vegetation';

/* ----------------------------- soleil ------------------------------ */

/**
 * Position du soleil (algorithme NOAA simplifié).
 * hour : heure locale du Maroc (UTC+1), dayOfYear : 1..365.
 * Renvoie élévation et azimut (radians, azimut depuis le nord, sens horaire).
 */
export function sunPosition(lat, lon, dayOfYear, hour, utcOffset = 1) {
  const g = ((2 * Math.PI) / 365) * (dayOfYear - 1 + (hour - 12) / 24);
  const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const timeOffset = eqTime + 4 * lon - 60 * utcOffset;
  const tst = hour * 60 + timeOffset;
  const ha = ((tst / 4 - 180) * Math.PI) / 180;
  const latR = (lat * Math.PI) / 180;
  const cosZen = Math.sin(latR) * Math.sin(decl) + Math.cos(latR) * Math.cos(decl) * Math.cos(ha);
  const zen = Math.acos(Math.max(-1, Math.min(1, cosZen)));
  const elevation = Math.PI / 2 - zen;
  let az = Math.acos(Math.max(-1, Math.min(1, (Math.sin(latR) * Math.cos(zen) - Math.sin(decl)) / (Math.cos(latR) * Math.sin(zen)))));
  az = ha > 0 ? (az + Math.PI) % (2 * Math.PI) : (3 * Math.PI - az) % (2 * Math.PI);
  return { elevation, azimuth: az };
}

/** Vecteur direction du soleil dans le repère monde (X est, Z sud, Y haut) */
export function sunVector({ elevation, azimuth }) {
  const ce = Math.cos(elevation);
  return new THREE.Vector3(Math.sin(azimuth) * ce, Math.sin(elevation), -Math.cos(azimuth) * ce);
}

/* ----------------------------- bruit ------------------------------- */

function hash(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function noise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, oct = 5) {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) {
    s += a * noise(x * f, y * f);
    f *= 2.03;
    a *= 0.5;
  }
  return s;
}
function ridged(x, y, oct = 5) {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) {
    s += a * (1 - Math.abs(noise(x * f, y * f) * 2 - 1)) ** 2;
    f *= 2.1;
    a *= 0.5;
  }
  return s;
}

/* ---------------------------- paysage ------------------------------ */

/**
 * Sol désertique + reliefs (Anti-Atlas) autour du site.
 * center : centre du site, flat : rayon de la zone plane.
 */
export function buildLandscape(center, flat = 240, low = false) {
  const group = new THREE.Group();
  group.name = 'paysage';

  // sol proche (plat, texturé) : variations à grande échelle en couleurs
  // de sommets pour éviter l'effet de répétition de la texture
  const groundGeo = new THREE.PlaneGeometry(1400, 1400, low ? 70 : 140, low ? 70 : 140);
  groundGeo.rotateX(-Math.PI / 2);
  groundGeo.translate(center.x, 0, center.z);
  planarUV(groundGeo, 9);
  {
    const p = groundGeo.attributes.position;
    const col = new Float32Array(p.count * 3);
    const base = new THREE.Color('#e2cfb6'), dark = new THREE.Color('#b6977a'), grey = new THREE.Color('#cfc6ba'), red = new THREE.Color('#d9ab88');
    const c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      const n1 = fbm(x * 0.006, z * 0.006, 4), n2 = fbm(x * 0.025 + 40, z * 0.025, 3);
      c.copy(base).lerp(dark, THREE.MathUtils.smoothstep(n1, 0.45, 0.75) * 0.7).lerp(n2 > 0.5 ? grey : red, Math.abs(n2 - 0.5) * 0.9);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    groundGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ map: textures.desert(), vertexColors: true, roughness: 1 }));
  ground.receiveShadow = true;
  ground.name = 'sol';
  group.add(ground);

  // reliefs rocheux de l'Anti-Atlas
  const size = 3600, seg = low ? 160 : 300;
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const rockDark = new THREE.Color('#5e3a28'), rock = new THREE.Color('#8c5638'), rockLight = new THREE.Color('#b47a52'), scree = new THREE.Color('#c39a74');
  const tmp = new THREE.Color();
  const heights = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + center.x, z = pos.getZ(i) + center.z;
    const dx = x - center.x, dz = z - center.z;
    const d = Math.hypot(dx, dz);
    const ang = Math.atan2(dz, dx); // 0 = est
    // la palmeraie occupe l'ouest : reliefs plus bas et plus lointains de ce côté
    const westFactor = 0.18 + 0.82 * (0.5 + 0.5 * Math.cos(ang));
    const rise = THREE.MathUtils.smoothstep(d, flat + 40 + (1 - westFactor) * 500, flat + 420 + (1 - westFactor) * 600);
    let h = ridged(x * 0.0024, z * 0.0024, 6) * 420 + fbm(x * 0.012, z * 0.012) * 50;
    h *= rise;
    // la montagne au pied du site, à l'est (cf. photos du dossier)
    const eastHill = Math.exp(-(((dx - 300) / 150) ** 2) - ((dz + 20) / 300) ** 2) * 150 * (0.55 + ridged(x * 0.01, z * 0.01));
    h += eastHill * THREE.MathUtils.smoothstep(d, flat - 30, flat + 120);
    h = Math.max(0, h - 1);
    heights[i] = h;
    pos.setX(i, x);
    pos.setZ(i, z);
    pos.setY(i, h - 0.6 * (1 - Math.min(1, h)));
  }
  geo.computeVertexNormals();
  const nor = geo.attributes.normal;
  for (let i = 0; i < pos.count; i++) {
    const h = heights[i];
    const slope = 1 - nor.getY(i); // 0 = plat
    const n = fbm(pos.getX(i) * 0.02, pos.getZ(i) * 0.02, 3);
    tmp.copy(scree).lerp(rock, THREE.MathUtils.smoothstep(h, 2, 60));
    tmp.lerp(rockDark, THREE.MathUtils.smoothstep(slope, 0.15, 0.55) * 0.8);
    tmp.lerp(rockLight, Math.max(0, n - 0.5) * 1.2);
    colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mountains = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }));
  mountains.receiveShadow = true;
  mountains.castShadow = true;
  mountains.name = 'reliefs';
  // le relief ne doit pas couvrir le sol plat du site
  mountains.position.y = -0.05;
  group.add(mountains);

  return group;
}

/** Palmeraie de Tighremt en arrière-plan, à l'ouest du site */
export function buildPalmeraie(center, density = 1) {
  const parts = vegetationParts().palmierLow;
  const pts = [];
  // bande de palmeraie nord-sud, à l'ouest du site (cf. vue satellite)
  for (let i = 0; i < 5200 * density; i++) {
    const z = center.z - 650 + Math.random() * 1300;
    const edge = center.x - 125 + Math.sin(z * 0.006) * 25;
    const x = edge - Math.pow(Math.random(), 0.8) * 560;
    if (fbm(x * 0.015, z * 0.015) < 0.36) continue;
    pts.push([x, z, 0.85 + Math.random() * 0.55, Math.random() * Math.PI * 2]);
  }
  const group = new THREE.Group();
  group.name = 'palmeraie';
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  for (const part of parts) {
    const im = new THREE.InstancedMesh(part.geo, part.mat, pts.length);
    pts.forEach(([x, z, sc, r], i) => {
      q.setFromAxisAngle(up, r);
      s.setScalar(sc);
      p.set(x, 0, z);
      im.setMatrixAt(i, m4.compose(p, q, s));
    });
    im.castShadow = true;
    im.receiveShadow = true;
    group.add(im);
  }
  // sous-bois vert de l'oasis
  const under = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1.6, 0),
    new THREE.MeshStandardMaterial({ color: '#4f6b2c', roughness: 1, flatShading: true }),
    pts.length
  );
  pts.forEach(([x, z, sc, r], i) => {
    q.setFromAxisAngle(up, r);
    s.set(sc * 2.2, sc * 0.9, sc * 2.2);
    p.set(x + 2, 0.4, z + 1);
    under.setMatrixAt(i, m4.compose(p, q, s));
  });
  group.add(under);
  return group;
}

/* ------------------------------- ciel ------------------------------ */

export function buildSky() {
  const sky = new Sky();
  sky.scale.setScalar(4000);
  const u = sky.material.uniforms;
  u.turbidity.value = 3.2;
  u.rayleigh.value = 1.1;
  u.mieCoefficient.value = 0.004;
  u.mieDirectionalG.value = 0.8;
  return sky;
}
