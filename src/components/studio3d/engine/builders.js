import * as THREE from 'three';
import { textures } from './textures';
import {
  arcStrip, boxUV, flatShape, insetPolygon, lineStrip, mergeGeometries,
  planarUV, polylineWall, roundedRect, shapeFrom, slab,
} from './geo';

/*
 * Constructeurs de modèles 3D. Chaque fonction reçoit une entité
 * et renvoie un THREE.Group en coordonnées locales (origine = position
 * de l'entité, rotation et échelle appliquées par le moteur).
 */

/* ---------------------------- matériaux ----------------------------- */

let M = null;
export function mats() {
  if (M) return M;
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
  M = {
    gravel: std({ map: textures.gravel(), roughness: 0.95 }),
    sand: std({ map: textures.sand(), roughness: 1 }),
    grass: std({ map: textures.grass(), roughness: 0.95 }),
    turf: std({ map: textures.turf(), roughness: 0.9 }),
    earthPitch: std({ map: textures.earthPitch(), roughness: 1 }),
    soil: std({ color: '#7a5a3d', roughness: 1 }),
    curb: std({ map: textures.concrete(), color: '#f1ede4', roughness: 0.7 }),
    concrete: std({ map: textures.concrete(), roughness: 0.8 }),
    pise: std({ map: textures.pise(), roughness: 0.95 }),
    wall: std({ map: textures.wall(), roughness: 0.95 }),
    line: new THREE.MeshBasicMaterial({ color: '#f8f8f2', polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }),
    lineStd: std({ color: '#f6f6f0', roughness: 0.6 }),
    white: std({ color: '#f4f4f1', roughness: 0.4, metalness: 0.1 }),
    greenDoor: std({ color: '#3f7d4a', roughness: 0.6 }),
    wood: std({ color: '#8a5a35', roughness: 0.8 }),
    darkWood: std({ color: '#5a3c25', roughness: 0.85 }),
    metal: std({ color: '#5d6166', roughness: 0.45, metalness: 0.7 }),
    darkMetal: std({ color: '#2f3338', roughness: 0.5, metalness: 0.6 }),
    glass: std({ color: '#2a3a44', roughness: 0.15, metalness: 0.5 }),
    solar: std({ color: '#1b2a4a', roughness: 0.2, metalness: 0.6 }),
    water: new THREE.MeshPhysicalMaterial({
      map: textures.water(), color: '#7fbcbc', roughness: 0.04, metalness: 0, transparent: true, opacity: 0.9,
      normalMap: textures.waterNormal(), normalScale: new THREE.Vector2(0.45, 0.45),
      ior: 1.33, specularIntensity: 1, clearcoat: 0.6, clearcoatRoughness: 0.08,
    }),
    poolFloor: std({ color: '#3d7f86', roughness: 0.7 }),
    windowGlow: new THREE.MeshStandardMaterial({ color: '#26343c', roughness: 0.15, metalness: 0.5, emissive: '#ffc77a', emissiveIntensity: 0 }),
    tuft: new THREE.MeshStandardMaterial({ map: textures.grassTuft(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.95 }),
    net: new THREE.MeshStandardMaterial({ map: netTexture(), alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.8 }),
    fence: new THREE.MeshStandardMaterial({ map: fenceTexture(), transparent: true, depthWrite: false, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.4 }),
    sign: std({ color: '#133d20', roughness: 0.6 }),
    lampGlow: new THREE.MeshStandardMaterial({ color: '#fff3d1', emissive: '#ffe2a8', emissiveIntensity: 0.2 }),
    skin: std({ color: '#a8754f' }),
    cloth1: std({ color: '#2f5d8a' }),
    cloth2: std({ color: '#c0502f' }),
    car: std({ color: '#d8d4cc', roughness: 0.35, metalness: 0.5 }),
    tyre: std({ color: '#1d1d1d', roughness: 0.9 }),
    rust: std({ color: '#7c4a32', roughness: 0.8 }),
    zone: std({ color: '#c9b089', roughness: 1 }),
    play: std({ color: '#e0a03a', roughness: 0.6 }),
  };
  return M;
}

function netTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  g.strokeStyle = '#ffffff';
  g.lineWidth = 2;
  for (let i = 0; i <= 64; i += 16) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 64); g.stroke();
    g.beginPath(); g.moveTo(0, i); g.lineTo(64, i); g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function fenceTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  g.strokeStyle = '#9aa3a8';
  g.lineWidth = 2.5;
  for (let i = -64; i <= 128; i += 16) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 64, 64); g.stroke();
    g.beginPath(); g.moveTo(i + 64, 0); g.lineTo(i, 64); g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function mesh(geo, mat, { cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

function box(w, h, d, mat, x = 0, y = 0, z = 0, tile = 2) {
  const g = boxUV(new THREE.BoxGeometry(w, h, d), tile);
  g.translate(x, y + h / 2, z);
  return mesh(g, mat);
}

function cyl(rt, rb, h, mat, x = 0, y = 0, z = 0, seg = 12) {
  const g = new THREE.CylinderGeometry(rt, rb, h, seg);
  g.translate(x, y + h / 2, z);
  return mesh(g, mat);
}

/* ------------------------------ terrain ----------------------------- */

function buildTerrain(e) {
  const m = mats();
  const { length: L, width: W, surface } = e.props;
  const g = new THREE.Group();
  const surfMat = surface === 'gazon' ? m.turf : m.earthPitch;
  const base = new THREE.PlaneGeometry(W + 6, L + 6);
  base.rotateX(-Math.PI / 2);
  base.translate(0, 0.06, 0);
  if (surface === 'gazon') {
    // bandes de tonte dans le sens de la largeur
    const uv = base.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 1, uv.getY(i) * ((L + 6) / 12));
  } else planarUV(base, 10);
  g.add(mesh(base, surfMat, { cast: false }));

  // marquage réglementaire (lignes de 12 cm)
  const lw = 0.12, y = 0.075;
  const hl = L / 2, hw = W / 2;
  const geos = [
    lineStrip([-hw, -hl], [hw, -hl], lw, y),
    lineStrip([-hw, hl], [hw, hl], lw, y),
    lineStrip([-hw, -hl], [-hw, hl], lw, y),
    lineStrip([hw, -hl], [hw, hl], lw, y),
    lineStrip([-hw, 0], [hw, 0], lw, y),
    arcStrip(0, 0, 9.15, lw, 0, Math.PI * 2, y),
    arcStrip(0, 0, 0.2, 0.4, 0, Math.PI * 2, y),
  ];
  for (const s of [-1, 1]) {
    const gl = s * hl;
    const pa = Math.min(40.3, W - 4) / 2, pd = Math.min(16.5, L / 5);
    const ga = Math.min(18.32, W - 10) / 2, gd = 5.5;
    geos.push(
      lineStrip([-pa, gl], [-pa, gl - s * pd], lw, y),
      lineStrip([pa, gl], [pa, gl - s * pd], lw, y),
      lineStrip([-pa, gl - s * pd], [pa, gl - s * pd], lw, y),
      lineStrip([-ga, gl], [-ga, gl - s * gd], lw, y),
      lineStrip([ga, gl], [ga, gl - s * gd], lw, y),
      lineStrip([-ga, gl - s * gd], [ga, gl - s * gd], lw, y),
      arcStrip(0, gl - s * 11, 0.18, 0.36, 0, Math.PI * 2, y)
    );
    // arc de réparation (partie hors surface)
    const off = pd - 11; // distance du point de penalty à la ligne de surface
    const half = Math.acos(off / 9.15);
    // direction vers le centre du terrain : -s en z ; ring angle θ → (cos θ, -sin θ)
    const center = s > 0 ? Math.PI / 2 : -Math.PI / 2;
    geos.push(arcStrip(0, gl - s * 11, 9.15, lw, center - half, half * 2, y));
    // arcs de coin
    for (const sx of [-1, 1]) {
      const cx = sx * hw;
      // quart de cercle tourné vers l'intérieur
      const ang = Math.atan2(s, -sx); // direction (−sx, −s) en monde → ring (cos, −sin)
      geos.push(arcStrip(cx, gl, 1, lw, ang - Math.PI / 4, Math.PI / 2, y));
    }
  }
  g.add(mesh(mergeGeometries(geos.map((x) => (x.index ? x.toNonIndexed() : x))), m.line, { cast: false }));
  return g;
}

function buildAllee(e) {
  const m = mats();
  const { length: L, width: W, radius: r } = e.props;
  const g = new THREE.Group();
  const outer = roundedRect(W, L, r);
  const surf = flatShape(outer, 0.03, 6);
  g.add(mesh(surf, m.gravel, { cast: false }));
  // bordure béton blanche
  const ring = roundedRect(W + 0.5, L + 0.5, r + 0.25);
  ring.holes.push(roundedRect(W, L, r));
  g.add(mesh(slab(ring, 0.18, 0, 1), m.curb));
  return g;
}

/* ----------------------------- bâtiments ---------------------------- */

function buildVestiaire(e) {
  const m = mats();
  const w = e.props.width || 7, d = e.props.depth || 9;
  const H = 3.3;
  const g = new THREE.Group();
  // dallage périphérique
  g.add(box(w + 2.2, 0.25, d + 2.2, m.concrete, 0, 0, 0));
  // volume principal
  g.add(box(w, H, d, m.pise, 0, 0.25, 0, 2));
  // acrotère et créneaux en gradins (style local)
  const top = 0.25 + H;
  g.add(box(w + 0.3, 0.25, d + 0.3, m.pise, 0, top, 0));
  const merlon = (x, z, s = 1) => {
    g.add(box(1.1 * s, 0.45, 1.1 * s, m.pise, x, top + 0.25, z));
    g.add(box(0.7 * s, 0.4, 0.7 * s, m.pise, x, top + 0.7, z));
    g.add(box(0.35 * s, 0.35, 0.35 * s, m.pise, x, top + 1.1, z));
  };
  merlon(-w / 2 + 0.4, -d / 2 + 0.4);
  merlon(w / 2 - 0.4, -d / 2 + 0.4);
  merlon(-w / 2 + 0.4, d / 2 - 0.4);
  merlon(w / 2 - 0.4, d / 2 - 0.4);
  merlon(0, d / 2 - 0.2, 1.6); // fronton central de la façade
  // façade principale (côté +Z) : 3 portes vertes
  const doorW = 1, doorH = 2.2;
  [-1.6, 0, 1.6].forEach((x) => {
    g.add(box(doorW, doorH, 0.08, m.greenDoor, x, 0.25, d / 2 + 0.02));
    g.add(box(doorW + 0.2, 0.15, 0.12, m.pise, x, 0.25 + doorH, d / 2 + 0.04));
  });
  // fenêtres à croisillons (côtés)
  const win = (x, z, rotY) => {
    const wg = new THREE.Group();
    wg.add(box(0.9, 1, 0.06, m.windowGlow, 0, 0, 0));
    wg.add(box(1.05, 0.08, 0.1, m.darkWood, 0, 0.46, 0));
    wg.add(box(1.05, 0.08, 0.1, m.darkWood, 0, -0.04, 0));
    wg.add(box(0.08, 1.05, 0.1, m.darkWood, 0, -0.02, 0));
    wg.add(box(1.05, 0.06, 0.1, m.darkWood, 0, 0.98, 0));
    wg.add(box(0.06, 1.05, 0.1, m.darkWood, -0.5, -0.02, 0));
    wg.add(box(0.06, 1.05, 0.1, m.darkWood, 0.5, -0.02, 0));
    wg.position.set(x, 1.6, z);
    wg.rotation.y = rotY;
    g.add(wg);
  };
  [-d / 4, d / 4].forEach((z) => {
    win(w / 2 + 0.03, z, Math.PI / 2);
    win(-w / 2 - 0.03, z, -Math.PI / 2);
  });
  win(-w / 4, -d / 2 - 0.03, Math.PI);
  win(w / 4, -d / 2 - 0.03, Math.PI);
  return g;
}

function buildBassin(e) {
  const m = mats();
  const w = e.props.width || 11, d = e.props.depth || 11, h = e.props.height || 1.6;
  const t = 0.35;
  const g = new THREE.Group();
  // parvis béton
  g.add(box(w + 3, 0.12, d + 3, m.concrete, 0, 0, 0));
  // murs
  g.add(box(w, h, t, m.concrete, 0, 0, -d / 2 + t / 2));
  g.add(box(w, h, t, m.concrete, 0, 0, d / 2 - t / 2));
  g.add(box(t, h, d - 2 * t, m.concrete, -w / 2 + t / 2, 0, 0));
  g.add(box(t, h, d - 2 * t, m.concrete, w / 2 - t / 2, 0, 0));
  // margelle
  const rim = roundedRect(w + 0.2, d + 0.2, 0.1);
  rim.holes.push(roundedRect(w - 2 * t, d - 2 * t, 0.05));
  g.add(mesh(slab(rim, 0.1, h, 1), m.curb));
  // fond + eau
  g.add(box(w - 2 * t, 0.1, d - 2 * t, m.poolFloor, 0, 0.12, 0));
  const water = new THREE.PlaneGeometry(w - 2 * t, d - 2 * t);
  water.rotateX(-Math.PI / 2);
  water.translate(0, h - 0.3, 0);
  const wm = mesh(water, m.water, { cast: false });
  wm.userData.water = true;
  g.add(wm);
  // échelle d'accès
  g.add(box(0.06, 1.4, 0.06, m.metal, -0.3, h - 0.2, d / 2 - t - 0.1));
  g.add(box(0.06, 1.4, 0.06, m.metal, 0.3, h - 0.2, d / 2 - t - 0.1));
  return g;
}

function buildPuits(e) {
  const m = mats();
  const s = Math.max(2.4, Math.min(e.props.width || 3.5, 4));
  const g = new THREE.Group();
  g.add(box(s + 0.6, 0.12, s + 0.6, m.concrete));
  // margelle maçonnée
  const ring = new THREE.Shape();
  ring.absarc(0, 0, s / 2 - 0.3, 0, Math.PI * 2);
  const hole = new THREE.Path();
  hole.absarc(0, 0, s / 2 - 0.6, 0, Math.PI * 2, true);
  ring.holes.push(hole);
  g.add(mesh(slab(ring, 0.9, 0.12, 1), m.wall));
  // couvercle métallique + potence de pompe
  const lid = new THREE.CylinderGeometry(s / 2 - 0.55, s / 2 - 0.55, 0.05, 24);
  lid.translate(0, 0.95, 0);
  g.add(mesh(lid, m.darkMetal));
  g.add(box(0.12, 2.2, 0.12, m.metal, -s / 2 + 0.2, 0.1, 0));
  g.add(box(0.12, 2.2, 0.12, m.metal, s / 2 - 0.2, 0.1, 0));
  g.add(box(s - 0.2, 0.12, 0.12, m.metal, 0, 2.2, 0));
  g.add(cyl(0.12, 0.12, 0.5, m.rust, 0, 1.0, 0, 10));
  return g;
}

function buildLocal(e) {
  const m = mats();
  const w = Math.max(2.6, Math.min(e.props.width || 3.5, 5)), d = Math.max(2.4, Math.min(e.props.depth || 3, 5));
  const g = new THREE.Group();
  g.add(box(w + 0.6, 0.15, d + 0.6, m.concrete));
  g.add(box(w, 2.5, d, m.pise, 0, 0.15, 0));
  g.add(box(w + 0.2, 0.15, d + 0.2, m.pise, 0, 2.65, 0));
  g.add(box(0.9, 2, 0.06, m.darkMetal, 0, 0.15, d / 2 + 0.02));
  return g;
}

function buildCityStade(e) {
  const m = mats();
  const w = e.props.width, d = e.props.depth;
  const g = new THREE.Group();
  g.add(box(w + 2, 0.15, d + 2, m.concrete, 0, 0, 0, 4));
  const turf = new THREE.PlaneGeometry(w - 1, d - 1);
  turf.rotateX(-Math.PI / 2);
  turf.translate(0, 0.17, 0);
  const uv = turf.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i), uv.getY(i) * (d / 8));
  g.add(mesh(turf, m.turf, { cast: false }));
  // lignes
  const y = 0.18, lw = 0.1, hw = (w - 3) / 2, hd = (d - 3) / 2;
  const lines = [
    lineStrip([-hw, -hd], [hw, -hd], lw, y), lineStrip([-hw, hd], [hw, hd], lw, y),
    lineStrip([-hw, -hd], [-hw, hd], lw, y), lineStrip([hw, -hd], [hw, hd], lw, y),
    lineStrip([-hw, 0], [hw, 0], lw, y), arcStrip(0, 0, 3, lw, 0, Math.PI * 2, y),
    arcStrip(0, -hd, 6, lw, -Math.PI, Math.PI, y), arcStrip(0, hd, 6, lw, 0, Math.PI, y),
  ];
  g.add(mesh(mergeGeometries(lines.map((x) => (x.index ? x.toNonIndexed() : x))), m.line, { cast: false }));
  // clôture grillagée 4 m sur poteaux
  const H = 4;
  const fence = (len, x, z, rot) => {
    const p = new THREE.PlaneGeometry(len, H);
    const fu = p.attributes.uv;
    for (let i = 0; i < fu.count; i++) fu.setXY(i, fu.getX(i) * len * 2, fu.getY(i) * H * 2);
    p.translate(0, H / 2 + 0.15, 0);
    const fm = mesh(p, m.fence, { cast: true, receive: false });
    fm.position.set(x, 0, z);
    fm.rotation.y = rot;
    g.add(fm);
    const n = Math.max(2, Math.round(len / 3));
    for (let i = 0; i <= n; i++) {
      const t = -len / 2 + (i / n) * len;
      const post = cyl(0.05, 0.05, H, m.metal, 0, 0.15, 0, 6);
      post.position.set(x + Math.cos(rot) * t, 0, z - Math.sin(rot) * t);
      g.add(post);
    }
  };
  fence(w, 0, -d / 2, 0);
  fence(w, 0, d / 2, 0);
  fence(d, -w / 2, 0, Math.PI / 2);
  fence(d, w / 2, 0, Math.PI / 2);
  // petits buts
  [-1, 1].forEach((s) => {
    const goal = buildBut({ props: { width: 3, height: 2, depth: 1 } });
    goal.position.set(0, 0.17, s * hd);
    goal.rotation.y = s > 0 ? Math.PI : 0;
    g.add(goal);
  });
  return g;
}

function buildMur(e) {
  const m = mats();
  const h = e.props.height || 1.8;
  const g = new THREE.Group();
  g.add(mesh(polylineWall(e.points, h, 0.4, !!e.props.closed), m.wall));
  // chaperon
  g.add(mesh(polylineWall(e.points.map(([x, z]) => [x, z]), 0.08, 0.5, !!e.props.closed).translate(0, h, 0), m.curb));
  return g;
}

function buildZone(e) {
  const m = mats();
  const g = new THREE.Group();
  g.add(mesh(flatShape(shapeFrom(e.points), 0.025, 5), m.zone, { cast: false }));
  return g;
}

function buildParcelle(e) {
  const m = mats();
  const g = new THREE.Group();
  const culture = e.props.culture || 'gazon';
  const inner = insetPolygon(e.points, 0.25);
  const surfMat = culture === 'potager' ? m.soil : culture === 'terre' ? m.sand : m.grass;
  g.add(mesh(slab(shapeFrom(inner), 0.12, 0, 3), surfMat, { cast: false }));
  // bordure béton blanche (comme sur les vues 3D du dossier)
  const ring = shapeFrom(e.points);
  ring.holes.push(shapeFrom([...inner].reverse()));
  g.add(mesh(slab(ring, 0.22, 0, 1), m.curb));
  if (culture === 'gazon') g.add(grassTufts(inner));
  if (culture === 'potager') {
    // sillons de culture
    const xs = inner.map((p) => p[0]), zs = inner.map((p) => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minZ = Math.min(...zs), maxZ = Math.max(...zs);
    const rows = [];
    const veg = new THREE.MeshStandardMaterial({ color: '#5c8f37', roughness: 0.9 });
    for (let z = minZ + 1; z < maxZ - 0.5; z += 1.2) {
      for (let x = minX + 0.8; x < maxX - 0.5; x += 0.9) {
        if (!pointInPoly(x, z, inner)) continue;
        const s = new THREE.IcosahedronGeometry(0.28, 0);
        s.translate(x, 0.3, z);
        rows.push(s);
      }
    }
    if (rows.length) g.add(mesh(mergeGeometries(rows), veg));
  }
  return g;
}

let tuftGeo = null;
/** Touffes d'herbe instanciées (deux plans croisés) sur une parcelle */
function grassTufts(poly) {
  if (!tuftGeo) {
    const a = new THREE.PlaneGeometry(0.6, 0.32);
    a.translate(0, 0.16, 0);
    const b = a.clone().rotateY(Math.PI / 2);
    tuftGeo = mergeGeometries([a, b]);
  }
  const xs = poly.map((p) => p[0]), zs = poly.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minZ = Math.min(...zs), maxZ = Math.max(...zs);
  const area = (maxX - minX) * (maxZ - minZ);
  const n = Math.min(700, Math.round(area * 0.7));
  const pts = [];
  let seed = Math.abs(Math.round(minX * 131 + minZ * 17)) + 1;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < n * 2 && pts.length < n; i++) {
    const x = minX + rnd() * (maxX - minX), z = minZ + rnd() * (maxZ - minZ);
    if (pointInPoly(x, z, poly)) pts.push([x, z, 0.6 + rnd() * 0.9, rnd() * Math.PI]);
  }
  const im = new THREE.InstancedMesh(tuftGeo, mats().tuft, Math.max(1, pts.length));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const col = new THREE.Color();
  pts.forEach(([x, z, s, r], i) => {
    q.setFromAxisAngle(up, r);
    sc.set(s, s * (0.8 + (s % 0.3)), s);
    p.set(x, 0.1, z);
    im.setMatrixAt(i, m4.compose(p, q, sc));
    im.setColorAt(i, col.setHSL(0.22 + (s % 0.1) * 0.3, 0.3, 0.82 + (s % 0.15)));
  });
  im.count = pts.length;
  im.castShadow = false;
  im.receiveShadow = true;
  return im;
}

function pointInPoly(x, z, pts) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, zi] = pts[i], [xj, zj] = pts[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
  }
  return c;
}

/* ------------------------------ mobilier ---------------------------- */

function buildBut(e) {
  const m = mats();
  const W = e.props?.width || 7.32, H = e.props?.height || 2.44, D = e.props?.depth || 2;
  const g = new THREE.Group();
  const r = W > 5 ? 0.06 : 0.04;
  const post = (x) => {
    const c = new THREE.CylinderGeometry(r, r, H, 10);
    c.translate(x, H / 2, 0);
    g.add(mesh(c, m.white));
  };
  post(-W / 2);
  post(W / 2);
  const bar = new THREE.CylinderGeometry(r, r, W + 2 * r, 10);
  bar.rotateZ(Math.PI / 2);
  bar.translate(0, H, 0);
  g.add(mesh(bar, m.white));
  // filet : dessus, fond, côtés (vers -Z)
  const netPlane = (w, h, x, y, z, rx, ry) => {
    const p = new THREE.PlaneGeometry(w, h);
    const uv = p.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w * 5, uv.getY(i) * h * 5);
    const n = mesh(p, m.net, { cast: true, receive: false });
    n.position.set(x, y, z);
    n.rotation.set(rx, ry, 0);
    g.add(n);
  };
  netPlane(W, D, 0, H, -D / 2, -Math.PI / 2, 0);
  netPlane(W, H, 0, H / 2, -D, 0, 0);
  netPlane(D, H, -W / 2, H / 2, -D / 2, 0, Math.PI / 2);
  netPlane(D, H, W / 2, H / 2, -D / 2, 0, Math.PI / 2);
  return g;
}

function buildBanc() {
  const m = mats();
  const g = new THREE.Group();
  g.add(box(0.18, 0.42, 0.45, m.concrete, -0.75, 0, 0));
  g.add(box(0.18, 0.42, 0.45, m.concrete, 0.75, 0, 0));
  for (let i = 0; i < 3; i++) g.add(box(1.9, 0.05, 0.12, m.wood, 0, 0.42, -0.15 + i * 0.15));
  for (let i = 0; i < 2; i++) {
    const s = box(1.9, 0.1, 0.04, m.wood, 0, -0.05, 0);
    s.position.set(0, 0.65 + i * 0.16, -0.27 - i * 0.025);
    s.rotation.x = -0.15;
    g.add(s);
  }
  g.add(box(0.06, 0.45, 0.06, m.darkMetal, -0.75, 0.42, -0.25));
  g.add(box(0.06, 0.45, 0.06, m.darkMetal, 0.75, 0.42, -0.25));
  return g;
}

function buildLampadaire() {
  const m = mats();
  const g = new THREE.Group();
  g.add(cyl(0.18, 0.22, 0.4, m.concrete, 0, 0, 0, 10));
  g.add(cyl(0.06, 0.09, 5, m.darkMetal, 0, 0.4, 0, 8));
  g.add(box(0.9, 0.06, 0.08, m.darkMetal, 0.35, 5.3, 0));
  const head = cyl(0.25, 0.12, 0.18, m.darkMetal, 0.75, 5.2, 0, 12);
  g.add(head);
  const glow = new THREE.CircleGeometry(0.2, 16);
  glow.rotateX(Math.PI / 2);
  glow.translate(0.75, 5.19, 0);
  const gm = mesh(glow, m.lampGlow, { cast: false });
  gm.userData.lamp = true;
  g.add(gm);
  // panneau solaire autonome
  const p = box(0.9, 0.04, 0.6, m.solar, 0, -0.02, 0);
  p.position.set(0, 5.62, 0);
  p.rotation.x = -0.4;
  g.add(p);
  return g;
}

function buildProjecteur() {
  const m = mats();
  const g = new THREE.Group();
  g.add(cyl(0.45, 0.55, 0.6, m.concrete, 0, 0, 0, 12));
  g.add(cyl(0.12, 0.22, 15, m.metal, 0, 0.6, 0, 10));
  // rampe de 4 projecteurs orientée vers +Z (vers le terrain)
  const rack = new THREE.Group();
  rack.add(box(2.6, 0.12, 0.12, m.darkMetal, 0, 0, 0));
  [-0.95, -0.32, 0.32, 0.95].forEach((x) => {
    const head = new THREE.Group();
    head.add(box(0.55, 0.42, 0.22, m.darkMetal, 0, -0.21, 0));
    const face = new THREE.PlaneGeometry(0.46, 0.34);
    face.translate(0, 0, 0.115);
    const fm = mesh(face, m.lampGlow, { cast: false });
    fm.position.y = 0;
    head.add(fm);
    head.position.set(x, 0, 0.18);
    head.rotation.x = 0.55;
    rack.add(head);
  });
  rack.position.set(0, 15.4, 0.2);
  g.add(rack);
  return g;
}

function buildPoubelle() {
  const m = mats();
  const g = new THREE.Group();
  g.add(cyl(0.28, 0.25, 0.9, m.sign, 0, 0, 0, 14));
  g.add(cyl(0.3, 0.3, 0.06, m.darkMetal, 0, 0.9, 0, 14));
  return g;
}

function buildFontaine() {
  const m = mats();
  const g = new THREE.Group();
  g.add(box(1.4, 0.1, 1, m.concrete));
  g.add(box(0.45, 0.95, 0.45, m.wall, 0, 0.1, 0));
  g.add(box(0.7, 0.12, 0.5, m.concrete, 0, 0.75, 0.15));
  g.add(cyl(0.025, 0.025, 0.25, m.metal, 0, 1.05, 0.1, 8));
  return g;
}

function buildPanneau(e) {
  const m = mats();
  const g = new THREE.Group();
  g.add(box(0.1, 2.2, 0.1, m.darkMetal, -0.9, 0, 0));
  g.add(box(0.1, 2.2, 0.1, m.darkMetal, 0.9, 0, 0));
  g.add(box(2.1, 1.1, 0.06, m.sign, 0, 1.2, 0.05));
  // texte du panneau
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#133d20';
  ctx.fillRect(0, 0, 512, 256);
  ctx.strokeStyle = '#d4b483';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, 492, 236);
  ctx.fillStyle = '#f5ead6';
  ctx.textAlign = 'center';
  ctx.font = '600 44px Georgia, serif';
  ctx.fillText(e.props?.text || 'Site de Sidi Ouaziz', 256, 110);
  ctx.font = '400 24px system-ui, sans-serif';
  ctx.fillStyle = '#d4b483';
  ctx.fillText('Association Palmeraies Tighremt Tata', 256, 170);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const face = new THREE.PlaneGeometry(2, 1);
  face.translate(0, 1.75, 0.085);
  g.add(mesh(face, new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 }), { cast: false }));
  return g;
}

function buildPergola() {
  const m = mats();
  const g = new THREE.Group();
  const W = 6, D = 4, H = 2.8;
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => g.add(box(0.18, H, 0.18, m.wood, (sx * W) / 2, 0, (sz * D) / 2)));
  g.add(box(W + 0.4, 0.18, 0.18, m.wood, 0, H, -D / 2));
  g.add(box(W + 0.4, 0.18, 0.18, m.wood, 0, H, D / 2));
  for (let i = 0; i <= 12; i++) g.add(box(0.1, 0.1, D + 0.6, m.darkWood, -W / 2 + (i / 12) * W, H + 0.18, 0));
  // canisses (ombrage en roseaux)
  const reed = new THREE.MeshStandardMaterial({ color: '#c8b07a', roughness: 1, transparent: true, opacity: 0.92 });
  g.add(box(W + 0.2, 0.03, D + 0.4, reed, 0, H + 0.28, 0));
  // banc sous la pergola
  const b = buildBanc();
  b.position.set(0, 0, -1.2);
  g.add(b);
  return g;
}

function buildTribune() {
  const m = mats();
  const g = new THREE.Group();
  const W = 10;
  for (let i = 0; i < 4; i++) {
    g.add(box(W, 0.45 * (i + 1), 0.8, m.concrete, 0, 0, -i * 0.8));
    g.add(box(W, 0.06, 0.4, m.sign, 0, 0.45 * (i + 1), -i * 0.8 + 0.1));
  }
  return g;
}

function buildPanneauSolaire() {
  const m = mats();
  const g = new THREE.Group();
  [-1, 1].forEach((s) => g.add(box(0.08, 1.2, 0.08, m.metal, s * 1.6, 0, 0.6)));
  [-1, 1].forEach((s) => g.add(box(0.08, 0.6, 0.08, m.metal, s * 1.6, 0, -0.6)));
  const p = new THREE.Group();
  p.add(box(3.4, 0.05, 2, m.solar));
  for (let i = 1; i < 6; i++) p.add(box(0.02, 0.06, 2, m.white, -1.7 + (i * 3.4) / 6, 0, 0));
  p.position.set(0, 0.95, 0);
  p.rotation.x = 0.5;
  g.add(p);
  return g;
}

function buildCiterne() {
  const m = mats();
  const g = new THREE.Group();
  g.add(box(3, 0.2, 3, m.concrete));
  const t = new THREE.CylinderGeometry(1.2, 1.2, 2.6, 24);
  t.translate(0, 1.5, 0);
  g.add(mesh(t, new THREE.MeshStandardMaterial({ color: '#e9e4d8', roughness: 0.5 })));
  g.add(cyl(0.35, 0.35, 0.2, m.sign, 0, 2.8, 0, 16));
  return g;
}

function buildCloture(e) {
  const m = mats();
  const L = e.props?.length || 10, H = e.props?.height || 2;
  const g = new THREE.Group();
  const p = new THREE.PlaneGeometry(L, H);
  const uv = p.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * L * 2, uv.getY(i) * H * 2);
  p.translate(0, H / 2, 0);
  g.add(mesh(p, m.fence, { receive: false }));
  const n = Math.max(1, Math.round(L / 2.5));
  for (let i = 0; i <= n; i++) g.add(cyl(0.04, 0.04, H + 0.1, m.metal, -L / 2 + (i / n) * L, 0, 0, 6));
  return g;
}

function buildMurSegment(e) {
  const m = mats();
  const L = e.props?.length || 10, H = e.props?.height || 1.8;
  const g = new THREE.Group();
  g.add(box(L, H, 0.4, m.wall, 0, 0, 0, 2));
  g.add(box(L + 0.1, 0.08, 0.5, m.curb, 0, H, 0));
  return g;
}

function buildPersonne(e) {
  const m = mats();
  const g = new THREE.Group();
  const cloth = (e.props?.variant || 0) % 2 ? m.cloth2 : m.cloth1;
  g.add(cyl(0.09, 0.08, 0.85, m.darkWood, -0.1, 0, 0, 8));
  g.add(cyl(0.09, 0.08, 0.85, m.darkWood, 0.1, 0, 0, 8));
  const body = new THREE.CapsuleGeometry(0.22, 0.5, 4, 10);
  body.translate(0, 1.2, 0);
  g.add(mesh(body, cloth));
  const head = new THREE.SphereGeometry(0.12, 14, 10);
  head.translate(0, 1.66, 0);
  g.add(mesh(head, m.skin));
  return g;
}

function buildVoiture() {
  const m = mats();
  const g = new THREE.Group();
  g.add(box(4.2, 0.75, 1.75, m.car, 0, 0.3, 0));
  g.add(box(2.3, 0.6, 1.6, m.glass, -0.2, 1.05, 0));
  g.add(box(2.2, 0.08, 1.62, m.car, -0.2, 1.62, 0));
  [[-1.35, -0.85], [1.35, -0.85], [-1.35, 0.85], [1.35, 0.85]].forEach(([x, z]) => {
    const w = new THREE.CylinderGeometry(0.33, 0.33, 0.22, 16);
    w.rotateX(Math.PI / 2);
    w.translate(x, 0.33, z);
    g.add(mesh(w, m.tyre));
  });
  return g;
}

function buildJeux() {
  const m = mats();
  const g = new THREE.Group();
  g.add(box(6, 0.05, 5, new THREE.MeshStandardMaterial({ color: '#b5653f', roughness: 1 })));
  // balançoire
  [-1.6, 1.6].forEach((x) => {
    const a = box(0.08, 2.6, 0.08, m.play, x, 0, -0.6);
    a.rotation.x = 0.25;
    g.add(a);
    const b = box(0.08, 2.6, 0.08, m.play, x, 0, 0.6);
    b.rotation.x = -0.25;
    g.add(b);
  });
  g.add(box(3.4, 0.1, 0.1, m.play, 0, 2.45, 0));
  [-0.6, 0.6].forEach((x) => {
    g.add(box(0.02, 1.8, 0.02, m.metal, x - 0.2, 0.6, 0));
    g.add(box(0.02, 1.8, 0.02, m.metal, x + 0.2, 0.6, 0));
    g.add(box(0.5, 0.05, 0.22, m.darkWood, x, 0.55, 0));
  });
  // toboggan
  const sl = box(0.6, 0.05, 3, m.play, 0, -0.025, 0);
  sl.position.set(0, 0.85, 2.5);
  sl.rotation.x = 0.55;
  g.add(box(1, 1.6, 1, m.wood, 0, 0, 1.2));
  g.add(sl);
  return g;
}

/* --------------------------- registre ----------------------------- */

export const BUILDERS = {
  terrain: buildTerrain,
  allee: buildAllee,
  vestiaire: buildVestiaire,
  bassin: buildBassin,
  puits: buildPuits,
  'local-pompe': buildLocal,
  citystade: buildCityStade,
  mur: buildMur,
  zone: buildZone,
  parcelle: buildParcelle,
  but: buildBut,
  banc: buildBanc,
  lampadaire: buildLampadaire,
  projecteur: buildProjecteur,
  poubelle: buildPoubelle,
  fontaine: buildFontaine,
  panneau: buildPanneau,
  pergola: buildPergola,
  tribune: buildTribune,
  'panneau-solaire': buildPanneauSolaire,
  citerne: buildCiterne,
  cloture: buildCloture,
  'mur-segment': buildMurSegment,
  personne: buildPersonne,
  voiture: buildVoiture,
  jeux: buildJeux,
};

export function buildEntity(e) {
  const fn = BUILDERS[e.type];
  if (!fn) return new THREE.Group();
  return fn(e);
}
