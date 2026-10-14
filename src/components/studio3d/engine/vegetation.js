import * as THREE from 'three';
import { mergeGeometries } from './geo';
import { textures, normalsFor } from './textures';

/*
 * Végétation instanciée : chaque essence est décrite par plusieurs
 * « parties » (géométrie + matériau) partagées par toutes les instances.
 * Des centaines d'arbres s'affichent ainsi en quelques appels de rendu.
 */

function palmTrunk(height = 8.5, low = false) {
  const seg = low ? 3 : 10;
  const g = new THREE.CylinderGeometry(0.2, 0.3, height, low ? 5 : 9, seg, true);
  g.translate(0, height / 2, 0);
  // léger galbe du stipe + renflement à la base
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) / height;
    const bulge = 1 + Math.max(0, 0.25 - y) * 1.2;
    p.setX(i, p.getX(i) * bulge + Math.sin(y * Math.PI) * 0.35);
    p.setZ(i, p.getZ(i) * bulge);
  }
  // UV : anneaux répétés le long du tronc
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * height * 1.4);
  g.computeVertexNormals();
  return g;
}

function frond(length, width, droop, segs = 10) {
  const g = new THREE.PlaneGeometry(width, length, 2, segs);
  g.translate(0, length / 2, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = p.getY(i) / length;
    const x = p.getX(i);
    // la palme part vers l'extérieur (+Z) puis retombe
    const out = t * length;
    const down = droop * t * t * length;
    // rachis en V : les folioles remontent légèrement
    const v = Math.abs(x) * 0.35;
    p.setXYZ(i, x * (1 - t * 0.35), -down + v + t * 0.6, out * 0.92);
  }
  g.computeVertexNormals();
  return g;
}

function palmCrown(top, low = false) {
  const geos = [];
  const rings = low ? [
    { n: 7, len: 4.2, droop: 0.5, tilt: -0.1, y: 0.1 },
    { n: 5, len: 3.4, droop: 0.2, tilt: 0.55, y: 0.45 },
  ] : [
    { n: 9, len: 4.2, droop: 0.55, tilt: -0.15, y: 0.1 },
    { n: 8, len: 3.8, droop: 0.32, tilt: 0.25, y: 0.35 },
    { n: 6, len: 3.0, droop: 0.12, tilt: 0.75, y: 0.55 },
  ];
  rings.forEach((r, ri) => {
    for (let i = 0; i < r.n; i++) {
      const g = frond(r.len * (low ? 1.15 : 1), low ? 1.6 : 1.1, r.droop, low ? 4 : 10);
      g.rotateX(-r.tilt);
      g.rotateY((i / r.n) * Math.PI * 2 + ri * 0.4);
      g.translate(0, top + r.y, 0);
      geos.push(g);
    }
  });
  return mergeGeometries(geos);
}

let parts = null;

export function vegetationParts() {
  if (parts) return parts;
  const barkMat = new THREE.MeshStandardMaterial({ map: textures.bark(), normalMap: normalsFor('bark', 4), roughness: 0.95 });
  const frondMat = new THREE.MeshStandardMaterial({
    map: textures.frond(),
    alphaTest: 0.45,
    side: THREE.DoubleSide,
    roughness: 0.75,
    color: '#ffffff',
  });
  const foliageMat = new THREE.MeshStandardMaterial({
    map: textures.foliage(),
    alphaTest: 0.4,
    side: THREE.DoubleSide,
    roughness: 0.9,
  });
  const oliveMat = new THREE.MeshStandardMaterial({ color: '#7d8a5a', roughness: 0.9, flatShading: true });
  const shrubMat = new THREE.MeshStandardMaterial({ color: '#5f7a3a', roughness: 0.95, flatShading: true });
  const woodMat = new THREE.MeshStandardMaterial({ color: '#6b5640', roughness: 0.95 });

  // Palmier dattier
  const trunk = palmTrunk(8.5);
  const crown = palmCrown(8.5);
  // régimes de dattes (grappes de petits fruits sous la couronne)
  const fruits = [];
  for (let i = 0; i < 3; i++) {
    const a = i * 2.1 + 0.4;
    for (let k = 0; k < 9; k++) {
      const g = new THREE.SphereGeometry(0.07, 5, 4);
      g.scale(1, 1.4, 1);
      g.translate(Math.cos(a) * (0.42 + (k % 3) * 0.06), 8.15 - Math.floor(k / 3) * 0.14, Math.sin(a) * (0.42 + (k % 3) * 0.06) + ((k % 2) - 0.5) * 0.08);
      fruits.push(g);
    }
  }
  const dates = mergeGeometries(fruits);
  const datesMat = new THREE.MeshStandardMaterial({ color: '#a2541b', roughness: 0.55 });

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

  // version allégée pour la palmeraie d'arrière-plan (milliers d'instances)
  const lowParts = [
    { geo: palmTrunk(8.5, true), mat: barkMat },
    { geo: palmCrown(8.5, true), mat: frondMat },
  ];

  parts = {
    palmierLow: lowParts,
    palmier: [
      { geo: trunk, mat: barkMat },
      { geo: crown, mat: frondMat },
      { geo: dates, mat: datesMat },
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
