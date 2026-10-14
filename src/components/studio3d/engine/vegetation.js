import * as THREE from 'three';
import { mergeGeometries } from './geo';
import { textures, normalsFor } from './textures';

/*
 * Végétation instanciée : chaque essence est décrite par plusieurs
 * « parties » (géométrie + matériau) partagées par toutes les instances.
 * Des centaines d'arbres s'affichent ainsi en quelques appels de rendu.
 */

/* ------------------------------------------------------------------ */
/*  Palmier dattier « haute définition »                               */
/* ------------------------------------------------------------------ */

// petit générateur pseudo-aléatoire déterministe
function prng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Stipe : galbe, pied évasé, bases de palmes en losanges (relief réel) */
function palmTrunk(height = 8.5, low = false) {
  const radial = low ? 7 : 36, rows = low ? 4 : 56;
  const g = new THREE.CylinderGeometry(1, 1, height, radial, rows, true);
  g.translate(0, height / 2, 0);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const t = y / height;
    const ang = Math.atan2(z, x);
    // rayon : pied évasé puis léger fuselage
    let r = 0.27 + 0.05 * Math.sin(t * Math.PI) + 0.2 * Math.exp(-t * 18);
    if (!low) {
      // bases de palmes coupées (« cornafs ») : écailles en quinconce qui
      // ressortent à leur bord supérieur, en spirale le long du stipe
      const v = y / 0.14;
      const row = Math.floor(v);
      const u = (ang / (Math.PI * 2)) * 11 + row * 0.38;
      const du = Math.abs(u - Math.floor(u) - 0.5) * 2; // 0 au centre de l'écaille
      const f = v - row; // 0 bas → 1 haut de l'écaille
      const shingle = Math.pow(f, 1.6) * (1 - Math.pow(f, 14)) * (1 - du * du * 0.85);
      const rowAmp = 0.7 + 0.6 * Math.abs(Math.sin(row * 12.9898) * 43758.5453 % 1);
      r += 0.03 * rowAmp * shingle * (0.35 + 0.65 * Math.min(1, t * 3)) * (1 - Math.pow(t, 6) * 0.5);
    }
    // courbure douce du stipe
    const bend = Math.sin(t * Math.PI * 0.5) * 0.45;
    p.setXYZ(i, Math.cos(ang) * r + bend, y, Math.sin(ang) * r);
    uv.setXY(i, (ang / (Math.PI * 2) + 0.5) * 2.75, y / 0.56);
  }
  g.computeVertexNormals();
  return g;
}

const BEND_TOP = 0.45; // décalage du sommet dû à la courbure

/**
 * Une palme pennée : rachis + folioles réelles disposées en V.
 * Toutes les géométries sont en coordonnées locales de la couronne.
 */
function pinnateFrond(rand, { length, elev, azimuth, dead = false, leaflets = 38 }) {
  const pos = [], col = [], idx = [];
  const dirOut = new THREE.Vector3(Math.cos(azimuth), 0, Math.sin(azimuth));
  const side = new THREE.Vector3(-dirOut.z, 0, dirOut.x);
  const up = new THREE.Vector3(0, 1, 0);
  const cBase = new THREE.Color(dead ? '#6f5232' : '#4f5f3e');
  const cMid = new THREE.Color(dead ? '#9a7748' : '#6c7d58');
  const cTip = new THREE.Color(dead ? '#b4925f' : '#8f9c76');
  const droop = dead ? 0.15 : 0.55 + rand() * 0.25;
  const ca = Math.cos(elev), sa = Math.sin(elev);
  // élévation initiale puis retombée parabolique
  const curve = (t) => new THREE.Vector3()
    .addScaledVector(dirOut, ca * t * length)
    .addScaledVector(up, sa * t * length - droop * t * t * length * (dead ? 0.2 : 0.55));
  const tangent = (t) => curve(Math.min(1, t + 0.01)).sub(curve(Math.max(0, t - 0.01))).normalize();
  const quad = (a, b, c, d, ca, cb) => {
    const o = pos.length / 3;
    for (const v of [a, b, c, d]) pos.push(v.x, v.y, v.z);
    for (const cc of [ca, ca, cb, cb]) col.push(cc.r, cc.g, cc.b);
    idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
  };
  // rachis (ruban vertical effilé)
  const segs = 14;
  for (let k = 0; k < segs; k++) {
    const t0 = k / segs, t1 = (k + 1) / segs;
    const w0 = 0.05 * (1 - t0 * 0.8), w1 = 0.05 * (1 - t1 * 0.8);
    const p0 = curve(t0), p1 = curve(t1);
    const c0 = new THREE.Color('#8a7a4e'), c1 = c0;
    quad(p0.clone().addScaledVector(up, w0), p0.clone().addScaledVector(up, -w0), p1.clone().addScaledVector(up, -w1), p1.clone().addScaledVector(up, w1), c0, c1);
  }
  // folioles
  for (let k = 0; k < leaflets; k++) {
    const t = 0.16 + (k / leaflets) * 0.82;
    const base = curve(t);
    const tan = tangent(t);
    const len = (0.2 + 0.6 * Math.sin(Math.PI * Math.pow(t, 0.75))) * (0.85 + rand() * 0.3) * (dead ? 0.8 : 1);
    const width = 0.06 + 0.04 * Math.sin(Math.PI * t);
    for (const sgn of [-1, 1]) {
      // direction : latérale, relevée en V, inclinée vers la pointe
      const dir = side.clone().multiplyScalar(sgn)
        .addScaledVector(up, dead ? -0.6 : 0.35 + rand() * 0.5)
        .addScaledVector(tan, 0.55 + rand() * 0.35)
        .normalize();
      const tip = base.clone().addScaledVector(dir, len);
      tip.y -= len * len * (dead ? 0.9 : 0.35); // folioles légèrement arquées
      const wv = tan.clone().multiplyScalar(width * 0.5);
      const tone = 0.8 + rand() * 0.4;
      const cA = cBase.clone().lerp(cMid, t).multiplyScalar(tone);
      const cB = cMid.clone().lerp(cTip, t).multiplyScalar(tone);
      quad(base.clone().sub(wv), base.clone().add(wv), tip.clone().addScaledVector(wv, 0.15), tip.clone().addScaledVector(wv, -0.15), cA, cB);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Couronne : ~28 palmes en spirale phyllotaxique + palmes sèches + cœur fibreux */
function palmCrown(top, seed = 7) {
  const rand = prng(seed);
  const geos = [];
  const N = 44;
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const age = i / (N - 1); // 0 = jeune (dressée), 1 = vieille (retombante)
    const elev = THREE.MathUtils.lerp(1.25, -0.15, Math.pow(age, 0.85)) + (rand() - 0.5) * 0.15;
    const g = pinnateFrond(rand, { length: 3.2 + rand() * 1.2 - (1 - age) * 0.6, elev, azimuth: i * golden + rand() * 0.2, leaflets: 44 });
    g.translate(BEND_TOP, top + 0.15 - age * 0.35, 0);
    geos.push(g);
  }
  // palmes sèches pendantes sous la couronne
  for (let i = 0; i < 6; i++) {
    const g = pinnateFrond(rand, { length: 2.4 + rand() * 0.8, elev: -1.1 - rand() * 0.25, azimuth: i * 1.13 + rand(), dead: true, leaflets: 22 });
    g.translate(BEND_TOP, top - 0.45, 0);
    geos.push(g);
  }
  return mergeGeometries(geos);
}

/** Cœur fibreux (bases des palmes au sommet du stipe) */
function crownBase(top) {
  const g = new THREE.CylinderGeometry(0.42, 0.3, 0.9, 16, 3, true);
  g.translate(BEND_TOP, top - 0.25, 0);
  const p = g.attributes.position;
  const rand = prng(3);
  for (let i = 0; i < p.count; i++) {
    const k = 1 + (rand() - 0.5) * 0.18;
    p.setX(i, BEND_TOP + (p.getX(i) - BEND_TOP) * k);
    p.setZ(i, p.getZ(i) * k);
  }
  g.computeVertexNormals();
  return g;
}

/** Régimes de dattes : pédoncules arqués + grappes de fruits */
function dateClusters(top, seed = 11) {
  const rand = prng(seed);
  const stalks = [], fruits = [];
  for (let c = 0; c < 3; c++) {
    const a = c * 1.57 + rand() * 0.6;
    const dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    const start = new THREE.Vector3(BEND_TOP, top - 0.35, 0).addScaledVector(dir, 0.28);
    const end = start.clone().addScaledVector(dir, 0.55).add(new THREE.Vector3(0, -0.95, 0));
    const curve = new THREE.QuadraticBezierCurve3(start, start.clone().addScaledVector(dir, 0.6).add(new THREE.Vector3(0, 0.15, 0)), end);
    stalks.push(new THREE.TubeGeometry(curve, 8, 0.025, 5));
    for (let k = 0; k < 34; k++) {
      const f = new THREE.IcosahedronGeometry(0.032, 0);
      f.scale(1, 1.5, 1);
      const t = 0.45 + rand() * 0.55;
      const pt = curve.getPoint(t);
      f.translate(pt.x + (rand() - 0.5) * 0.28, pt.y - rand() * 0.45, pt.z + (rand() - 0.5) * 0.28);
      fruits.push(f);
    }
  }
  return { stalk: mergeGeometries(stalks), fruit: mergeGeometries(fruits) };
}

/** Version allégée (arrière-plan) : palmes en cartes texturées */
function frondCard(length, width, droop, segs = 4) {
  const g = new THREE.PlaneGeometry(width, length, 2, segs);
  g.translate(0, length / 2, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = p.getY(i) / length;
    const x = p.getX(i);
    p.setXYZ(i, x * (1 - t * 0.35), -droop * t * t * length + Math.abs(x) * 0.35 + t * 0.6, t * length * 0.92);
  }
  g.computeVertexNormals();
  return g;
}

function palmCrownLow(top) {
  const geos = [];
  [
    { n: 9, len: 4.4, droop: 0.65, tilt: -0.25, y: 0.0 },
    { n: 8, len: 4.0, droop: 0.35, tilt: 0.25, y: 0.3 },
    { n: 5, len: 3.0, droop: 0.15, tilt: 0.85, y: 0.55 },
  ].forEach((r, ri) => {
    for (let i = 0; i < r.n; i++) {
      const g = frondCard(r.len, 2.0, r.droop);
      g.rotateX(-r.tilt);
      g.rotateY((i / r.n) * Math.PI * 2 + ri * 0.45);
      g.translate(BEND_TOP, top + r.y, 0);
      geos.push(g);
    }
  });
  return mergeGeometries(geos);
}

/* --------------------------------- vent --------------------------------- */

export const windUniforms = { uTime: { value: 0 } };

/** Balancement des feuillages (shader de sommets, coût négligeable) */
function addWind(material, { pivotY = 8.4, amount = 0.012, pivotX = BEND_TOP } = {}) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = windUniforms.uTime;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        {
          vec3 rel = position - vec3(${pivotX.toFixed(3)}, ${pivotY.toFixed(3)}, 0.0);
          float d2 = dot(rel.xz, rel.xz) + max(0.0, rel.y) * max(0.0, rel.y);
          vec2 ip = vec2(0.0);
          #ifdef USE_INSTANCING
            ip = vec2(instanceMatrix[3][0], instanceMatrix[3][2]);
          #endif
          float ph = ip.x * 0.21 + ip.y * 0.17;
          float w1 = sin(uTime * 1.6 + ph + position.x * 0.9);
          float w2 = sin(uTime * 2.7 + ph * 1.7 + position.z * 1.3);
          transformed.x += (w1 * 0.7 + w2 * 0.3) * ${amount.toFixed(4)} * d2;
          transformed.z += cos(uTime * 1.2 + ph) * ${(amount * 0.7).toFixed(4)} * d2;
          transformed.y += w2 * ${(amount * 0.4).toFixed(4)} * d2;
        }`);
  };
  material.customProgramCacheKey = () => `wind-${pivotY}-${amount}`;
  return material;
}

export { addWind };

let parts = null;

export function vegetationParts() {
  if (parts) return parts;
  const barkMat = new THREE.MeshStandardMaterial({ map: textures.palmBark(), normalMap: normalsFor('palmBark', 3), normalScale: new THREE.Vector2(0.8, 0.8), roughness: 0.95, color: '#ffffff' });
  const leafMat = addWind(new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.72, metalness: 0 }));
  const frondCardMat = addWind(new THREE.MeshStandardMaterial({
    map: textures.frond(), alphaTest: 0.36, side: THREE.DoubleSide, roughness: 0.75, color: '#d2dabb',
  }), { amount: 0.008 });
  const fiberMat = new THREE.MeshStandardMaterial({ map: textures.palmBark(), color: '#a08060', roughness: 1 });
  const datesMat = addWind(new THREE.MeshStandardMaterial({ color: '#7e3d14', roughness: 0.38 }), { amount: 0.004 });
  const stalkMat = addWind(new THREE.MeshStandardMaterial({ color: '#a8803d', roughness: 0.75 }), { amount: 0.004 });
  const foliageMat = addWind(new THREE.MeshStandardMaterial({
    map: textures.foliage(), alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.9,
  }), { pivotY: 2.5, pivotX: 0, amount: 0.006 });
  const oliveMat = new THREE.MeshStandardMaterial({ color: '#7d8a5a', roughness: 0.9, flatShading: true });
  const shrubMat = new THREE.MeshStandardMaterial({ color: '#5f7a3a', roughness: 0.95, flatShading: true });
  const woodMat = new THREE.MeshStandardMaterial({ color: '#6b5640', roughness: 0.95 });

  // Palmier dattier (haute définition)
  const TOP = 8.5;
  const dc = dateClusters(TOP);

  // Olivier
  const oTrunk = new THREE.CylinderGeometry(0.14, 0.26, 2.2, 7, 3);
  oTrunk.translate(0, 1.1, 0);
  const blobs = [];
  [[0, 3.1, 0, 1.6], [0.9, 2.8, 0.3, 1.1], [-0.8, 2.9, -0.4, 1.2], [0.2, 3.6, -0.6, 1.0], [-0.3, 2.6, 0.9, 1.0]].forEach(([x, y, z, r]) => {
    const g = new THREE.IcosahedronGeometry(r, 1);
    g.translate(x, y, z);
    blobs.push(g);
  });
  const oCrown = mergeGeometries(blobs);
  const oCards = mergeGeometries(
    [0, 1, 2].map((i) => {
      const g = new THREE.PlaneGeometry(4.2, 3.2);
      g.rotateY((i * Math.PI) / 3);
      g.translate(0, 3.1, 0);
      return g;
    })
  );

  // Arbuste
  const sBlobs = [];
  [[0, 0.5, 0, 0.7], [0.5, 0.4, 0.2, 0.5], [-0.4, 0.45, -0.2, 0.55]].forEach(([x, y, z, r]) => {
    const g = new THREE.IcosahedronGeometry(r, 1);
    g.translate(x, y, z);
    sBlobs.push(g);
  });
  const sGeo = mergeGeometries(sBlobs);

  parts = {
    // palmeraie d'arrière-plan (milliers d'instances)
    palmierLow: [
      { geo: palmTrunk(TOP, true), mat: barkMat },
      { geo: palmCrownLow(TOP), mat: frondCardMat },
    ],
    palmier: [
      { geo: palmTrunk(TOP), mat: barkMat },
      { geo: crownBase(TOP), mat: fiberMat },
      { geo: palmCrown(TOP), mat: leafMat },
      { geo: dc.stalk, mat: stalkMat },
      { geo: dc.fruit, mat: datesMat },
    ],
    olivier: [
      { geo: oTrunk, mat: woodMat },
      { geo: oCrown, mat: oliveMat },
      { geo: oCards, mat: foliageMat },
    ],
    arbuste: [{ geo: sGeo, mat: shrubMat }],
  };
  return parts;
}

/** Rayon de sélection approximatif par essence (pour la surbrillance) */
export const VEG_RADIUS = { palmier: 4.2, olivier: 2.4, arbuste: 1.1 };
export const VEG_HEIGHT = { palmier: 10, olivier: 4.5, arbuste: 1.2 };

/** Groupe autonome (aperçu de placement, export) */
export function vegetationMesh(type) {
  const g = new THREE.Group();
  for (const part of vegetationParts()[type]) {
    const m = new THREE.Mesh(part.geo, part.mat);
    m.castShadow = true;
    g.add(m);
  }
  return g;
}
