import * as THREE from 'three';

/*
 * Atmosphère « production » :
 *   - brume de hauteur (aérienne) : dense au ras du sol, s'éclaircit en
 *     altitude, comme la poussière en suspension dans la vallée ;
 *   - détails procéduraux des roches et du sol calculés au pixel
 *     (strates, vernis du désert, relief fin) ;
 *   - couche de nuages d'altitude éclairée par le soleil.
 * Tout est calculé dans les shaders : aucune image à télécharger.
 */

/* --------------------------- bruit GLSL ---------------------------- */

export const GLSL_NOISE = /* glsl */ `
float s3dHash(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
float s3dNoise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(s3dHash(i), s3dHash(i + vec3(1, 0, 0)), f.x), mix(s3dHash(i + vec3(0, 1, 0)), s3dHash(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(s3dHash(i + vec3(0, 0, 1)), s3dHash(i + vec3(1, 0, 1)), f.x), mix(s3dHash(i + vec3(0, 1, 1)), s3dHash(i + vec3(1, 1, 1)), f.x), f.y),
    f.z);
}
float s3dFbm(vec3 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) {
    s += a * s3dNoise(p);
    p = p * 2.03 + vec3(1.7, 9.2, 3.1);
    a *= 0.5;
  }
  return s;
}
float s3dFbm3(vec3 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) {
    s += a * s3dNoise(p);
    p = p * 2.07 + vec3(4.3, 1.1, 7.7);
    a *= 0.5;
  }
  return s;
}
`;

/* ------------------------ brume de hauteur ------------------------- */

let fogInstalled = false;

/**
 * Remplace le brouillard de three.js par une brume exponentielle en
 * hauteur. Utilise scene.fog = new THREE.FogExp2(couleur, densité).
 */
export function installHeightFog() {
  if (fogInstalled) return;
  fogInstalled = true;
  const C = THREE.ShaderChunk;
  C.fog_pars_vertex = /* glsl */ `
#ifdef USE_FOG
  varying float vFogDepth;
  varying vec3 vFogView;
#endif`;
  C.fog_vertex = /* glsl */ `
#ifdef USE_FOG
  vFogDepth = - mvPosition.z;
  vFogView = mvPosition.xyz;
#endif`;
  C.fog_pars_fragment = /* glsl */ `
#ifdef USE_FOG
  uniform vec3 fogColor;
  varying float vFogDepth;
  varying vec3 vFogView;
  #ifdef FOG_EXP2
    uniform float fogDensity;
  #else
    uniform float fogNear;
    uniform float fogFar;
  #endif
#endif`;
  C.fog_fragment = /* glsl */ `
#ifdef USE_FOG
  #ifdef FOG_EXP2
  {
    // rayon caméra → fragment dans le repère monde
    vec3 fogRay = transpose(mat3(viewMatrix)) * vFogView;
    float fogDist = length(fogRay);
    float camH = max(cameraPosition.y, 0.0);
    float dy = fogRay.y;
    const float fogFall = 0.0055;
    float e0 = exp(-fogFall * camH);
    float optical = abs(dy) > 0.05
      ? (e0 - exp(-fogFall * (camH + dy))) / (fogFall * dy)
      : e0;
    float fogFactor = 1.0 - exp(-fogDensity * fogDist * optical);
    gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, clamp(fogFactor, 0.0, 1.0));
  }
  #else
    float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
    gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
  #endif
#endif`;
}

/* --------------------- détails roches / sol ------------------------ */

const PERTURB = /* glsl */ `
// relief à partir d'une hauteur procédurale (Mikkelsen, non normalisé :
// la hauteur est exprimée en mètres)
vec3 s3dPerturb(vec3 surfPos, vec3 surfNorm, float h, float faceDir) {
  vec3 sx = dFdx(surfPos), sy = dFdy(surfPos);
  vec2 dh = vec2(dFdx(h), dFdy(h));
  vec3 r1 = cross(sy, surfNorm), r2 = cross(surfNorm, sx);
  float det = dot(sx, r1) * faceDir;
  vec3 grad = sign(det) * (dh.x * r1 + dh.y * r2);
  return normalize(abs(det) * surfNorm - grad);
}
`;

/**
 * Ajoute des détails procéduraux au pixel sur un matériau standard.
 * kind = 'rock' : strates, vernis du désert, éboulis
 * kind = 'ground' : reg (pavage de cailloux) / sable, petits cailloux
 */
export function addTerrainDetail(material, kind = 'rock') {
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vTWorld;\nvarying vec3 vTNormal;')
      .replace('#include <project_vertex>', `#include <project_vertex>
        vTWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
        vTNormal = normalize(mat3(modelMatrix) * objectNormal);`);
    const rock = /* glsl */ `
      {
        vec3 wp = vTWorld;
        float slope = 1.0 - clamp(normalize(vTNormal).y, 0.0, 1.0);
        float dist = length(vViewPosition);
        float warp = s3dFbm3(wp * 0.0035) * 46.0 + wp.x * 0.012;
        float sv = (wp.y + warp) * 0.085;
        float layer = floor(sv);
        float band = fract(sv);
        // atténuation des strates quand elles deviennent plus fines qu'un pixel
        s3dStrataAA = clamp(1.6 - fwidth(sv) * 6.0, 0.0, 1.0);
        float rockMask = smoothstep(0.1, 0.42, slope) * smoothstep(2.0, 14.0, wp.y);
        float layerTone = s3dHash(vec3(layer, 3.7, 1.3));
        float n1 = s3dFbm(wp * 0.035);
        float n2 = s3dFbm3(wp * 0.25);
        vec3 c = diffuseColor.rgb;
        // strates : chaque couche a sa teinte (grès, schiste, quartzite)
        vec3 tint = mix(vec3(1.04, 0.96, 0.9), vec3(0.86, 0.86, 0.9), layerTone);
        c *= mix(vec3(1.0), tint * (0.82 + 0.3 * layerTone), rockMask * 0.85);
        // corniches : liseré clair au sommet de chaque banc
        c *= 1.0 + rockMask * 0.2 * smoothstep(0.7, 0.86, band) * (1.0 - smoothstep(0.9, 1.0, band)) * s3dStrataAA;
        // vernis du désert (patine sombre) sur les parois raides
        float varnish = smoothstep(0.3, 0.75, slope) * smoothstep(0.35, 0.65, n1);
        c = mix(c, c * vec3(0.5, 0.45, 0.42), varnish * 0.75);
        // éboulis clairs dans les replats et les talwegs
        float scree = (1.0 - smoothstep(0.08, 0.3, slope)) * smoothstep(0.45, 0.7, s3dFbm3(wp * 0.02 + 7.0));
        c = mix(c, vec3(0.62, 0.5, 0.39), scree * 0.45 * smoothstep(3.0, 25.0, wp.y));
        c *= 0.84 + 0.32 * n1;
        c *= mix(1.0, 0.9 + 0.2 * n2, clamp(1.0 - dist / 600.0, 0.0, 1.0));
        diffuseColor.rgb = c;
        s3dRockMask = rockMask;
        s3dBand = band;
      }`;
    const ground = /* glsl */ `
      {
        vec3 wp = vec3(vTWorld.x, 0.0, vTWorld.z);
        float n = s3dFbm(wp * 0.009);
        float m = s3dFbm3(wp * 0.05 + 5.0);
        float f = s3dNoise(wp * 0.9);
        vec3 c = diffuseColor.rgb;
        // reg : pavage de cailloux sombres patinés
        float reg = smoothstep(0.44, 0.62, n);
        c = mix(c, c * vec3(0.74, 0.66, 0.6), reg * 0.8);
        // sable clair déposé par le vent (bandes allongées)
        float drift = smoothstep(0.55, 0.75, s3dFbm3(vec3(wp.x * 0.004, 0.0, wp.z * 0.016) + 11.0));
        c = mix(c, vec3(0.86, 0.74, 0.58), drift * 0.45);
        c *= 0.9 + 0.2 * m;
        c *= mix(1.0, 0.9 + 0.2 * f, clamp(1.0 - length(vViewPosition) / 160.0, 0.0, 1.0));
        diffuseColor.rgb = c;
        s3dRockMask = reg;
      }`;
    const rockBump = /* glsl */ `
      {
        float dist = length(vViewPosition);
        float fade = clamp(1.0 - dist / 1600.0, 0.0, 1.0);
        float ledge = smoothstep(0.0, 0.78, s3dBand) * (1.0 - smoothstep(0.84, 1.0, s3dBand)) * 2.0 * s3dRockMask * s3dStrataAA;
        float crag = 1.0 - abs(s3dFbm(vTWorld * 0.045) * 2.0 - 1.0);
        float hgt = (crag * 10.0 + s3dFbm3(vTWorld * 0.16) * 2.0 + ledge) * fade;
        normal = s3dPerturb(-vViewPosition, normal, hgt, faceDirection);
      }`;
    const groundBump = /* glsl */ `
      {
        float dist = length(vViewPosition);
        float near = clamp(1.0 - dist / 120.0, 0.0, 1.0);
        float hgt = (s3dNoise(vec3(vTWorld.x, 0.0, vTWorld.z) * 2.6) * 0.04 * (0.4 + s3dRockMask)
          + s3dFbm3(vec3(vTWorld.x, 0.0, vTWorld.z) * 0.12) * 0.25) * near;
        normal = s3dPerturb(-vViewPosition, normal, hgt, faceDirection);
      }`;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vTWorld;
        varying vec3 vTNormal;
        float s3dRockMask = 0.0;
        float s3dBand = 0.0;
        float s3dStrataAA = 1.0;
        ${GLSL_NOISE}
        ${PERTURB}`)
      .replace('#include <color_fragment>', `#include <color_fragment>\n${kind === 'rock' ? rock : ground}`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>\n${kind === 'rock' ? rockBump : groundBump}`);
  };
  material.customProgramCacheKey = () => `terrain-${kind}`;
  return material;
}

/* ------------------------------ nuages ------------------------------ */

/**
 * Dôme de nuages d'altitude (altocumulus / cirrus) qui suit la caméra.
 * update(sunDir, day, golden) l'éclaire selon l'heure.
 */
export function buildClouds() {
  const uniforms = {
    sunDir: { value: new THREE.Vector3(0, 1, 0) },
    sunColor: { value: new THREE.Color('#ffffff') },
    shadeColor: { value: new THREE.Color('#9fb0c8') },
    coverage: { value: 0.56 },
    opacity: { value: 1 },
    uTime: { value: 0 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    fog: false,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = position;
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position = vec4(p.xy, p.w * 0.99999, p.w); // toujours au fond
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 sunDir, sunColor, shadeColor;
      uniform float coverage, opacity, uTime;
      varying vec3 vDir;
      ${GLSL_NOISE}
      float clouds(vec2 p) {
        // altocumulus en bancs + voile de cirrus étiré
        float base = s3dFbm(vec3(p * 1.1 + vec2(uTime * 0.004, 0.0), 0.0));
        float detail = s3dFbm3(vec3(p * 4.7, 2.0));
        float cum = smoothstep(coverage, coverage + 0.2, base + (detail - 0.5) * 0.28);
        float cir = smoothstep(0.52, 0.8, s3dFbm3(vec3(p.x * 0.6, p.y * 3.2, 5.0) + vec3(uTime * 0.003, 0.0, 0.0)));
        return max(cum, cir * 0.45);
      }
      void main() {
        vec3 d = normalize(vDir);
        if (d.y < 0.005) discard;
        vec2 p = d.xz / (d.y + 0.12) * 1.35;
        float c = clouds(p);
        if (c < 0.003) discard;
        // éclairage : épaisseur vers le soleil → bords lumineux, cœurs gris
        vec2 toSun = normalize(sunDir.xz + 1e-4) * 0.06;
        float c2 = clouds(p + toSun);
        float lit = clamp(1.0 - (c2 - c) * 2.2 - c * 0.35, 0.0, 1.0);
        float silver = pow(max(dot(d, sunDir), 0.0), 8.0) * (1.0 - c) * 1.6;
        vec3 col = mix(shadeColor, sunColor, lit) + sunColor * silver;
        float horizon = smoothstep(0.0, 0.22, d.y);
        gl_FragColor = vec4(col, c * horizon * opacity * 0.92);
      }`,
  });
  const geo = new THREE.SphereGeometry(1000, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'nuages';
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  mesh.userData.noPathTrace = true;
  // centré sur la caméra qui rend (y compris les caméras cubiques)
  mesh.onBeforeRender = (renderer, scene, camera) => {
    camera.getWorldPosition(mesh.position);
    mesh.updateMatrixWorld();
  };
  mesh.update = (sunDir, day, golden) => {
    uniforms.sunDir.value.copy(sunDir).normalize();
    const warm = new THREE.Color('#ffffff').lerp(new THREE.Color('#ffb27a'), golden * 0.9);
    // le ciel de three.js est exprimé en luminance « physique » : on suit
    uniforms.sunColor.value.copy(warm).multiplyScalar(0.25 + 1.15 * day);
    uniforms.shadeColor.value.set('#a7b3c4').lerp(new THREE.Color('#b58f86'), golden * 0.7).multiplyScalar(0.12 + 0.75 * day);
    uniforms.opacity.value = 0.25 + 0.75 * day;
  };
  mesh.uniforms = uniforms;
  return mesh;
}
