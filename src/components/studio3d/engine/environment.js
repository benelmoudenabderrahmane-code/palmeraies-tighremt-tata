import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { textures, normalsFor } from './textures';
import { planarUV } from './geo';
import { vegetationParts } from './vegetation';
import { addTerrainDetail } from './atmosphere';

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

const sstep = THREE.MathUtils.smoothstep;

/** Emprise de la palmeraie de Tighremt (0..1), à l'ouest du site */
export function palmeraieWeight(x, z, center) {
  const edge = center.x - 125 + Math.sin(z * 0.006) * 25;
  const inX = sstep(x, edge - 600, edge - 540) * (1 - sstep(x, edge - 10, edge + 4));
  const inZ = 1 - sstep(Math.abs(z - center.z), 590, 660);
  return inX * inZ * sstep(fbm(x * 0.015, z * 0.015), 0.3, 0.42);
}

/**
 * Sol désertique + reliefs (Anti-Atlas) autour du site.
 * center : centre du site, flat : rayon de la zone plane.
 */
export function buildLandscape(center, flat = 240, low = false) {
  const group = new THREE.Group();
  group.name = 'paysage';

  // sol proche (plat, texturé) : variations à grande échelle en couleurs
  // de sommets pour éviter l'effet de répétition de la texture
  const groundGeo = new THREE.PlaneGeometry(3600, 3600, low ? 140 : 320, low ? 140 : 320);
  groundGeo.rotateX(-Math.PI / 2);
  groundGeo.translate(center.x, 0, center.z);
  planarUV(groundGeo, 9);
  {
    const p = groundGeo.attributes.position;
    const col = new Float32Array(p.count * 3);
    const base = new THREE.Color('#e0cbb0'), dark = new THREE.Color('#b08f72'), grey = new THREE.Color('#cbc2b6'), red = new THREE.Color('#d6a682');
    const soil = new THREE.Color('#8c7457'), field = new THREE.Color('#6f7c43'), fieldDry = new THREE.Color('#a39a5c');
    const c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      const n1 = fbm(x * 0.006, z * 0.006, 4), n2 = fbm(x * 0.025 + 40, z * 0.025, 3);
      c.copy(base).lerp(dark, sstep(n1, 0.45, 0.75) * 0.7).lerp(n2 > 0.5 ? grey : red, Math.abs(n2 - 0.5) * 0.9);
      // palmeraie : terre irriguée plus sombre et petites parcelles cultivées
      const w = palmeraieWeight(x, z, center);
      if (w > 0) {
        c.lerp(soil, w * 0.85);
        const plot = Math.floor(x / 22) * 7.31 + Math.floor(z / 16) * 3.17;
        const cult = (Math.sin(plot) * 43758.5453) % 1;
        if (Math.abs(cult) > 0.45) c.lerp(Math.abs(cult) > 0.8 ? fieldDry : field, w * 0.75);
      }
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    groundGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  const ground = new THREE.Mesh(groundGeo, addTerrainDetail(new THREE.MeshStandardMaterial({ map: textures.desert(), normalMap: normalsFor('desert', 4), normalScale: new THREE.Vector2(0.9, 0.9), vertexColors: true, roughness: 1 }), 'ground'));
  ground.receiveShadow = true;
  ground.name = 'sol';
  group.add(ground);

  // reliefs rocheux de l'Anti-Atlas : crêtes ridées, gauchissement du
  // domaine (plis), bancs en gradins, puis détail fin
  const size = 3600, seg = low ? 180 : 440;
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const rockDark = new THREE.Color('#3f3029'), rock = new THREE.Color('#6b4f3f'), rockLight = new THREE.Color('#8f6c55'), rust = new THREE.Color('#8b5636'), scree = new THREE.Color('#a08268'), foot = new THREE.Color('#ad9378');
  const tmp = new THREE.Color();
  const heights = new Float32Array(pos.count);
  const STEP = 13;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + center.x, z = pos.getZ(i) + center.z;
    const dx = x - center.x, dz = z - center.z;
    const d = Math.hypot(dx, dz);
    const ang = Math.atan2(dz, dx); // 0 = est
    // la palmeraie occupe l'ouest : reliefs plus bas et plus lointains de ce côté
    const westFactor = 0.18 + 0.82 * (0.5 + 0.5 * Math.cos(ang));
    const rise = sstep(d, flat + 40 + (1 - westFactor) * 500, flat + 420 + (1 - westFactor) * 600);
    const wx = x + (fbm(x * 0.003, z * 0.003) - 0.5) * 260, wz = z + (fbm(x * 0.003 + 17, z * 0.003 + 5) - 0.5) * 260;
    let h = ridged(wx * 0.0024, wz * 0.0024, 6) * 430 + fbm(x * 0.012, z * 0.012) * 50;
    h *= rise;
    // la montagne au pied du site, à l'est (cf. photos du dossier)
    const eastHill = Math.exp(-(((dx - 300) / 150) ** 2) - ((dz + 20) / 300) ** 2) * 150 * (0.55 + ridged(wx * 0.01, wz * 0.01));
    h += eastHill * sstep(d, flat - 30, flat + 120);
    // bancs rocheux en gradins (couches sédimentaires)
    if (h > 4) {
      const t = h / STEP, f = t - Math.floor(t);
      const terr = (Math.floor(t) + sstep(f, 0.35, 0.95)) * STEP;
      h = THREE.MathUtils.lerp(h, terr, 0.5 * sstep(h, 4, 30));
      h += ridged(x * 0.035, z * 0.035, 3) * 9 * sstep(h, 6, 40);
    }
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
    const x = pos.getX(i), z = pos.getZ(i);
    const slope = 1 - nor.getY(i); // 0 = plat
    const n = fbm(x * 0.02, z * 0.02, 3), m = fbm(x * 0.004 + 9, z * 0.004, 3);
    tmp.copy(foot).lerp(scree, sstep(h, 1, 14)).lerp(rock, sstep(h, 10, 70));
    tmp.lerp(rust, sstep(m, 0.5, 0.7) * 0.5 * sstep(h, 8, 40));
    tmp.lerp(rockDark, sstep(slope, 0.18, 0.6) * 0.75);
    tmp.lerp(rockLight, Math.max(0, n - 0.52) * 1.3);
    colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mountains = new THREE.Mesh(geo, addTerrainDetail(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.93 }), 'rock'));
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
  const pts = [], shoots = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  // bande de palmeraie nord-sud, à l'ouest du site (cf. vue satellite) :
  // palmiers serrés, de tailles variées, et rejets au pied
  const tries = Math.round(16000 * density);
  for (let i = 0; i < tries; i++) {
    const z = center.z - 660 + rnd() * 1320;
    const x = center.x - 130 - rnd() * 620;
    const w = palmeraieWeight(x, z, center);
    if (rnd() > w) continue;
    const age = rnd();
    pts.push([x, z, 0.55 + age * 0.95, rnd() * Math.PI * 2]);
    if (rnd() < 0.35) shoots.push([x + (rnd() - 0.5) * 3, z + (rnd() - 0.5) * 3, 0.35 + rnd() * 0.3, rnd() * Math.PI * 2]);
  }
  const group = new THREE.Group();
  group.name = 'palmeraie';
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  const e = new THREE.Euler();
  // deux lots : les palmiers proches du site portent des ombres, les
  // lointains non (hors du champ des ombres : rendu deux fois plus léger)
  const near = pts.filter(([x, z]) => Math.hypot(x - center.x, z - center.z) < 260);
  const far = pts.filter(([x, z]) => Math.hypot(x - center.x, z - center.z) >= 260);
  for (const [set, cast] of [[near, true], [far, false]]) {
    if (!set.length) continue;
    for (const part of parts) {
      const im = new THREE.InstancedMesh(part.geo, part.mat, set.length);
      set.forEach(([x, z, sc, r], i) => {
        e.set(Math.sin(r * 7) * 0.05, r, Math.cos(r * 5) * 0.05, 'YXZ');
        q.setFromEuler(e);
        s.set(sc * (0.9 + 0.1 * Math.sin(r * 3)), sc, sc * (0.9 + 0.1 * Math.sin(r * 3)));
        p.set(x, 0, z);
        im.setMatrixAt(i, m4.compose(p, q, s));
      });
      im.castShadow = cast;
      im.receiveShadow = true;
      group.add(im);
    }
  }
  // rejets (jeunes palmiers en touffe au pied des dattiers)
  const crown = parts[1];
  const sh = new THREE.InstancedMesh(crown.geo, crown.mat, shoots.length);
  shoots.forEach(([x, z, sc, r], i) => {
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r);
    s.setScalar(sc);
    p.set(x, -8.4 * sc + 0.3, z);
    sh.setMatrixAt(i, m4.compose(p, q, s));
  });
  sh.castShadow = false;
  sh.receiveShadow = true;
  group.add(sh);
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
