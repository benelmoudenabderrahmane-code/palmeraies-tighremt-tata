import * as THREE from 'three';

/*
 * Rendu photoréaliste par tracé de chemins (three-gpu-pathtracer) :
 * lumière qui rebondit, ombres douces, ciel physique. Utilisé pour les
 * planches fixes uniquement (quelques dizaines de secondes par image).
 */

/** Copie « à plat » des maillages visibles (instances développées) */
function collectMeshes(roots) {
  const group = new THREE.Group();
  const m4 = new THREE.Matrix4();
  const rgba = new Map();
  // le traceur attend des couleurs de sommet RGBA : conversion des RGB
  const fixColors = (g) => {
    const c = g.attributes.color;
    if (!c || c.itemSize === 4) return g;
    if (!rgba.has(g)) {
      const out = g.clone();
      const arr = new Float32Array(c.count * 4);
      for (let i = 0; i < c.count; i++) arr.set([c.getX(i), c.getY(i), c.getZ(i), 1], i * 4);
      out.setAttribute('color', new THREE.BufferAttribute(arr, 4));
      rgba.set(g, out);
    }
    return rgba.get(g);
  };
  const add = (geometry, material, matrixWorld) => {
    const p = new THREE.Mesh(fixColors(geometry), material);
    p.matrixAutoUpdate = false;
    p.matrix.copy(matrixWorld);
    group.add(p);
  };
  for (const root of roots) {
    root.updateMatrixWorld(true);
    root.traverseVisible((o) => {
      if (!o.isMesh || o.isSprite) return;
      if (o.userData.noPathTrace) return; // détails trop nombreux (cailloux)
      const mats = [].concat(o.material);
      if (mats.some((m) => m.isShaderMaterial || m.isPointsMaterial || m.isSpriteMaterial || m.isLineBasicMaterial)) return;
      if (o.material.depthTest === false) return; // aides de sélection
      if (o.isInstancedMesh) {
        for (let i = 0; i < o.count; i++) {
          o.getMatrixAt(i, m4);
          add(o.geometry, o.material, m4.clone().premultiply(o.matrixWorld));
        }
      } else add(o.geometry, o.material, o.matrixWorld);
    });
  }
  return group;
}

function collectLights(scene) {
  const out = [];
  scene.traverseVisible((o) => {
    if (!(o.isDirectionalLight || o.isPointLight || o.isSpotLight) || o.intensity <= 0) return;
    const l = o.clone();
    o.getWorldPosition(l.position);
    if (o.target) {
      l.target = new THREE.Object3D();
      o.target.getWorldPosition(l.target.position);
      out.push(l.target);
    }
    out.push(l);
  });
  return out;
}

/** Capture une scène (ou des objets : ciel, nuages) en carte cubique */
function captureCube(renderer, object, size = 512) {
  const rt = new THREE.WebGLCubeRenderTarget(size, { type: THREE.FloatType });
  const cam = new THREE.CubeCamera(0.1, 20000, rt);
  if (object.isScene) {
    cam.update(renderer, object);
    return rt;
  }
  const objs = [].concat(object).filter(Boolean);
  const saved = objs.map((o) => [o, o.parent, o.position.clone()]);
  const s = new THREE.Scene();
  objs.forEach((o) => { s.add(o); o.position.set(0, 0, 0); });
  cam.update(renderer, s);
  saved.forEach(([o, parent, p]) => { o.position.copy(p); if (parent) parent.add(o); });
  return rt;
}

/**
 * Rend la vue courante de la caméra en tracé de chemins.
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function renderPhotoreal(engine, { width, height, samples = 128, bounces = 4, onProgress, isCancelled, debug = {} }) {
  const { WebGLPathTracer } = await import('three-gpu-pathtracer');
  const r = engine.renderer;
  const scene = new THREE.Scene();
  const meshes = collectMeshes((debug.onlySite ? [engine.world] : [engine.world, engine.envGroup]).filter((g) => g.visible));
  scene.add(meshes, ...collectLights(engine.scene));

  // arrière-plan : ciel physique ; éclairage : dôme en dégradé + disque
  // solaire modéré (le disque du shader Sky dépasse la précision des
  // textures flottantes et ruine l'échantillonnage)
  const bg = captureCube(r, [engine.sky, engine.clouds]);
  engine._updateEnvironment();
  const env = captureCube(r, engine._envScene, 256);
  scene.background = debug.noEnv ? new THREE.Color('#88aaff') : bg.texture;
  scene.environment = debug.noEnv ? null : env.texture;
  scene.environmentIntensity = 1;
  scene.backgroundIntensity = 1;

  const camera = engine.camera.clone();
  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  const pt = new WebGLPathTracer(r);
  pt.tiles.set(3, 3);
  pt.bounces = bounces;
  pt.renderDelay = 0;
  pt.minSamples = 0;
  pt.fadeDuration = 0;
  pt.renderToCanvas = false;
  pt.rasterizeScene = false;
  pt.filterGlossyFactor = 0.5;
  pt.multipleImportanceSampling = true;
  pt.synchronizeRenderSize = false;

  const prevTarget = r.getRenderTarget();
  try {
    await new Promise((res) => setTimeout(res, 30));
    pt.setScene(scene, camera); // construction du BVH (quelques secondes)
    pt._pathTracer.setSize(width, height);
    pt.reset();
    let guard = 0;
    while (pt.samples < samples) {
      if (isCancelled?.()) throw new Error('cancelled');
      pt.renderSample();
      onProgress?.(Math.min(1, pt.samples / samples));
      if (++guard % 3 === 0) await new Promise((res) => setTimeout(res, 0));
    }
    // tone mapping + sRGB via la passe de sortie du moteur
    r.setPixelRatio(1);
    r.setSize(width, height, false);
    engine.fx.present(pt.target);
    const out = document.createElement('canvas');
    out.width = width;
    out.height = height;
    out.getContext('2d').drawImage(r.domElement, 0, 0);
    return out;
  } finally {
    r.setRenderTarget(prevTarget);
    pt.dispose?.();
    env.dispose();
    bg.dispose();
  }
}

/* ------------------------------------------------------------------ */
/*  Mode photoréaliste « en direct » : l'image s'affine en continu     */
/*  tant que la caméra est immobile (tracé de chemins progressif).     */
/* ------------------------------------------------------------------ */

export async function createLivePhotoreal(engine) {
  const { WebGLPathTracer } = await import('three-gpu-pathtracer');
  // laisse le navigateur afficher le message de préparation
  await new Promise((res) => setTimeout(res, 50));
  return new LivePhotoreal(engine, WebGLPathTracer);
}

class LivePhotoreal {
  constructor(engine, WebGLPathTracer) {
    this.engine = engine;
    this.scene = new THREE.Scene();
    this.meshes = collectMeshes([engine.world, engine.envGroup].filter((g) => g.visible));
    this.lights = new THREE.Group();
    this.scene.add(this.meshes, this.lights);
    this._targets = [];
    this._syncLighting();

    const pt = (this.pt = new WebGLPathTracer(engine.renderer));
    pt.tiles.set(2, 2);
    pt.bounces = 4;
    pt.filterGlossyFactor = 0.5;
    pt.multipleImportanceSampling = true;
    pt.renderDelay = 0;
    pt.minSamples = 2;
    pt.fadeDuration = 400;
    pt.dynamicLowRes = false;
    pt.renderScale = engine.low ? 0.5 : 1;
    // tant que l'image n'est pas prête : rendu habituel du Studio
    pt.rasterizeSceneCallback = () => engine.fx.render();
    pt.setScene(this.scene, engine.camera); // construction du BVH (quelques secondes)

    this._m = engine.camera.matrixWorld.clone();
    this._p = engine.camera.projectionMatrix.clone();
  }

  /** Lumières (soleil / lune / éclairage public) et ciel actuels */
  _syncLighting() {
    const e = this.engine;
    this.lights.clear();
    for (const l of collectLights(e.scene)) this.lights.add(l);
    this._targets.forEach((t) => t.dispose());
    const bg = captureCube(e.renderer, [e.sky, e.clouds]);
    e._updateEnvironment();
    const env = captureCube(e.renderer, e._envScene, 256);
    this._targets = [bg, env];
    this.scene.background = bg.texture;
    this.scene.environment = env.texture;
  }

  /** Appelé quand l'heure change : nouvelle lumière sans reconstruire la scène */
  refreshLighting() {
    this._syncLighting();
    this.scene.updateMatrixWorld(true);
    this.pt.updateLights();
    this.pt.updateEnvironment();
  }

  get samples() {
    return Math.floor(this.pt.samples);
  }

  render() {
    const cam = this.engine.camera;
    cam.updateMatrixWorld();
    if (!cam.matrixWorld.equals(this._m) || !cam.projectionMatrix.equals(this._p)) {
      this._m.copy(cam.matrixWorld);
      this._p.copy(cam.projectionMatrix);
      this.pt.updateCamera();
    }
    this.pt.renderSample();
  }

  dispose() {
    this.pt.dispose();
    this._targets.forEach((t) => t.dispose());
  }
}
