import { useEffect, useRef } from 'react';
import {
  Vector3 as a,
  MeshPhysicalMaterial as c,
  InstancedMesh as d,
  Clock as e,
  AmbientLight as f,
  SphereGeometry as g,
  ShaderChunk as h,
  Scene as i,
  Color as l,
  Object3D as m,
  SRGBColorSpace as n,
  MathUtils as o,
  PMREMGenerator as p,
  Vector2 as r,
  WebGLRenderer as s,
  PerspectiveCamera as t,
  PointLight as u,
  ACESFilmicToneMapping as v,
  Plane as w,
  Raycaster as y
} from 'three';
import { RoomEnvironment as z } from 'three/examples/jsm/environments/RoomEnvironment.js';

class ThreeApp {
  canvas; camera; cameraMinAspect; cameraMaxAspect; cameraFov; maxPixelRatio; minPixelRatio; scene; renderer;
  size = { width: 0, height: 0, wWidth: 0, wHeight: 0, ratio: 0, pixelRatio: 0 };
  render = this.#render;
  onBeforeRender = () => {}; onAfterRender = () => {}; onAfterResize = () => {};
  #running = false; #visible = false; isDisposed = false;
  #resizeObserver; #intersectionObserver; #resizeTimeout; #postprocessing; #clock = new e(); #time = { elapsed: 0, delta: 0 }; #rafId;
  #config;

  constructor(config) {
    this.#config = { ...config };
    this.#initCamera(); this.#initScene(); this.#initRenderer(); this.resize(); this.#initObservers();
  }
  #initCamera() { this.camera = new t(); this.cameraFov = this.camera.fov; }
  #initScene() { this.scene = new i(); }
  #initRenderer() {
    if (this.#config.canvas) this.canvas = this.#config.canvas;
    else if (this.#config.id) this.canvas = document.getElementById(this.#config.id);
    this.canvas.style.display = 'block';
    this.renderer = new s({ canvas: this.canvas, powerPreference: 'high-performance', ...(this.#config.rendererOptions ?? {}) });
    this.renderer.outputColorSpace = n;
  }
  #initObservers() {
    if (!(this.#config.size instanceof Object)) {
      window.addEventListener('resize', this.#onResize.bind(this));
      if (this.#config.size === 'parent' && this.canvas.parentNode) {
        this.#resizeObserver = new ResizeObserver(this.#onResize.bind(this));
        this.#resizeObserver.observe(this.canvas.parentNode);
      }
    }
    this.#intersectionObserver = new IntersectionObserver(entries => {
      this.#visible = entries[0].isIntersecting;
      this.#visible ? this.#startLoop() : this.#stopLoop();
    }, { root: null, rootMargin: '0px', threshold: 0 });
    this.#intersectionObserver.observe(this.canvas);
    document.addEventListener('visibilitychange', () => {
      if (this.#visible) document.hidden ? this.#stopLoop() : this.#startLoop();
    });
  }
  #onResize() {
    if (this.#resizeTimeout) clearTimeout(this.#resizeTimeout);
    this.#resizeTimeout = setTimeout(this.resize.bind(this), 100);
  }
  resize() {
    let width, height;
    if (this.#config.size instanceof Object) { width = this.#config.size.width; height = this.#config.size.height; }
    else if (this.#config.size === 'parent' && this.canvas.parentNode) { width = this.canvas.parentNode.offsetWidth; height = this.canvas.parentNode.offsetHeight; }
    else { width = window.innerWidth; height = window.innerHeight; }
    this.size.width = width; this.size.height = height; this.size.ratio = width / height;
    this.#updateCamera(); this.#updateRenderer(); this.onAfterResize(this.size);
  }
  #updateCamera() {
    this.camera.aspect = this.size.width / this.size.height;
    if (this.camera.isPerspectiveCamera && this.cameraFov) {
      if (this.cameraMinAspect && this.camera.aspect < this.cameraMinAspect) this.#adjustFov(this.cameraMinAspect);
      else if (this.cameraMaxAspect && this.camera.aspect > this.cameraMaxAspect) this.#adjustFov(this.cameraMaxAspect);
      else this.camera.fov = this.cameraFov;
    }
    this.camera.updateProjectionMatrix(); this.updateWorldSize();
  }
  #adjustFov(aspect) {
    const tanHalfFov = Math.tan(o.degToRad(this.cameraFov / 2)) / (this.camera.aspect / aspect);
    this.camera.fov = 2 * o.radToDeg(Math.atan(tanHalfFov));
  }
  updateWorldSize() {
    if (this.camera.isPerspectiveCamera) {
      const fovRad = (this.camera.fov * Math.PI) / 180;
      this.size.wHeight = 2 * Math.tan(fovRad / 2) * this.camera.position.length();
      this.size.wWidth = this.size.wHeight * this.camera.aspect;
    } else if (this.camera.isOrthographicCamera) {
      this.size.wHeight = this.camera.top - this.camera.bottom;
      this.size.wWidth = this.camera.right - this.camera.left;
    }
  }
  #updateRenderer() {
    this.renderer.setSize(this.size.width, this.size.height);
    this.#postprocessing?.setSize(this.size.width, this.size.height);
    let dpr = window.devicePixelRatio;
    if (this.maxPixelRatio && dpr > this.maxPixelRatio) dpr = this.maxPixelRatio;
    else if (this.minPixelRatio && dpr < this.minPixelRatio) dpr = this.minPixelRatio;
    this.renderer.setPixelRatio(dpr); this.size.pixelRatio = dpr;
  }
  get postprocessing() { return this.#postprocessing; }
  set postprocessing(pp) { this.#postprocessing = pp; this.render = pp.render.bind(pp); }
  #startLoop() {
    if (this.#running) return;
    const animate = () => {
      this.#rafId = requestAnimationFrame(animate);
      this.#time.delta = this.#clock.getDelta();
      this.#time.elapsed += this.#time.delta;
      this.onBeforeRender(this.#time);
      this.render();
      this.onAfterRender(this.#time);
    };
    this.#running = true; this.#clock.start(); animate();
  }
  #stopLoop() {
    if (this.#running) { cancelAnimationFrame(this.#rafId); this.#running = false; this.#clock.stop(); }
  }
  #render() { this.renderer.render(this.scene, this.camera); }
  clear() {
    this.scene.traverse(obj => {
      if (obj.isMesh && typeof obj.material === 'object' && obj.material !== null) {
        Object.keys(obj.material).forEach(k => { const v = obj.material[k]; if (v?.dispose) v.dispose(); });
        obj.material.dispose(); obj.geometry.dispose();
      }
    });
    this.scene.clear();
  }
  dispose() {
    window.removeEventListener('resize', this.#onResize.bind(this));
    this.#resizeObserver?.disconnect(); this.#intersectionObserver?.disconnect();
    this.#stopLoop(); this.clear(); this.#postprocessing?.dispose();
    this.renderer.dispose(); this.renderer.forceContextLoss(); this.isDisposed = true;
  }
}

const pointerMap = new Map();
let globalListeners = false;
let globalPointer = new r();

function createPointer(config) {
  const state = { position: new r(), nPosition: new r(), hover: false, touching: false, onEnter() {}, onMove() {}, onClick() {}, onLeave() {}, ...config };
  pointerMap.set(config.domElement, state);
  if (!globalListeners) {
    document.body.addEventListener('pointermove', onPointerMove);
    document.body.addEventListener('pointerleave', onPointerLeave);
    document.body.addEventListener('click', onPointerClick);
    document.body.addEventListener('touchstart', onTouchStart, { passive: false });
    document.body.addEventListener('touchmove', onTouchMove, { passive: false });
    document.body.addEventListener('touchend', onTouchEnd, { passive: false });
    document.body.addEventListener('touchcancel', onTouchEnd, { passive: false });
    globalListeners = true;
  }
  state.dispose = () => {
    pointerMap.delete(config.domElement);
    if (pointerMap.size === 0) {
      document.body.removeEventListener('pointermove', onPointerMove);
      document.body.removeEventListener('pointerleave', onPointerLeave);
      document.body.removeEventListener('click', onPointerClick);
      document.body.removeEventListener('touchstart', onTouchStart);
      document.body.removeEventListener('touchmove', onTouchMove);
      document.body.removeEventListener('touchend', onTouchEnd);
      document.body.removeEventListener('touchcancel', onTouchEnd);
      globalListeners = false;
    }
  };
  return state;
}

function updatePointerState(state, rect) {
  state.position.x = globalPointer.x - rect.left;
  state.position.y = globalPointer.y - rect.top;
  state.nPosition.x = (state.position.x / rect.width) * 2 - 1;
  state.nPosition.y = (-state.position.y / rect.height) * 2 + 1;
}

function isInsideRect(rect) {
  const { x, y } = globalPointer;
  return x >= rect.left && x <= rect.left + rect.width && y >= rect.top && y <= rect.top + rect.height;
}

function onPointerMove(e) {
  globalPointer.x = e.clientX; globalPointer.y = e.clientY;
  for (const [elem, state] of pointerMap) {
    const rect = elem.getBoundingClientRect();
    if (isInsideRect(rect)) {
      updatePointerState(state, rect);
      if (!state.hover) { state.hover = true; state.onEnter(state); }
      state.onMove(state);
    } else if (state.hover && !state.touching) { state.hover = false; state.onLeave(state); }
  }
}

function onPointerLeave() {
  for (const state of pointerMap.values()) { if (state.hover) { state.hover = false; state.onLeave(state); } }
}

function onPointerClick(e) {
  globalPointer.x = e.clientX; globalPointer.y = e.clientY;
  for (const [elem, state] of pointerMap) {
    const rect = elem.getBoundingClientRect();
    updatePointerState(state, rect);
    if (isInsideRect(rect)) state.onClick(state);
  }
}

function onTouchStart(e) {
  if (e.touches.length > 0) {
    e.preventDefault();
    globalPointer.x = e.touches[0].clientX; globalPointer.y = e.touches[0].clientY;
    for (const [elem, state] of pointerMap) {
      const rect = elem.getBoundingClientRect();
      if (isInsideRect(rect)) {
        state.touching = true; updatePointerState(state, rect);
        if (!state.hover) { state.hover = true; state.onEnter(state); }
        state.onMove(state);
      }
    }
  }
}

function onTouchMove(e) {
  if (e.touches.length > 0) {
    e.preventDefault();
    globalPointer.x = e.touches[0].clientX; globalPointer.y = e.touches[0].clientY;
    for (const [elem, state] of pointerMap) {
      const rect = elem.getBoundingClientRect();
      updatePointerState(state, rect);
      if (isInsideRect(rect)) {
        if (!state.hover) { state.hover = true; state.touching = true; state.onEnter(state); }
        state.onMove(state);
      } else if (state.hover && state.touching) state.onMove(state);
    }
  }
}

function onTouchEnd() {
  for (const state of pointerMap.values()) {
    if (state.touching) { state.touching = false; if (state.hover) { state.hover = false; state.onLeave(state); } }
  }
}

const { randFloat: randF, randFloatSpread: randFS } = o;
const tmpVecs = Array.from({ length: 10 }, () => new a());

class BallPhysics {
  constructor(config) {
    this.config = config;
    this.positionData = new Float32Array(3 * config.count).fill(0);
    this.velocityData = new Float32Array(3 * config.count).fill(0);
    this.sizeData = new Float32Array(config.count).fill(1);
    this.center = new a();
    this.#initPositions(); this.setSizes();
  }
  #initPositions() {
    const { config: cfg, positionData: pos } = this;
    this.center.toArray(pos, 0);
    for (let i = 1; i < cfg.count; i++) {
      const base = 3 * i;
      pos[base] = randFS(2 * cfg.maxX);
      pos[base + 1] = randFS(2 * cfg.maxY);
      pos[base + 2] = randFS(2 * cfg.maxZ);
    }
  }
  setSizes() {
    const { config: cfg, sizeData: sz } = this;
    sz[0] = cfg.size0;
    for (let i = 1; i < cfg.count; i++) sz[i] = randF(cfg.minSize, cfg.maxSize);
  }
  update(time) {
    const { config: cfg, center, positionData: pos, sizeData: sz, velocityData: vel } = this;
    const [F, I, O, V, B, N, _, j, H, T] = tmpVecs;
    let start = 0;
    if (cfg.controlSphere0) {
      start = 1;
      F.fromArray(pos, 0).lerp(center, 0.1).toArray(pos, 0);
      V.set(0, 0, 0).toArray(vel, 0);
    }
    for (let idx = start; idx < cfg.count; idx++) {
      const base = 3 * idx;
      I.fromArray(pos, base); B.fromArray(vel, base);
      B.y -= time.delta * cfg.gravity * sz[idx];
      B.multiplyScalar(cfg.friction).clampLength(0, cfg.maxVelocity);
      I.add(B); I.toArray(pos, base); B.toArray(vel, base);
    }
    for (let idx = start; idx < cfg.count; idx++) {
      const base = 3 * idx;
      I.fromArray(pos, base); B.fromArray(vel, base);
      const radius = sz[idx];
      for (let jdx = idx + 1; jdx < cfg.count; jdx++) {
        const oBase = 3 * jdx;
        O.fromArray(pos, oBase); N.fromArray(vel, oBase);
        const oRadius = sz[jdx];
        _.copy(O).sub(I);
        const dist = _.length(), sumR = radius + oRadius;
        if (dist < sumR) {
          const overlap = sumR - dist;
          j.copy(_).normalize().multiplyScalar(0.5 * overlap);
          H.copy(j).multiplyScalar(Math.max(B.length(), 1));
          T.copy(j).multiplyScalar(Math.max(N.length(), 1));
          I.sub(j); B.sub(H); I.toArray(pos, base); B.toArray(vel, base);
          O.add(j); N.add(T); O.toArray(pos, oBase); N.toArray(vel, oBase);
        }
      }
      if (cfg.controlSphere0) {
        F.fromArray(pos, 0);
        _.copy(F).sub(I);
        const dist = _.length(), sumR0 = radius + sz[0];
        if (dist < sumR0) {
          const diff = sumR0 - dist;
          j.copy(_.normalize()).multiplyScalar(diff);
          H.copy(j).multiplyScalar(Math.max(B.length(), 2));
          I.sub(j); B.sub(H);
        }
      }
      if (Math.abs(I.x) + radius > cfg.maxX) { I.x = Math.sign(I.x) * (cfg.maxX - radius); B.x = -B.x * cfg.wallBounce; }
      if (cfg.gravity === 0) {
        if (Math.abs(I.y) + radius > cfg.maxY) { I.y = Math.sign(I.y) * (cfg.maxY - radius); B.y = -B.y * cfg.wallBounce; }
      } else if (I.y - radius < -cfg.maxY) { I.y = -cfg.maxY + radius; B.y = -B.y * cfg.wallBounce; }
      const maxBound = Math.max(cfg.maxZ, cfg.maxSize);
      if (Math.abs(I.z) + radius > maxBound) { I.z = Math.sign(I.z) * (cfg.maxZ - radius); B.z = -B.z * cfg.wallBounce; }
      I.toArray(pos, base); B.toArray(vel, base);
    }
  }
}

class SubsurfaceMaterial extends c {
  constructor(params) {
    super(params);
    this.uniforms = { thicknessDistortion: { value: 0.1 }, thicknessAmbient: { value: 0 }, thicknessAttenuation: { value: 0.1 }, thicknessPower: { value: 2 }, thicknessScale: { value: 10 } };
    this.defines.USE_UV = '';
    this.onBeforeCompile = shader => {
      Object.assign(shader.uniforms, this.uniforms);
      shader.fragmentShader = `
        uniform float thicknessPower;
        uniform float thicknessScale;
        uniform float thicknessDistortion;
        uniform float thicknessAmbient;
        uniform float thicknessAttenuation;
      ` + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('void main() {', `
        void RE_Direct_Scattering(const in IncidentLight directLight, const in vec2 uv, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, inout ReflectedLight reflectedLight) {
          vec3 scatteringHalf = normalize(directLight.direction + (geometryNormal * thicknessDistortion));
          float scatteringDot = pow(saturate(dot(geometryViewDir, -scatteringHalf)), thicknessPower) * thicknessScale;
          #ifdef USE_COLOR
            vec3 scatteringIllu = (scatteringDot + thicknessAmbient) * vColor;
          #else
            vec3 scatteringIllu = (scatteringDot + thicknessAmbient) * diffuse;
          #endif
          reflectedLight.directDiffuse += scatteringIllu * thicknessAttenuation * directLight.color;
        }
        void main() {
      `);
      const lightsChunk = h.lights_fragment_begin.replaceAll(
        'RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );',
        'RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n          RE_Direct_Scattering(directLight, vUv, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, reflectedLight);'
      );
      shader.fragmentShader = shader.fragmentShader.replace('#include <lights_fragment_begin>', lightsChunk);
      if (this.onBeforeCompile2) this.onBeforeCompile2(shader);
    };
  }
}

const DEFAULT_CONFIG = { count: 200, colors: [0, 0, 0], ambientColor: 0xffffff, ambientIntensity: 1, lightIntensity: 200, materialParams: { metalness: 0.5, roughness: 0.5, clearcoat: 1, clearcoatRoughness: 0.15 }, minSize: 0.5, maxSize: 1, size0: 1, gravity: 0.5, friction: 0.9975, wallBounce: 0.95, maxVelocity: 0.15, maxX: 5, maxY: 5, maxZ: 2, controlSphere0: false, followCursor: true };

const dummy = new m();

class BallpitMesh extends d {
  constructor(renderer, options = {}) {
    const cfg = { ...DEFAULT_CONFIG, ...options };
    const envTexture = new p(renderer, 0.04).fromScene(new z()).texture;
    const mat = new SubsurfaceMaterial({ envMap: envTexture, ...cfg.materialParams });
    mat.envMapRotation.x = -Math.PI / 2;
    super(new g(), mat, cfg.count);
    this.config = cfg;
    this.physics = new BallPhysics(cfg);
    this.ambientLight = new f(cfg.ambientColor, cfg.ambientIntensity);
    this.add(this.ambientLight);
    this.light = new u(cfg.colors[0], cfg.lightIntensity);
    this.add(this.light);
    this.setColors(cfg.colors);
  }
  setColors(colors) {
    if (!Array.isArray(colors) || colors.length <= 1) return;
    const palette = colors.map(c => new l(c));
    const getColor = (ratio, out = new l()) => {
      const scaled = Math.max(0, Math.min(1, ratio)) * (colors.length - 1);
      const idx = Math.floor(scaled);
      const start = palette[idx];
      if (idx >= colors.length - 1) return start.clone();
      const alpha = scaled - idx;
      const end = palette[idx + 1];
      out.r = start.r + alpha * (end.r - start.r);
      out.g = start.g + alpha * (end.g - start.g);
      out.b = start.b + alpha * (end.b - start.b);
      return out;
    };
    for (let i = 0; i < this.count; i++) {
      this.setColorAt(i, getColor(i / this.count));
      if (i === 0) this.light.color.copy(getColor(0));
    }
    this.instanceColor.needsUpdate = true;
  }
  update(time) {
    this.physics.update(time);
    for (let i = 0; i < this.count; i++) {
      dummy.position.fromArray(this.physics.positionData, 3 * i);
      if (i === 0 && !this.config.followCursor) dummy.scale.setScalar(0);
      else dummy.scale.setScalar(this.physics.sizeData[i]);
      dummy.updateMatrix();
      this.setMatrixAt(i, dummy.matrix);
      if (i === 0) this.light.position.copy(dummy.position);
    }
    this.instanceMatrix.needsUpdate = true;
  }
}

function createBallpit(canvas, options = {}) {
  const app = new ThreeApp({ canvas, size: 'parent', rendererOptions: { antialias: true, alpha: true } });
  let mesh;
  app.renderer.toneMapping = v;
  app.camera.position.set(0, 0, 20);
  app.camera.lookAt(0, 0, 0);
  app.cameraMaxAspect = 1.5;
  app.resize();
  init(options);

  const raycaster = new y();
  const plane = new w(new a(0, 0, 1), 0);
  const hitPoint = new a();
  let paused = false;

  canvas.style.touchAction = 'none';
  canvas.style.userSelect = 'none';

  const pointer = createPointer({
    domElement: canvas,
    onMove() {
      raycaster.setFromCamera(pointer.nPosition, app.camera);
      app.camera.getWorldDirection(plane.normal);
      raycaster.ray.intersectPlane(plane, hitPoint);
      mesh.physics.center.copy(hitPoint);
      mesh.config.controlSphere0 = true;
    },
    onLeave() { mesh.config.controlSphere0 = false; }
  });

  function init(opts) {
    if (mesh) { app.clear(); app.scene.remove(mesh); }
    mesh = new BallpitMesh(app.renderer, opts);
    app.scene.add(mesh);
  }

  app.onBeforeRender = time => { if (!paused) mesh.update(time); };
  app.onAfterResize = size => { mesh.config.maxX = size.wWidth / 2; mesh.config.maxY = size.wHeight / 2; };

  return {
    three: app,
    get spheres() { return mesh; },
    setCount(count) { init({ ...mesh.config, count }); },
    togglePause() { paused = !paused; },
    dispose() { pointer.dispose(); app.dispose(); }
  };
}

const Ballpit = ({ className = '', followCursor = true, ...props }) => {
  const canvasRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    instanceRef.current = createBallpit(canvas, { followCursor, ...props });
    return () => { instanceRef.current?.dispose(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas className={className} ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
};

export default Ballpit;
