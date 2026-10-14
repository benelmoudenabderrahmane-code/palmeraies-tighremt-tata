import * as THREE from 'three';
import { mergeGeometries } from './geo';
import { buildInitialEntities, PITCH_ROT } from './planData';
import { addWind } from './vegetation';

/*
 * Détails du désert (reg) : cailloux, rochers, blocs au pied de la
 * montagne et buissons épars. Placés hors des aménagements du plan.
 */

function prng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function pointInPoly(x, z, pts) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, zi] = pts[i], [xj, zj] = pts[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
  }
  return c;
}

/** Zones à laisser libres (terrain, allée, parcelles, bâtiments…) */
function exclusionTest() {
  const ents = buildInitialEntities();
  const polys = [], discs = [], rects = [];
  const c = Math.cos(PITCH_ROT), s = Math.sin(PITCH_ROT);
  for (const e of ents) {
    if (e.points && e.type !== 'mur') {
      polys.push(e.points.map(([x, z]) => [x + e.position[0], z + e.position[1]]));
    } else if (['vestiaire', 'bassin', 'puits', 'local-pompe'].includes(e.type)) {
      discs.push([e.position[0], e.position[1], 11]);
    } else if (e.type === 'citystade') {
      rects.push({ x: e.position[0], z: e.position[1], hw: e.props.width / 2 + 3, hd: e.props.depth / 2 + 3, rot: e.rotation });
    }
  }
  return (x, z) => {
    // allée + terrain (repère du terrain)
    const lx = x * c - z * s, lz = x * s + z * c;
    if (Math.abs(lx) < 46 && Math.abs(lz) < 64) return true;
    for (const [dx, dz, r] of discs) if ((x - dx) ** 2 + (z - dz) ** 2 < r * r) return true;
    for (const R of rects) {
      const cx = x - R.x, cz = z - R.z, cr = Math.cos(R.rot), sr = Math.sin(R.rot);
      const ux = cx * cr - cz * sr, uz = cx * sr + cz * cr;
      if (Math.abs(ux) < R.hw && Math.abs(uz) < R.hd) return true;
    }
    for (const p of polys) if (pointInPoly(x, z, p)) return true;
    return false;
  };
}

/** Roche facettée : icosaèdre déformé par du bruit */
function rockGeometry(seed, detail = 1) {
  const g = new THREE.IcosahedronGeometry(1, detail);
  const p = g.attributes.position;
  const r = prng(seed);
  const k = [r() * 6, r() * 6, r() * 6];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = 1 + 0.22 * Math.sin(x * 3.1 + k[0]) * Math.cos(y * 2.7 + k[1]) + 0.12 * Math.sin(z * 4.3 + k[2]);
    p.setXYZ(i, x * n, Math.max(-0.35, y * n * 0.62), z * n * 0.9);
  }
  g.computeVertexNormals();
  return g;
}

/** Buisson du désert (touffe basse gris-vert) */
function shrubGeometry(seed) {
  const r = prng(seed);
  const parts = [];
  const n = 5;
  for (let i = 0; i < n; i++) {
    const g = new THREE.IcosahedronGeometry(0.35 + r() * 0.25, 1);
    const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const j = 0.75 + r() * 0.5;
      p.setXYZ(k, p.getX(k) * j, p.getY(k) * j * 0.8, p.getZ(k) * j);
    }
    const a = (i / n) * Math.PI * 2 + r();
    g.translate(Math.cos(a) * 0.35, 0.3 + r() * 0.15, Math.sin(a) * 0.35);
    // couleurs : gris-vert, feuillage sec à la base
    const col = new Float32Array(p.count * 3);
    for (let k = 0; k < p.count; k++) {
      const y = p.getY(k);
      const c = new THREE.Color('#5b6a43').lerp(new THREE.Color('#8a8458'), r() * 0.5).lerp(new THREE.Color('#6b5a3e'), Math.max(0, 0.35 - y));
      col.set([c.r, c.g, c.b], k * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    parts.push(g);
  }
  return mergeGeometries(parts);
}

function scatterInstanced(geo, mat, count, place, { cast = true, receive = true, noPT = false } = {}) {
  const im = new THREE.InstancedMesh(geo, mat, count);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3();
  const e = new THREE.Euler();
  const col = new THREE.Color();
  let n = 0;
  for (let i = 0; i < count; i++) {
    const s = place(i);
    if (!s) continue;
    e.set(s.tiltX || 0, s.rot, s.tiltZ || 0);
    q.setFromEuler(e);
    sc.set(s.size * (s.sx || 1), s.size * (s.sy || 1), s.size * (s.sz || 1));
    p.set(s.x, s.y ?? 0, s.z);
    im.setMatrixAt(n, m4.compose(p, q, sc));
    if (s.color) im.setColorAt(n, col.set(s.color));
    n++;
  }
  im.count = n;
  im.castShadow = cast;
  im.receiveShadow = receive;
  im.userData.noPathTrace = noPT;
  return im;
}

/**
 * Construit les détails du désert autour du site.
 * density : 1 = qualité haute, < 1 = appareils modestes.
 */
export function buildDesertDetails(center, density = 1) {
  const group = new THREE.Group();
  group.name = 'details-desert';
  const blocked = exclusionTest();
  const r = prng(2026);
  const rockMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.92, flatShading: true });
  const rockTones = ['#8a6a50', '#9b7a5c', '#6f5643', '#a88b6d', '#7c7068', '#5f4a3a'];

  const placeIn = (rMin, rMax, bias) => () => {
    for (let tries = 0; tries < 8; tries++) {
      const a = r() * Math.PI * 2;
      const d = rMin + Math.sqrt(r()) * (rMax - rMin);
      const x = center.x + Math.cos(a) * d * (bias?.sx || 1), z = center.z + Math.sin(a) * d;
      if (!blocked(x, z)) return [x, z];
    }
    return null;
  };

  // cailloux
  const pebbleGeo = mergeGeometries([0, 1, 2].map((k) => rockGeometry(10 + k, 0).translate((k - 1) * 2.4, 0, (k % 2) * 1.7)));
  const pebblePos = placeIn(0, 230);
  group.add(scatterInstanced(pebbleGeo, rockMat, Math.round(5000 * density), () => {
    const p = pebblePos();
    if (!p) return null;
    return { x: p[0], z: p[1], y: -0.01, rot: r() * 6.28, size: 0.035 + r() * 0.06, color: rockTones[(r() * rockTones.length) | 0] };
  }, { cast: false, noPT: true }));

  // rochers
  const rockGeos = [0, 1, 2].map((k) => rockGeometry(20 + k, 1));
  const rockPos = placeIn(20, 480);
  rockGeos.forEach((g) => group.add(scatterInstanced(g, rockMat, Math.round(700 * density), () => {
    const p = rockPos();
    if (!p) return null;
    const size = 0.15 + Math.pow(r(), 2.5) * 0.7;
    return { x: p[0], z: p[1], y: -size * 0.2, rot: r() * 6.28, tiltX: (r() - 0.5) * 0.4, tiltZ: (r() - 0.5) * 0.4, size, color: rockTones[(r() * rockTones.length) | 0] };
  })));

  // blocs éboulés au pied de la montagne (à l'est)
  const boulderPos = () => {
    for (let t = 0; t < 8; t++) {
      const a = (r() - 0.5) * Math.PI * 1.1; // secteur est
      const d = 230 + r() * 260;
      const x = center.x + Math.cos(a) * d, z = center.z + Math.sin(a) * d;
      if (!blocked(x, z)) return [x, z];
    }
    return null;
  };
  group.add(scatterInstanced(rockGeometry(31, 2), rockMat, Math.round(220 * density), () => {
    const p = boulderPos();
    if (!p) return null;
    const size = 0.8 + Math.pow(r(), 2) * 2.4;
    return { x: p[0], z: p[1], y: -size * 0.3, rot: r() * 6.28, tiltX: (r() - 0.5) * 0.5, size, color: rockTones[(r() * 4) | 0] };
  }));

  // buissons du désert : plus denses vers la palmeraie (ouest) et le long des ravines
  const shrubMat = addWind(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: true }), { pivotY: 0, pivotX: 0, amount: 0.05 });
  const shrubGeos = [0, 1].map((k) => shrubGeometry(40 + k));
  shrubGeos.forEach((g) => group.add(scatterInstanced(g, shrubMat, Math.round(450 * density), () => {
    for (let t = 0; t < 8; t++) {
      const west = r() < 0.6;
      const x = west ? center.x - 60 - r() * 160 : center.x + (r() - 0.5) * 700;
      const z = center.z + (r() - 0.5) * (west ? 520 : 700);
      if (blocked(x, z)) continue;
      return { x, z, rot: r() * 6.28, size: 0.6 + r() * 1.1, sy: 0.7 + r() * 0.5 };
    }
    return null;
  })));

  return group;
}
