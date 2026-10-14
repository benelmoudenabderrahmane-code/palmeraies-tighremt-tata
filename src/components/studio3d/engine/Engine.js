import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { buildEntity, mats } from './builders';
import { vegetationParts, vegetationMesh, VEG_RADIUS, VEG_HEIGHT, windUniforms } from './vegetation';
import { buildLandscape, buildPalmeraie, buildSky, sunPosition, sunVector } from './environment';
import { PLAN_IMAGE, PX_PER_M, ORIGIN_PX, SITE, siteBounds } from './planData';
import { PostFX } from './postfx';
import { NightLights, buildStars } from './nightlights';
import { installHeightFog, buildClouds } from './atmosphere';
import { buildDesertDetails } from './scatter';

const INSTANCED = new Set(['palmier', 'olivier', 'arbuste']);
// vue d'ensemble par défaut : depuis le sud-est, terrain au centre, montagnes au fond
const HOME = { pos: [165, 62, 175], target: [-12, 0, -18] };

/**
 * Moteur 3D du Studio : scène, rendu, caméras, sélection, gizmo,
 * placement d'objets, mesures et exports. L'état (liste d'entités)
 * est détenu par React ; le moteur le reflète via setEntities().
 */
export class StudioEngine {
  constructor(container, cb = {}) {
    this.container = container;
    this.cb = cb;
    this.entities = new Map(); // id → entité
    this.objects = new Map(); // id → { obj, hash }
    this.instanced = {}; // type → { meshes, ids }
    this.layers = {};
    this.mode = 'apres';
    this.tool = 'select';
    this.view = 'orbit';
    this.selectedId = null;
    this.measures = [];
    this.measureStart = null;
    this.keys = new Set();
    this._last = performance.now();
    this.bounds = siteBounds();
    this.center = new THREE.Vector3((this.bounds.minX + this.bounds.maxX) / 2, 0, (this.bounds.minZ + this.bounds.maxZ) / 2);
    // qualité allégée sur mobile / petites configurations
    this.low = cb.lowQuality ?? (window.innerWidth < 900 || (navigator.hardwareConcurrency || 8) <= 4);
    this._init();
  }

  /* ============================ init ============================== */

  _init() {
    const { container } = this;
    const w = container.clientWidth, h = container.clientHeight;

    const r = (this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: false, powerPreference: 'high-performance' }));
    r.setPixelRatio(Math.min(window.devicePixelRatio, this.low ? 1.25 : 2));
    r.setSize(w, h);
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 0.55;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(r.domElement);
    r.domElement.style.display = 'block';
    r.domElement.style.touchAction = 'none';

    const lr = (this.labelRenderer = new CSS2DRenderer());
    lr.setSize(w, h);
    Object.assign(lr.domElement.style, { position: 'absolute', inset: '0', pointerEvents: 'none' });
    container.appendChild(lr.domElement);

    const scene = (this.scene = new THREE.Scene());
    installHeightFog();
    scene.fog = new THREE.FogExp2('#cfc6b8', 0.00026);

    this.camera = new THREE.PerspectiveCamera(42, w / h, 0.5, 5000);
    this.camera.position.set(HOME.pos[0], HOME.pos[1], HOME.pos[2]);

    const oc = (this.orbit = new OrbitControls(this.camera, r.domElement));
    oc.target.set(HOME.target[0], 0, HOME.target[2]);
    oc.enableDamping = true;
    oc.dampingFactor = 0.08;
    oc.maxPolarAngle = Math.PI / 2 - 0.03;
    oc.minDistance = 4;
    oc.maxDistance = 1400;
    oc.screenSpacePanning = false;
    oc.update();

    // ciel & lumière
    this.sky = buildSky();
    scene.add(this.sky);
    this.clouds = buildClouds();
    scene.add(this.clouds);
    this.hemi = new THREE.HemisphereLight('#cfe3ff', '#8a6a4a', 0.6);
    scene.add(this.hemi);
    const sun = (this.sun = new THREE.DirectionalLight('#fff1dc', 3));
    sun.castShadow = true;
    sun.shadow.mapSize.setScalar(this.low ? 2048 : 4096);
    const sc = sun.shadow.camera;
    sc.left = -190; sc.right = 190; sc.top = 190; sc.bottom = -190;
    sc.near = 10; sc.far = 1200;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.6;
    sun.target.position.copy(this.center);
    scene.add(sun, sun.target);
    this.pmrem = new THREE.PMREMGenerator(r);

    // nuit : étoiles, clair de lune, éclairage public
    this.stars = buildStars(this.low ? 1200 : 2200);
    scene.add(this.stars);
    this.night = new NightLights(scene, this.low ? { points: 4, spots: 2 } : { points: 8, spots: 4 });

    // post-traitement (occlusion ambiante, halo)
    this.fx = new PostFX(r, scene, this.camera, { msaa: this.low ? 0 : 4 });
    this.fx.aoEnabled = !this.low;

    // paysage
    this.envGroup = new THREE.Group();
    this.envGroup.add(buildLandscape(this.center, 240, this.low));
    this.palmeraie = buildPalmeraie(this.center, this.low ? 0.4 : 1);
    this.envGroup.add(this.palmeraie);
    this.envGroup.add(buildDesertDetails(this.center, this.low ? 0.4 : 1));
    scene.add(this.envGroup);
    this.ground = this.envGroup.getObjectByName('sol');

    // calque du plan 2D
    this._buildPlanOverlay();

    // conteneurs
    this.world = new THREE.Group();
    scene.add(this.world);
    this.labels = new THREE.Group();
    scene.add(this.labels);
    this.measureGroup = new THREE.Group();
    scene.add(this.measureGroup);

    // sélection
    this.selBox = new THREE.Box3Helper(new THREE.Box3(), new THREE.Color('#f5c542'));
    this.selBox.visible = false;
    this.selBox.material.depthTest = false;
    this.selBox.renderOrder = 20;
    scene.add(this.selBox);
    const ringGeo = new THREE.RingGeometry(0.92, 1, 48);
    ringGeo.rotateX(-Math.PI / 2);
    this.selRing = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: '#f5c542', transparent: true, opacity: 0.95, depthTest: false }));
    this.selRing.renderOrder = 21;
    this.selRing.visible = false;
    scene.add(this.selRing);

    // gizmo de transformation
    this.proxy = new THREE.Object3D();
    scene.add(this.proxy);
    const tc = (this.transform = new TransformControls(this.camera, r.domElement));
    tc.setSpace('world');
    tc.setTranslationSnap(null);
    tc.size = 0.9;
    this.transformHelper = tc.getHelper();
    scene.add(this.transformHelper);
    tc.addEventListener('dragging-changed', (e) => {
      this.orbit.enabled = !e.value && this.view !== 'walk';
      if (!e.value) this._commitTransform();
    });
    tc.addEventListener('objectChange', () => this._liveTransform());
    this.setTransformMode('translate');

    // aperçu de placement
    this.ghost = null;

    // événements
    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);
    this._ro = new ResizeObserver(this._onResize);
    this._ro.observe(container);
    this._bindPointer();
    this._onKeyDown = (e) => this._key(e, true);
    this._onKeyUp = (e) => this._key(e, false);
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);

    this.setTime(17, 105);
    this._running = true;
    this._loop();
  }

  _buildPlanOverlay() {
    const wM = PLAN_IMAGE.widthPx / PX_PER_M, hM = PLAN_IMAGE.heightPx / PX_PER_M;
    const geo = new THREE.PlaneGeometry(wM, hM);
    geo.rotateX(-Math.PI / 2);
    // centre de l'image en mètres par rapport à l'origine
    const cx = (PLAN_IMAGE.widthPx / 2 - ORIGIN_PX[0]) / PX_PER_M;
    const cz = (PLAN_IMAGE.heightPx / 2 - ORIGIN_PX[1]) / PX_PER_M;
    geo.translate(cx, 0.4, cz);
    const tex = new THREE.TextureLoader().load(PLAN_IMAGE.src);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    this.planOverlay = new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.9, depthWrite: false, toneMapped: false })
    );
    this.planOverlay.renderOrder = 5;
    this.planOverlay.visible = false;
    this.scene.add(this.planOverlay);
  }

  /* ========================== entités ============================= */

  setEntities(list) {
    if (this._live && this._lastList && list !== this._lastList) this.exitPhotoreal('Projet modifié : mode photoréaliste désactivé.');
    this._lastList = list;
    const next = new Map(list.map((e) => [e.id, e]));
    let vegDirty = false;
    // suppressions
    for (const [id, rec] of this.objects) {
      if (!next.has(id)) {
        this.world.remove(rec.obj);
        disposeTree(rec.obj);
        this.objects.delete(id);
        this._removeLabel(id);
      }
    }
    for (const [id, e] of this.entities) if (!next.has(id) && INSTANCED.has(e.type)) vegDirty = true;
    // ajouts / modifications
    for (const e of list) {
      if (INSTANCED.has(e.type)) {
        const prev = this.entities.get(e.id);
        if (prev !== e) vegDirty = true;
        continue;
      }
      const geomHash = JSON.stringify([e.type, e.props, e.points]);
      const rec = this.objects.get(e.id);
      if (!rec || rec.hash !== geomHash) {
        if (rec) {
          this.world.remove(rec.obj);
          disposeTree(rec.obj);
        }
        const obj = buildEntity(e);
        obj.userData.entityId = e.id;
        obj.traverse((o) => (o.userData.entityId = e.id));
        this.world.add(obj);
        this.objects.set(e.id, { obj, hash: geomHash });
      }
      const { obj } = this.objects.get(e.id);
      applyTransform(obj, e);
      this._syncLabel(e);
    }
    this.entities = next;
    this._refreshLightSources();
    if (vegDirty) this._rebuildVegetation();
    this._applyVisibility();
    if (this.selectedId && !this.entities.has(this.selectedId)) this.select(null);
    else this._updateSelectionHelpers();
  }

  _rebuildVegetation() {
    const parts = vegetationParts();
    const byType = {};
    for (const e of this.entities.values()) if (INSTANCED.has(e.type)) (byType[e.type] ||= []).push(e);
    for (const type of INSTANCED) {
      const list = (byType[type] || []).filter((e) => this._isVisible(e));
      let rec = this.instanced[type];
      const need = Math.max(list.length, 1);
      if (!rec || rec.capacity < need) {
        if (rec) rec.meshes.forEach((m) => { this.world.remove(m); m.dispose(); });
        const capacity = Math.ceil(need * 1.5) + 16;
        const meshes = parts[type].map((p) => {
          const im = new THREE.InstancedMesh(p.geo, p.mat, capacity);
          im.castShadow = true;
          im.receiveShadow = true;
          im.userData.instancedType = type;
          im.frustumCulled = false;
          this.world.add(im);
          return im;
        });
        rec = this.instanced[type] = { meshes, capacity, ids: [] };
      }
      rec.ids = list.map((e) => e.id);
      list.forEach((e, i) => this._setInstance(type, i, e));
      rec.meshes.forEach((m) => {
        m.count = list.length;
        m.instanceMatrix.needsUpdate = true;
        m.computeBoundingSphere();
      });
    }
  }

  _setInstance(type, i, e, matrix) {
    const rec = this.instanced[type];
    const m4 = matrix || composeMatrix(e);
    rec.meshes.forEach((m) => m.setMatrixAt(i, m4));
  }

  /* ======================== visibilité ============================ */

  setLayers(layers) {
    if (this._live) this.exitPhotoreal('Calques modifiés : mode photoréaliste désactivé.');
    this.layers = { ...layers };
    this.planOverlay.visible = !!layers.plan2d;
    this.envGroup.visible = layers.environnement !== false;
    this.labels.visible = layers.annotations !== false;
    this.measureGroup.visible = layers.annotations !== false;
    this._applyVisibility();
    this._rebuildVegetation();
  }

  setPlanOpacity(v) {
    this.planOverlay.material.opacity = v;
  }

  setMode(mode) {
    if (this._live && mode !== this.mode) this.exitPhotoreal('Mode avant / après changé : mode photoréaliste désactivé.');
    this.mode = mode;
    this._applyVisibility();
    this._rebuildVegetation();
  }

  _isVisible(e) {
    if (this.layers[e.layer] === false) return false;
    if (this.mode === 'avant' && e.status !== 'existant') return false;
    return true;
  }

  _refreshLightSources() {
    this.night?.setSources([...this.entities.values()].filter((e) => this._isVisible(e)));
  }

  /** Qualité « haute » (occlusion ambiante, MSAA) ou « rapide » */
  setQuality(high) {
    this.fx.aoEnabled = !!high;
  }

  _applyVisibility() {
    this._refreshLightSources();
    for (const [id, rec] of this.objects) {
      const e = this.entities.get(id);
      rec.obj.visible = !!e && this._isVisible(e);
      const lbl = this.labelMap?.get(id);
      if (lbl) lbl.visible = rec.obj.visible;
    }
    this._updateSelectionHelpers();
  }

  /* ========================== étiquettes ========================== */

  _syncLabel(e) {
    this.labelMap ||= new Map();
    const want = e.label !== false && LABELLED.has(e.type);
    let l = this.labelMap.get(e.id);
    if (!want) {
      if (l) this._removeLabel(e.id);
      return;
    }
    const text = shortName(e);
    if (!l) {
      const div = document.createElement('div');
      div.className = 'studio3d-label';
      l = new CSS2DObject(div);
      this.labels.add(l);
      this.labelMap.set(e.id, l);
    }
    l.element.textContent = text;
    l.element.dataset.status = e.status;
    const y = LABEL_HEIGHT[e.type] ?? 4;
    const c = e.points ? polyCentroid(e.points) : [0, 0];
    l.position.set(e.position[0] + c[0], y, e.position[1] + c[1]);
  }

  _removeLabel(id) {
    const l = this.labelMap?.get(id);
    if (l) {
      this.labels.remove(l);
      l.element.remove();
      this.labelMap.delete(id);
    }
  }

  /* ========================== sélection =========================== */

  select(id) {
    this.selectedId = id;
    this.transform.detach();
    const e = id && this.entities.get(id);
    if (e && !e.locked && this.tool === 'select' && this.view !== 'walk') {
      this._placeProxy(e);
      this.transform.attach(this.proxy);
    }
    this._updateSelectionHelpers();
  }

  _placeProxy(e) {
    const c = e.points ? [0, 0] : [0, 0];
    this.proxy.position.set(e.position[0] + c[0], 0, e.position[1] + c[1]);
    this.proxy.rotation.set(0, e.rotation || 0, 0);
    this.proxy.scale.setScalar(e.scale || 1);
  }

  _updateSelectionHelpers() {
    const e = this.selectedId && this.entities.get(this.selectedId);
    this.selBox.visible = false;
    this.selRing.visible = false;
    if (!e || !this._isVisible(e)) return;
    if (INSTANCED.has(e.type)) {
      const r = (VEG_RADIUS[e.type] || 2) * (e.scale || 1);
      this.selRing.position.set(e.position[0], 0.15, e.position[1]);
      this.selRing.scale.setScalar(r);
      this.selRing.visible = true;
      const h = (VEG_HEIGHT[e.type] || 3) * (e.scale || 1);
      this.selBox.box.set(new THREE.Vector3(e.position[0] - r, 0, e.position[1] - r), new THREE.Vector3(e.position[0] + r, h, e.position[1] + r));
      this.selBox.visible = true;
      return;
    }
    const rec = this.objects.get(e.id);
    if (!rec) return;
    rec.obj.updateMatrixWorld(true);
    this.selBox.box.setFromObject(rec.obj);
    this.selBox.box.max.y = Math.max(this.selBox.box.max.y, 0.6);
    this.selBox.visible = true;
  }

  setTransformMode(mode) {
    this.transformMode = mode;
    const tc = this.transform;
    tc.setMode(mode);
    tc.showX = mode !== 'rotate';
    tc.showZ = mode !== 'rotate';
    tc.showY = mode !== 'translate';
    if (mode === 'rotate') tc.showY = true;
    if (mode === 'scale') { tc.showX = tc.showY = tc.showZ = true; }
  }

  setSnap(on) {
    this.transform.setTranslationSnap(on ? 1 : null);
    this.transform.setRotationSnap(on ? THREE.MathUtils.degToRad(15) : null);
  }

  _liveTransform() {
    const e = this.entities.get(this.selectedId);
    if (!e) return;
    const p = this.proxy;
    if (this.transformMode === 'scale') {
      const s = THREE.MathUtils.clamp((p.scale.x + p.scale.y + p.scale.z) / 3, 0.2, 6);
      p.scale.setScalar(s);
    }
    p.position.y = 0;
    const live = { ...e, position: [p.position.x, p.position.z], rotation: p.rotation.y, scale: p.scale.x };
    if (INSTANCED.has(e.type)) {
      const rec = this.instanced[e.type];
      const i = rec.ids.indexOf(e.id);
      if (i >= 0) {
        this._setInstance(e.type, i, live);
        rec.meshes.forEach((m) => (m.instanceMatrix.needsUpdate = true));
      }
    } else {
      const rec = this.objects.get(e.id);
      if (rec) applyTransform(rec.obj, live);
    }
    this._liveEntity = live;
    this._updateSelectionHelpersLive(live);
  }

  _updateSelectionHelpersLive(live) {
    if (INSTANCED.has(live.type)) {
      this.selRing.position.set(live.position[0], 0.15, live.position[1]);
      this.selRing.scale.setScalar((VEG_RADIUS[live.type] || 2) * live.scale);
      this.selBox.visible = false;
    } else {
      const rec = this.objects.get(live.id);
      if (rec) {
        rec.obj.updateMatrixWorld(true);
        this.selBox.box.setFromObject(rec.obj);
      }
    }
  }

  _commitTransform() {
    const live = this._liveEntity;
    this._liveEntity = null;
    if (!live) return;
    this.cb.onTransform?.(live.id, {
      position: [round(live.position[0]), round(live.position[1])],
      rotation: round(live.rotation, 4),
      scale: round(live.scale, 3),
    });
  }

  /* ============================ outils ============================ */

  setTool(tool) {
    this.tool = tool;
    if (this.ghost) {
      this.scene.remove(this.ghost);
      // géométries partagées (végétation) : on ne libère que les matériaux clonés
      this.ghost.traverse((o) => o.isMesh && o.material.dispose());
      this.ghost = null;
    }
    if (tool.startsWith('place:')) {
      this.transform.detach();
      const type = tool.slice(6);
      const g = INSTANCED.has(type) ? vegetationMesh(type) : buildEntity(this.cb.ghostEntity?.(type) || { type, props: {} });
      g.traverse((o) => {
        if (o.isMesh) {
          o.material = o.material.clone();
          o.material.transparent = true;
          o.material.opacity = 0.55;
          o.castShadow = false;
        }
      });
      g.visible = false;
      this.ghost = g;
      this.scene.add(g);
    }
    if (tool !== 'measure') this.measureStart = null;
    this.renderer.domElement.style.cursor = tool === 'select' ? 'default' : 'crosshair';
    if (tool === 'select') this.select(this.selectedId);
  }

  clearMeasures() {
    this.measures = [];
    this.measureStart = null;
    this.measureGroup.children.slice().forEach((c) => {
      if (c.element) c.element.remove();
      this.measureGroup.remove(c);
      c.geometry?.dispose();
    });
    this.cb.onMeasures?.([]);
  }

  _addMeasure(a, b) {
    const d = a.distanceTo(b);
    const geo = new THREE.BufferGeometry().setFromPoints([a.clone().setY(0.35), b.clone().setY(0.35)]);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: '#f5c542', depthTest: false }));
    line.renderOrder = 30;
    this.measureGroup.add(line);
    [a, b].forEach((p) => {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8), new THREE.MeshBasicMaterial({ color: '#f5c542', depthTest: false }));
      dot.position.copy(p).setY(0.35);
      dot.renderOrder = 31;
      this.measureGroup.add(dot);
    });
    const div = document.createElement('div');
    div.className = 'studio3d-measure';
    div.textContent = `${d.toFixed(2)} m`;
    const lbl = new CSS2DObject(div);
    lbl.position.copy(a).add(b).multiplyScalar(0.5).setY(1.2);
    this.measureGroup.add(lbl);
    this.measures.push({ a: [round(a.x), round(a.z)], b: [round(b.x), round(b.z)], d: round(d) });
    this.cb.onMeasures?.(this.measures.slice());
  }

  /* ========================== pointeur ============================ */

  _bindPointer() {
    const el = this.renderer.domElement;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    let down = null;
    this._pd = (ev) => {
      down = { x: ev.clientX, y: ev.clientY, t: performance.now() };
      if (this.view === 'walk') {
        this._look = { x: ev.clientX, y: ev.clientY };
        el.setPointerCapture(ev.pointerId);
      }
    };
    this._pm = (ev) => {
      this._setPointer(ev);
      if (this.view === 'walk' && this._look) {
        this.walkYaw -= (ev.clientX - this._look.x) * 0.0035;
        this.walkPitch = THREE.MathUtils.clamp(this.walkPitch - (ev.clientY - this._look.y) * 0.0035, -1.2, 1.2);
        this._look = { x: ev.clientX, y: ev.clientY };
      }
      if (this.ghost) {
        const p = this._groundPoint();
        if (p) {
          this.ghost.visible = true;
          this.ghost.position.set(p.x, 0, p.z);
          if (this._snap) this.ghost.position.set(Math.round(p.x), 0, Math.round(p.z));
        }
      }
      if (this.tool === 'measure' && this.measureStart) {
        const p = this._groundPoint();
        if (p) this.cb.onMeasurePreview?.(round(this.measureStart.distanceTo(p)));
      }
    };
    this._pu = (ev) => {
      this._look = null;
      if (!down) return;
      const moved = Math.hypot(ev.clientX - down.x, ev.clientY - down.y);
      down = null;
      if (moved > 5 || ev.button !== 0) return;
      if (this.transform.dragging) return;
      this._setPointer(ev);
      this._click(ev);
    };
    el.addEventListener('pointerdown', this._pd);
    el.addEventListener('pointermove', this._pm);
    el.addEventListener('pointerup', this._pu);
  }

  _setPointer(ev) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  }

  _groundPoint() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const p = new THREE.Vector3();
    return this.raycaster.ray.intersectPlane(this.groundPlane, p) ? p : null;
  }

  _pick() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.world.children, true);
    for (const h of hits) {
      if (!h.object.visible) continue;
      let o = h.object, visible = true;
      while (o) { if (!o.visible) { visible = false; break; } o = o.parent; }
      if (!visible) continue;
      if (h.object.isInstancedMesh && h.object.userData.instancedType) {
        const rec = this.instanced[h.object.userData.instancedType];
        const id = rec?.ids[h.instanceId];
        if (id) return id;
        continue;
      }
      if (h.object.userData.entityId) return h.object.userData.entityId;
    }
    return null;
  }

  _click(ev) {
    if (this.view === 'walk' || this._live) return;
    if (this.tool.startsWith('place:')) {
      const p = this._groundPoint();
      if (!p) return;
      const pos = this._snap ? [Math.round(p.x), Math.round(p.z)] : [round(p.x), round(p.z)];
      this.cb.onPlace?.(this.tool.slice(6), pos, ev.shiftKey);
      return;
    }
    if (this.tool === 'measure') {
      const p = this._groundPoint();
      if (!p) return;
      if (!this.measureStart) this.measureStart = p;
      else {
        this._addMeasure(this.measureStart, p);
        this.measureStart = null;
        this.cb.onMeasurePreview?.(null);
      }
      return;
    }
    const id = this._pick();
    this.cb.onSelect?.(id);
  }

  setSnapPlacement(on) {
    this._snap = on;
    this.setSnap(on);
  }

  /* =========================== clavier ============================ */

  _key(e, down) {
    const tag = (e.target?.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    const k = e.key.toLowerCase();
    if (down) this.keys.add(k);
    else this.keys.delete(k);
  }

  /* =========================== caméras ============================ */

  setView(view) {
    const prev = this.view;
    this.view = view;
    this.stopTour();
    this.orbit.enabled = view !== 'walk';
    this.transform.enabled = view !== 'walk';
    if (view === 'walk') {
      this.transform.detach();
      const t = this.orbit.target;
      const start = prev === 'walk' ? this.camera.position.clone() : new THREE.Vector3(t.x - 20, 1.7, t.z + 70);
      this.camera.position.set(start.x, 1.7, start.z);
      this.walkYaw = Math.atan2(-(t.x - start.x), -(t.z - start.z));
      this.walkPitch = 0;
      this.camera.fov = 60;
    } else if (view === 'top') {
      this.camera.fov = 30;
      const c = this.center;
      this._animateCamera(new THREE.Vector3(c.x, 620, c.z + 0.01), new THREE.Vector3(c.x, 0, c.z));
      this.orbit.enableRotate = false;
    } else {
      this.camera.fov = 42;
      this.orbit.enableRotate = true;
      if (prev !== 'orbit') this.resetCamera();
    }
    this.camera.updateProjectionMatrix();
    if (view !== 'walk') this.select(this.selectedId);
  }

  resetCamera() {
    this._animateCamera(new THREE.Vector3(...HOME.pos), new THREE.Vector3(...HOME.target));
  }

  focus(id) {
    const e = this.entities.get(id);
    if (!e) return;
    let center, size;
    if (INSTANCED.has(e.type)) {
      center = new THREE.Vector3(e.position[0], 3, e.position[1]);
      size = 14;
    } else {
      const rec = this.objects.get(id);
      const b = new THREE.Box3().setFromObject(rec.obj);
      center = b.getCenter(new THREE.Vector3());
      size = Math.max(10, b.getSize(new THREE.Vector3()).length());
    }
    if (this.view === 'walk') this.setView('orbit');
    const dir = this.camera.position.clone().sub(this.orbit.target).normalize();
    if (this.view === 'top') dir.set(0, 1, 0.0001);
    this._animateCamera(center.clone().add(dir.multiplyScalar(size * 1.4)), center);
  }

  _animateCamera(pos, target, dur = 1.1) {
    this._camAnim = {
      p0: this.camera.position.clone(), t0: this.orbit.target.clone(),
      p1: pos, t1: target, start: performance.now(), dur: dur * 1000,
    };
  }

  /* ======================= visite guidée ========================== */

  startTour(onEnd) {
    if (this.view === 'walk') this.setView('orbit');
    const c = this.center;
    const pts = [
      [190, 120, 230], [60, 45, 120], [-40, 18, 70], [-95, 10, 20], [-120, 30, -60],
      [-60, 60, -170], [60, 90, -200], [150, 80, -60], [190, 120, 230],
    ].map(([x, y, z]) => new THREE.Vector3(c.x + x, y, c.z + z));
    const looks = [
      [0, 0, 0], [0, 0, 30], [-40, 3, 40], [-75, 2, 20], [-60, 2, -40],
      [-20, 2, -120], [20, 0, -160], [0, 0, -40], [0, 0, 0],
    ].map(([x, y, z]) => new THREE.Vector3(c.x + x, y, c.z + z));
    this.tour = {
      path: new THREE.CatmullRomCurve3(pts, true, 'centripetal'),
      look: new THREE.CatmullRomCurve3(looks, true, 'centripetal'),
      start: performance.now(), dur: 48000, onEnd,
    };
    this.orbit.enabled = false;
    this.transform.detach();
  }

  stopTour() {
    if (!this.tour) return;
    const cb = this.tour.onEnd;
    this.tour = null;
    this.orbit.enabled = this.view !== 'walk';
    cb?.();
  }

  /* ========================== soleil ============================== */

  setTime(hour, dayOfYear = this.dayOfYear ?? 105) {
    if (this._live && !this._recording) {
      clearTimeout(this._liveLightT);
      this._liveLightT = setTimeout(() => this._live?.refreshLighting(), 250);
    }
    this.hour = hour;
    this.dayOfYear = dayOfYear;
    const sp = sunPosition(SITE.lat, SITE.lon, dayOfYear, hour);
    const dir = sunVector(sp);
    const elev = sp.elevation;
    const day = THREE.MathUtils.smoothstep(elev, -0.08, 0.25);
    const golden = 1 - THREE.MathUtils.smoothstep(elev, 0.05, 0.6);
    this._day = day;
    this._golden = golden * day;

    this.sky.material.uniforms.sunPosition.value.copy(dir);
    this.sky.material.uniforms.rayleigh.value = 0.8 + golden * 1.6;
    this.sky.material.uniforms.turbidity.value = 2.5 + golden * 4;

    const lightDir = dir.clone();
    if (lightDir.y < 0.06) lightDir.y = 0.06;
    this.sun.position.copy(this.center).add(lightDir.normalize().multiplyScalar(500));
    this.sun.target.position.copy(this.center);
    this.sun.intensity = 3.4 * day;
    this.sun.color.set('#fff3e0').lerp(new THREE.Color('#ff9a52'), golden * 0.8);
    this.hemi.intensity = 0.15 + 0.55 * day;
    this.hemi.color.set('#cfe3ff').lerp(new THREE.Color('#2a3a66'), 1 - day);
    this.renderer.toneMappingExposure = 0.35 + 0.25 * day;
    // brume aérienne : gris-beige poussiéreux le jour, dorée au couchant
    const fogCol = new THREE.Color('#cfc6b8').lerp(new THREE.Color('#e9b088'), golden * 0.6).lerp(new THREE.Color('#1a2034'), 1 - day);
    this.scene.fog.color.copy(fogCol);
    this.scene.fog.density = 0.00026 + golden * 0.0001;
    this.clouds.update(dir, day, golden * day);
    // nuit : clair de lune, étoiles, éclairage public, halo
    const night = 1 - THREE.MathUtils.smoothstep(elev, -0.12, 0.04);
    this._nightLevel = night;
    if (day < 0.25) {
      const moon = new THREE.Vector3(0.45, 0.7, -0.55).normalize();
      this.sun.position.copy(this.center).add(moon.multiplyScalar(500));
      this.sun.intensity = 0.7 * night;
      this.sun.color.set('#9fb6ff');
    }
    this.hemi.intensity = Math.max(this.hemi.intensity, 0.3);
    this.stars.material.opacity = night;
    this.stars.visible = night > 0.01;
    const lit = THREE.MathUtils.smoothstep(night, 0.1, 0.6);
    mats().lampGlow.emissiveIntensity = 0.2 + lit * 6;
    mats().windowGlow.emissiveIntensity = lit * 1.6;
    this.fx.bloomEnabled = lit > 0.05;
    this._lightsLevel = lit;
    if (night > 0.5) this.renderer.toneMappingExposure = 0.55;
    this._envDirty = true;
    return { elevation: THREE.MathUtils.radToDeg(elev), azimuth: THREE.MathUtils.radToDeg(sp.azimuth) };
  }

  _updateEnvironment() {
    // Reflets d'ambiance : dôme en dégradé (ciel / horizon / sol) teinté
    // selon l'heure. Plus robuste qu'un rendu du shader Sky (NaN sur
    // certains GPU) et très peu coûteux.
    if (!this._envScene) {
      this._envScene = new THREE.Scene();
      const geo = new THREE.SphereGeometry(100, 48, 24);
      geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 3), 3));
      this._envDome = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide }));
      this._envScene.add(this._envDome);
      this._envSunSpot = new THREE.Mesh(new THREE.SphereGeometry(9, 16, 8), new THREE.MeshBasicMaterial({ color: '#fff' }));
      this._envScene.add(this._envSunSpot);
    }
    const day = this._day ?? 1, golden = this._golden ?? 0;
    const zenith = new THREE.Color('#3f7fc8').lerp(new THREE.Color('#0b1430'), 1 - day);
    const horizon = new THREE.Color('#d8e4ee').lerp(new THREE.Color('#f2a66b'), golden * 0.8).lerp(new THREE.Color('#1a2038'), 1 - day);
    const groundC = new THREE.Color('#9a7552').lerp(new THREE.Color('#1b1611'), 1 - day);
    const pos = this._envDome.geometry.attributes.position, col = this._envDome.geometry.attributes.color;
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 100;
      if (y >= 0) c.copy(horizon).lerp(zenith, Math.pow(y, 0.6));
      else c.copy(horizon).lerp(groundC, Math.min(1, -y * 4));
      col.setXYZ(i, c.r, c.g, c.b);
    }
    col.needsUpdate = true;
    const sd = this.sky.material.uniforms.sunPosition.value;
    this._envSunSpot.position.copy(sd).normalize().multiplyScalar(80);
    this._envSunSpot.material.color.setRGB(1, 0.9, 0.75).multiplyScalar(2 + 6 * day);
    this._envSunSpot.visible = sd.y > -0.05;
    const rt = this.pmrem.fromScene(this._envScene, 0.02, 0.1, 400);
    this._envRT?.dispose();
    this._envRT = rt;
    this.scene.environment = rt.texture;
    this.scene.environmentIntensity = 0.6;
  }

  /* ============================ boucle ============================ */

  /** Suspend l'affichage 3D (libère la carte graphique pour la compression vidéo) */
  setPaused(v) {
    this._paused = !!v;
  }

  _loop() {
    if (!this._running) return;
    this._raf = requestAnimationFrame(() => this._loop());
    if (this._offline || this._paused) return; // rendu vidéo ou compression en cours
    const now = performance.now();
    const dt = Math.min((now - this._last) / 1000, 0.1);
    this._last = now;

    if (this._envDirty && (!this._envT || now - this._envT > 250)) {
      this._envDirty = false;
      this._envT = now;
      this._updateEnvironment();
    }

    if (this._recording) {
      // caméra pilotée par l'enregistrement vidéo
    } else if (this.tour) {
      const t = ((now - this.tour.start) % this.tour.dur) / this.tour.dur;
      this.camera.position.copy(this.tour.path.getPointAt(t));
      this.camera.lookAt(this.tour.look.getPointAt(t));
      if (now - this.tour.start > this.tour.dur) this.stopTour();
    } else if (this._camAnim) {
      const a = this._camAnim;
      let k = Math.min(1, (now - a.start) / a.dur);
      k = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      this.camera.position.lerpVectors(a.p0, a.p1, k);
      this.orbit.target.lerpVectors(a.t0, a.t1, k);
      if (k >= 1) this._camAnim = null;
      this.orbit.update();
    } else if (this.view === 'walk') {
      const speed = (this.keys.has('shift') ? 14 : 5) * dt;
      const fwd = new THREE.Vector3(-Math.sin(this.walkYaw), 0, -Math.cos(this.walkYaw));
      const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
      const k = this.keys;
      if (k.has('z') || k.has('w') || k.has('arrowup')) this.camera.position.addScaledVector(fwd, speed);
      if (k.has('s') || k.has('arrowdown')) this.camera.position.addScaledVector(fwd, -speed);
      if (k.has('q') || k.has('a') || k.has('arrowleft')) this.camera.position.addScaledVector(right, -speed);
      if (k.has('d') || k.has('arrowright')) this.camera.position.addScaledVector(right, speed);
      if (this._walkJoy) {
        this.camera.position.addScaledVector(fwd, this._walkJoy.y * speed);
        this.camera.position.addScaledVector(right, this._walkJoy.x * speed);
      }
      this.camera.position.y = 1.7;
      this.camera.rotation.set(this.walkPitch, this.walkYaw, 0, 'YXZ');
    } else {
      this.orbit.update();
    }

    windUniforms.uTime.value = now / 1000;

    // eau animée (deux directions de houle)
    const w = mats().water;
    if (w.normalMap) { w.normalMap.offset.set((now * 0.000018) % 1, (now * 0.000011) % 1); }
    if (w.map) { w.map.offset.set((-now * 0.000009) % 1, (now * 0.000014) % 1); }

    // éclairage nocturne (réparti sur les sources proches de la caméra)
    if (!this._lightT || now - this._lightT > 300) {
      this._lightT = now;
      this.night.update(this.camera, this._lightsLevel || 0);
    }
    this.stars.position.copy(this.camera.position);
    this.clouds.uniforms.uTime.value = now / 1000;

    // taille du gizmo de sélection au sol
    if (this._recording) this._recordFrame(now);
    else if (this._live) {
      this._live.render();
      this.labelRenderer.render(this.scene, this.camera);
    } else {
      this.fx.render();
      this.labelRenderer.render(this.scene, this.camera);
    }
  }

  setWalkJoystick(v) {
    this._walkJoy = v;
  }

  resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    if (!w || !h || this._recording) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.labelRenderer.setSize(w, h);
    const s = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    this.fx.setSize(s.x, s.y);
  }

  /* ============================ exports =========================== */

  /** Capture HD : rendu à la taille demandée → canvas (copie) */
  renderToCanvas(width = 3840, height = 2160) {
    this.exitPhotoreal();
    const r = this.renderer;
    const prevSize = r.getSize(new THREE.Vector2());
    const prevRatio = r.getPixelRatio();
    const helpers = [this.selBox, this.selRing, this.transformHelper, this.measureGroup, this.ghost].filter(Boolean);
    const vis = helpers.map((h) => h.visible);
    helpers.forEach((h) => (h.visible = false));
    r.setPixelRatio(1);
    r.setSize(width, height, false);
    this.fx.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.night.update(this.camera, this._lightsLevel || 0);
    this.fx.render();
    const out = document.createElement('canvas');
    out.width = width;
    out.height = height;
    out.getContext('2d').drawImage(r.domElement, 0, 0);
    r.setPixelRatio(prevRatio);
    r.setSize(prevSize.x, prevSize.y);
    const s = r.getDrawingBufferSize(new THREE.Vector2());
    this.fx.setSize(s.x, s.y);
    this.camera.aspect = prevSize.x / prevSize.y;
    this.camera.updateProjectionMatrix();
    helpers.forEach((h, i) => (h.visible = vis[i]));
    return out;
  }

  screenshot(width = 3840, height = 2160) {
    return this.renderToCanvas(width, height).toDataURL('image/png');
  }

  /* ===================== photoréaliste en direct ================== */

  async enterPhotoreal() {
    if (this._live || this._liveLoading) return;
    this._liveLoading = true;
    this.stopTour();
    this.transform.detach();
    this.selBox.visible = false;
    this.selRing.visible = false;
    try {
      const { createLivePhotoreal } = await import('./photoreal');
      this._live = await createLivePhotoreal(this);
    } finally {
      this._liveLoading = false;
    }
  }

  exitPhotoreal(reason) {
    if (!this._live) return;
    this._live.dispose();
    this._live = null;
    this.select(this.selectedId);
    this.cb.onPhotorealExit?.(reason);
  }

  get photorealSamples() {
    return this._live ? this._live.samples : null;
  }

  /* ========================== présentation ======================== */

  _snapshotState() {
    return {
      pos: this.camera.position.clone(), target: this.orbit.target.clone(), fov: this.camera.fov,
      hour: this.hour, day: this.dayOfYear, mode: this.mode, labels: this.labels.visible,
    };
  }

  _restoreState(st) {
    if (st.mode !== this.mode) this.setMode(st.mode);
    this.setTime(st.hour, st.day);
    this._updateEnvironment();
    this.camera.position.copy(st.pos);
    this.orbit.target.copy(st.target);
    this.camera.fov = st.fov;
    this.camera.updateProjectionMatrix();
    this.labels.visible = st.labels;
    this.orbit.update();
    this._lightT = 0;
  }

  /** Rendu d'une vue fixe (caméra, heure, avant/après) → canvas */
  renderStill({ pos, target, hour, mode, fov = 42, width = 3840, height = 2160 }) {
    this.stopTour();
    this._camAnim = null;
    const st = this._snapshotState();
    if (mode && mode !== this.mode) this.setMode(mode);
    this.setTime(hour ?? this.hour, this.dayOfYear);
    this._updateEnvironment();
    this.camera.fov = fov;
    this.camera.position.set(...pos);
    this.camera.lookAt(new THREE.Vector3(...target));
    this.camera.updateMatrixWorld();
    // les ombres suivent le soleil : la carte d'ombre est recalculée au rendu
    const canvas = this.renderToCanvas(width, height);
    this._restoreState(st);
    return canvas;
  }

  /**
   * Rendu photoréaliste (tracé de chemins) d'une vue fixe → canvas.
   * Beaucoup plus lent que renderStill, mais lumière physiquement juste.
   */
  async renderStillPhotoreal({ pos, target, hour, mode, fov = 42, width = 3840, height = 2160, samples = 128, onProgress, isCancelled, debug }) {
    this.exitPhotoreal();
    const { renderPhotoreal } = await import('./photoreal');
    this.stopTour();
    this._camAnim = null;
    const st = this._snapshotState();
    const r = this.renderer;
    const prevSize = r.getSize(new THREE.Vector2());
    const prevRatio = r.getPixelRatio();
    this._offline = true;
    try {
      if (mode && mode !== this.mode) this.setMode(mode);
      this.setTime(hour ?? this.hour, this.dayOfYear);
      this.camera.fov = fov;
      this.camera.position.set(...pos);
      this.camera.lookAt(new THREE.Vector3(...target));
      this.camera.updateMatrixWorld();
      this.night.update(this.camera, this._lightsLevel || 0);
      return await renderPhotoreal(this, { width, height, samples, onProgress, isCancelled, debug });
    } finally {
      r.setPixelRatio(prevRatio);
      r.setSize(prevSize.x, prevSize.y);
      const s = r.getDrawingBufferSize(new THREE.Vector2());
      this.fx.setSize(s.x, s.y);
      this.camera.aspect = prevSize.x / prevSize.y;
      this._offline = false;
      this._restoreState(st);
    }
  }

  /** Prépare un rendu à taille fixe (vidéo) ; renvoie la fonction de remise en état */
  _beginCapture(width, height) {
    this.exitPhotoreal();
    this.stopTour();
    this._camAnim = null;
    if (this.view === 'walk') this.setView('orbit');
    this.transform.detach();
    const st = this._snapshotState();
    const r = this.renderer;
    const prevSize = r.getSize(new THREE.Vector2());
    const prevRatio = r.getPixelRatio();
    const helpers = [this.selBox, this.selRing, this.transformHelper, this.measureGroup, this.ghost].filter(Boolean);
    const vis = helpers.map((h) => h.visible);
    helpers.forEach((h) => (h.visible = false));
    this.labels.visible = false;
    this.labelRenderer.domElement.style.visibility = 'hidden';
    r.setPixelRatio(1);
    r.setSize(width, height, false);
    r.domElement.style.objectFit = 'contain';
    this.fx.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.fov = 42;
    this.camera.updateProjectionMatrix();
    this.orbit.enabled = false;
    return () => {
      r.setPixelRatio(prevRatio);
      r.setSize(prevSize.x, prevSize.y);
      r.domElement.style.objectFit = '';
      const s = r.getDrawingBufferSize(new THREE.Vector2());
      this.fx.setSize(s.x, s.y);
      this.camera.aspect = prevSize.x / prevSize.y;
      helpers.forEach((h, i) => (h.visible = vis[i]));
      this.labelRenderer.domElement.style.visibility = '';
      this.orbit.enabled = this.view !== 'walk';
      this._restoreState(st);
      this.select(this.selectedId);
    };
  }

  _tourCurves(keyframes) {
    return {
      path: new THREE.CatmullRomCurve3(keyframes.map((k) => new THREE.Vector3(...k.pos)), false, 'centripetal', 0.5),
      look: new THREE.CatmullRomCurve3(keyframes.map((k) => new THREE.Vector3(...k.look)), false, 'centripetal', 0.5),
    };
  }

  /** Place la caméra et le soleil à l'instant raw ∈ [0, 1] de la visite */
  _tourPose(curves, raw, hourFrom, hourTo, state) {
    const t = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;
    this.camera.position.copy(curves.path.getPointAt(t));
    this.camera.lookAt(curves.look.getPointAt(t));
    this.camera.updateMatrixWorld();
    if (hourFrom != null && hourTo != null) {
      const h = hourFrom + (hourTo - hourFrom) * raw;
      if (state.lastHour == null || Math.abs(h - state.lastHour) > 0.03) {
        state.lastHour = h;
        this.setTime(h, this.dayOfYear);
        if (state.syncEnv) this._updateEnvironment();
      }
    }
    this.night.update(this.camera, this._lightsLevel || 0);
  }

  /**
   * Vidéo image par image avec WebCodecs (mediabunny) : 30 images/s
   * garanties quelle que soit la puissance de la machine, MP4 H.264
   * si le navigateur sait l'encoder, sinon WebM VP9.
   */
  async renderTourVideo({ keyframes, width = 1920, height = 1080, duration = 45, fps = 30, hourFrom, hourTo, codec, bitrate, overlay, onProgress }) {
    const mb = await import('mediabunny');
    const restore = this._beginCapture(width, height);
    this._offline = true;
    const comp = document.createElement('canvas');
    comp.width = width;
    comp.height = height;
    const ctx = comp.getContext('2d');
    const isMp4 = codec === 'avc';
    const output = new mb.Output({
      format: isMp4 ? new mb.Mp4OutputFormat({ fastStart: 'in-memory' }) : new mb.WebMOutputFormat(),
      target: new mb.BufferTarget(),
    });
    // débit choisi (taille du fichier) ou très haute qualité par défaut
    const quality = bitrate ? new mb.Quality({ bitrate: Math.round(bitrate) }) : (mb.QUALITY_VERY_HIGH ?? mb.QUALITY_HIGH);
    const source = new mb.CanvasSource(comp, { codec, quality, keyFrameInterval: bitrate ? 4 : 2 });
    output.addVideoTrack(source, { frameRate: fps });
    const curves = this._tourCurves(keyframes);
    const state = { lastHour: null, syncEnv: true };
    this._recording = { cancelled: false, offline: true };
    const total = Math.round(duration * fps);
    try {
      await output.start();
      if (hourFrom != null) { this.setTime(hourFrom, this.dayOfYear); this._updateEnvironment(); }
      for (let i = 0; i < total; i++) {
        if (this._recording.cancelled) throw new Error('cancelled');
        const raw = i / (total - 1);
        this._tourPose(curves, raw, hourFrom, hourTo, state);
        this.fx.render();
        ctx.drawImage(this.renderer.domElement, 0, 0);
        overlay?.(ctx, raw, width, height, duration);
        await source.add(i / fps, 1 / fps);
        onProgress?.(raw);
        if (i % 4 === 3) await new Promise((res) => setTimeout(res, 0)); // laisse l'interface respirer
      }
      await output.finalize();
      return new Blob([output.target.buffer], { type: isMp4 ? 'video/mp4' : 'video/webm' });
    } catch (e) {
      if (output.state !== 'finalized' && output.state !== 'canceled') await output.cancel?.().catch(() => {});
      throw e;
    } finally {
      this._recording = null;
      this._offline = false;
      restore();
    }
  }

  /**
   * Repli : enregistrement en temps réel (MediaRecorder) pour les
   * navigateurs sans WebCodecs.
   */
  recordTour({ keyframes, width = 1920, height = 1080, duration = 45, hourFrom, hourTo, mime, bitrate, overlay, onProgress }) {
    return new Promise((resolve, reject) => {
      const restore = this._beginCapture(width, height);
      const comp = document.createElement('canvas');
      comp.width = width;
      comp.height = height;
      const ctx = comp.getContext('2d');
      let rec;
      try {
        rec = new MediaRecorder(comp.captureStream(30), { mimeType: mime, videoBitsPerSecond: bitrate || (width >= 1920 ? 16e6 : 9e6) });
      } catch (e) {
        restore();
        reject(e);
        return;
      }
      const chunks = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        const R = this._recording;
        this._recording = null;
        restore();
        if (R?.cancelled) reject(new Error('cancelled'));
        else resolve(new Blob(chunks, { type: mime.split(';')[0] }));
      };
      rec.onerror = (e) => reject(e.error || e);
      this._recording = {
        curves: this._tourCurves(keyframes), state: { lastHour: null },
        start: null, dur: duration * 1000, duration, ctx, rec, overlay, onProgress, hourFrom, hourTo,
      };
      if (hourFrom != null) {
        this.setTime(hourFrom, this.dayOfYear);
        this._updateEnvironment();
      }
      rec.start(500);
    });
  }

  cancelRecording() {
    const R = this._recording;
    if (!R) return;
    R.cancelled = true;
    if (R.rec && R.rec.state !== 'inactive') R.rec.stop();
  }

  _recordFrame(now) {
    const R = this._recording;
    if (R.offline) return; // rendu piloté par renderTourVideo
    if (R.start == null) R.start = now;
    const raw = Math.min(1, (now - R.start) / R.dur);
    this._tourPose(R.curves, raw, R.hourFrom, R.hourTo, R.state);
    this.fx.render();
    R.ctx.drawImage(this.renderer.domElement, 0, 0);
    R.overlay?.(R.ctx, raw, R.ctx.canvas.width, R.ctx.canvas.height, R.duration);
    R.onProgress?.(raw);
    if (raw >= 1 && R.rec.state === 'recording') R.rec.stop();
  }

  async exportGLB() {
    const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
    const exporter = new GLTFExporter();
    const root = new THREE.Group();
    root.name = 'Sidi_Ouaziz';
    // les palmiers instanciés sont convertis en maillages simples
    this.world.updateMatrixWorld(true);
    for (const child of this.world.children) {
      if (!child.visible) continue;
      if (child.isInstancedMesh) {
        const m4 = new THREE.Matrix4();
        for (let i = 0; i < child.count; i++) {
          const m = new THREE.Mesh(child.geometry, child.material);
          child.getMatrixAt(i, m4);
          m.applyMatrix4(m4);
          root.add(m);
        }
      } else root.add(child.clone());
    }
    root.add(this.ground.clone());
    return new Promise((resolve, reject) =>
      exporter.parse(root, (res) => resolve(new Blob([res], { type: 'model/gltf-binary' })), reject, { binary: true })
    );
  }

  /* =========================== nettoyage ========================== */

  dispose() {
    this._running = false;
    this._live?.dispose();
    cancelAnimationFrame(this._raf);
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    this._ro?.disconnect();
    const el = this.renderer.domElement;
    el.removeEventListener('pointerdown', this._pd);
    el.removeEventListener('pointermove', this._pm);
    el.removeEventListener('pointerup', this._pu);
    this.transform.dispose();
    this.orbit.dispose();
    this._envRT?.dispose();
    this.fx.dispose();
    this.pmrem.dispose();
    this.renderer.dispose();
    el.remove();
    this.labelRenderer.domElement.remove();
  }
}

/* ============================ utilitaires ============================ */

const LABELLED = new Set(['terrain', 'vestiaire', 'bassin', 'citystade', 'mur']);
const LABEL_HEIGHT = { terrain: 3, vestiaire: 7, bassin: 4, puits: 4, citystade: 6, mur: 4 };

function shortName(e) {
  if (e.type === 'terrain') return 'Terrain de football';
  if (e.type === 'vestiaire') return 'Vestiaire';
  if (e.type === 'citystade') return 'City stade';
  if (e.type === 'mur') return 'Cimetière';
  return e.name;
}

function polyCentroid(pts) {
  let x = 0, z = 0;
  for (const p of pts) { x += p[0]; z += p[1]; }
  return [x / pts.length, z / pts.length];
}

const _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
const _eul = new THREE.Euler();
function composeMatrix(e) {
  // légère inclinaison naturelle propre à chaque arbre (déterministe)
  const h = Math.sin(e.position[0] * 12.9898 + e.position[1] * 78.233) * 43758.5453;
  const r1 = h - Math.floor(h), r2 = (h * 7.13) - Math.floor(h * 7.13);
  _eul.set((r1 - 0.5) * 0.09, e.rotation || 0, (r2 - 0.5) * 0.09, 'YXZ');
  _q.setFromEuler(_eul);
  _s.setScalar(e.scale || 1);
  _p.set(e.position[0], 0, e.position[1]);
  return new THREE.Matrix4().compose(_p, _q, _s);
}

function applyTransform(obj, e) {
  obj.position.set(e.position[0], 0, e.position[1]);
  obj.rotation.set(0, e.rotation || 0, 0);
  obj.scale.setScalar(e.scale || 1);
}

function round(v, d = 2) {
  const f = 10 ** d;
  return Math.round(v * f) / f;
}

function disposeTree(obj, materials = false) {
  obj.traverse((o) => {
    if (o.isMesh && !o.isInstancedMesh) {
      o.geometry?.dispose();
      if (materials && o.material) [].concat(o.material).forEach((m) => m.dispose());
    }
  });
}
