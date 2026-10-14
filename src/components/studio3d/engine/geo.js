import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export { mergeGeometries };

/** UV planaires en mètres (géométrie couchée dans le plan XZ) */
export function planarUV(geo, tile = 4) {
  const pos = geo.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = pos.getX(i) / tile;
    uv[i * 2 + 1] = pos.getZ(i) / tile;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}

/** UV « boîte » : projection selon la normale dominante (murs, volumes) */
export function boxUV(geo, tile = 2) {
  const geom = geo.index ? geo.toNonIndexed() : geo;
  geom.computeVertexNormals();
  const pos = geom.attributes.position, nor = geom.attributes.normal;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const nx = Math.abs(nor.getX(i)), ny = Math.abs(nor.getY(i)), nz = Math.abs(nor.getZ(i));
    let u, v;
    if (ny >= nx && ny >= nz) { u = pos.getX(i); v = pos.getZ(i); }
    else if (nx >= nz) { u = pos.getZ(i); v = pos.getY(i); }
    else { u = pos.getX(i); v = pos.getY(i); }
    uv[i * 2] = u / tile;
    uv[i * 2 + 1] = v / tile;
  }
  geom.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geom;
}

/** Polygone [ [x,z], ... ] → THREE.Shape (repère du shape : y = -z) */
export function shapeFrom(points) {
  const s = new THREE.Shape();
  points.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z)));
  s.closePath();
  return s;
}

/** Surface plane horizontale à partir d'un shape, posée à la hauteur y */
export function flatShape(shape, y = 0, tile = 4) {
  const g = new THREE.ShapeGeometry(shape, 12);
  g.rotateX(-Math.PI / 2);
  g.translate(0, y, 0);
  return planarUV(g, tile);
}

/** Dalle extrudée (épaisseur h) à partir d'un shape, base à y0 */
export function slab(shape, h, y0 = 0, tile = 4) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments: 12 });
  g.rotateX(-Math.PI / 2);
  g.translate(0, y0, 0);
  return boxUV(g, tile);
}

/** Rectangle aux coins arrondis centré (dimensions x × z) */
export function roundedRect(w, d, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -d / 2;
  r = Math.min(r, w / 2, d / 2);
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + d - r);
  s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  s.lineTo(x + r, y + d);
  s.quadraticCurveTo(x, y + d, x, y + d - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** Décale un polygone vers l'intérieur (approximation par bissectrices) */
export function insetPolygon(points, d) {
  const n = points.length;
  // orientation
  let area = 0;
  for (let i = 0; i < n; i++) {
    const [x1, z1] = points[i], [x2, z2] = points[(i + 1) % n];
    area += x1 * z2 - x2 * z1;
  }
  const sign = area > 0 ? 1 : -1;
  return points.map((p, i) => {
    const a = points[(i - 1 + n) % n], b = points[(i + 1) % n];
    const e1 = norm([p[0] - a[0], p[1] - a[1]]);
    const e2 = norm([b[0] - p[0], b[1] - p[1]]);
    const n1 = [-e1[1] * sign, e1[0] * sign];
    const n2 = [-e2[1] * sign, e2[0] * sign];
    const bis = norm([n1[0] + n2[0], n1[1] + n2[1]]);
    const cos = Math.max(0.35, bis[0] * n1[0] + bis[1] * n1[1]);
    return [p[0] + (bis[0] * d) / cos, p[1] + (bis[1] * d) / cos];
  });
}

function norm([x, z]) {
  const l = Math.hypot(x, z) || 1;
  return [x / l, z / l];
}

/** Mur le long d'une polyligne (épaisseur t, hauteur h) */
export function polylineWall(points, h, t, closed = false) {
  const geos = [];
  const n = closed ? points.length : points.length - 1;
  for (let i = 0; i < n; i++) {
    const [x1, z1] = points[i], [x2, z2] = points[(i + 1) % points.length];
    const len = Math.hypot(x2 - x1, z2 - z1);
    const g = new THREE.BoxGeometry(len + t, h, t);
    g.rotateY(-Math.atan2(z2 - z1, x2 - x1));
    g.translate((x1 + x2) / 2, h / 2, (z1 + z2) / 2);
    geos.push(boxUV(g, 2));
  }
  return mergeGeometries(geos);
}

/** Bande au sol entre deux points (lignes de marquage) */
export function lineStrip(a, b, w, y = 0) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const g = new THREE.PlaneGeometry(len, w);
  g.rotateX(-Math.PI / 2);
  g.rotateY(-Math.atan2(b[1] - a[1], b[0] - a[0]));
  g.translate((a[0] + b[0]) / 2, y, (a[1] + b[1]) / 2);
  return g;
}

/** Arc de cercle au sol (marquage) */
export function arcStrip(cx, cz, r, w, start, length, y = 0) {
  const g = new THREE.RingGeometry(r - w / 2, r + w / 2, 64, 1, start, length);
  g.rotateX(-Math.PI / 2);
  g.translate(cx, y, cz);
  return g;
}
