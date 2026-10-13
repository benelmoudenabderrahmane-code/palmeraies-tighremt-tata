import * as THREE from 'three';

/*
 * Éclairage nocturne : un « pool » fixe de lumières est réparti sur les
 * lampadaires et projecteurs les plus proches de la caméra. Le nombre de
 * lumières ne change jamais, ce qui évite de recompiler les shaders quand
 * on ajoute ou supprime des lampadaires.
 */

const LAMP_HEAD = new THREE.Vector3(0.75, 5.1, 0); // tête du lampadaire (repère local)
const FLOOD_HEAD = new THREE.Vector3(0, 15.2, 0.4); // rampe du projecteur
const FLOOD_AIM = new THREE.Vector3(0, 0, 34); // point visé au sol

export class NightLights {
  constructor(scene, { points = 8, spots = 4 } = {}) {
    this.group = new THREE.Group();
    this.group.name = 'eclairage-nocturne';
    this.points = [];
    this.spots = [];
    for (let i = 0; i < points; i++) {
      const l = new THREE.PointLight('#ffc98a', 0, 26, 1.6);
      this.group.add(l);
      this.points.push(l);
    }
    for (let i = 0; i < spots; i++) {
      const s = new THREE.SpotLight('#f4f1ff', 0, 120, 0.6, 0.6, 1.3);
      this.group.add(s, s.target);
      this.spots.push(s);
    }
    scene.add(this.group);
    this.level = 0;
    this._lamps = [];
    this._floods = [];
  }

  /** Mémorise les sources depuis la liste d'entités visibles */
  setSources(entities) {
    this._lamps = [];
    this._floods = [];
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    for (const e of entities) {
      if (e.type !== 'lampadaire' && e.type !== 'projecteur') continue;
      q.setFromAxisAngle(up, e.rotation || 0);
      s.setScalar(e.scale || 1);
      p.set(e.position[0], 0, e.position[1]);
      m.compose(p, q, s);
      if (e.type === 'lampadaire') this._lamps.push(LAMP_HEAD.clone().applyMatrix4(m));
      else this._floods.push({ pos: FLOOD_HEAD.clone().applyMatrix4(m), aim: FLOOD_AIM.clone().applyMatrix4(m) });
    }
    this._dirty = true;
  }

  /** level : 0 = jour (éteint), 1 = nuit noire */
  update(camera, level) {
    const changed = Math.abs(level - this.level) > 0.01;
    this.level = level;
    if (!changed && !this._dirty && level === 0) return;
    this._dirty = false;
    const ref = camera.position;
    const lamps = this._lamps
      .map((p) => ({ p, d: p.distanceToSquared(ref) }))
      .sort((a, b) => a.d - b.d);
    this.points.forEach((l, i) => {
      const src = lamps[i];
      l.visible = true;
      if (src && level > 0) {
        l.position.copy(src.p).y -= 0.3;
        l.intensity = 14 * level;
      } else l.intensity = 0;
    });
    const floods = this._floods
      .map((f) => ({ f, d: f.pos.distanceToSquared(ref) }))
      .sort((a, b) => a.d - b.d);
    this.spots.forEach((sp, i) => {
      const src = floods[i];
      if (src && level > 0) {
        sp.position.copy(src.f.pos);
        sp.target.position.copy(src.f.aim);
        sp.target.updateMatrixWorld();
        sp.intensity = 260 * level;
      } else sp.intensity = 0;
    });
  }
}

/** Ciel étoilé (visible la nuit seulement) */
export function buildStars(count = 2200) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // hémisphère supérieur, rayon 1800 (dans la boîte du ciel)
    const u = Math.random(), v = Math.random() * 0.95 + 0.03;
    const theta = 2 * Math.PI * u, y = v;
    const r = Math.sqrt(1 - y * y);
    pos.set([Math.cos(theta) * r * 1800, y * 1800, Math.sin(theta) * r * 1800], i * 3);
    const b = 0.55 + Math.random() * 0.45;
    const warm = Math.random() > 0.8;
    col.set([b, b * (warm ? 0.9 : 0.97), b * (warm ? 0.8 : 1)], i * 3);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    size: 2.2, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, fog: false,
  });
  const pts = new THREE.Points(geo, mat);
  pts.name = 'etoiles';
  pts.frustumCulled = false;
  pts.renderOrder = -1;
  return pts;
}
