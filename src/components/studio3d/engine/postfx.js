import * as THREE from 'three';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';

/**
 * Étalonnage « cinéma » appliqué après le tone mapping (espace sRGB) :
 * courbe en S douce, saturation, ombres froides / hautes lumières
 * chaudes, vignettage et grain fin (supprime les bandes du ciel).
 */
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    contrast: { value: 0.22 },
    saturation: { value: 1.1 },
    vignette: { value: 0.32 },
    grain: { value: 0.018 },
    shadowTint: { value: new THREE.Vector3(0.97, 1.0, 1.04) },
    highTint: { value: new THREE.Vector3(1.035, 1.0, 0.955) },
    aspect: { value: 1.6 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float contrast, saturation, vignette, grain, aspect;
    uniform vec3 shadowTint, highTint;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec4 src = texture2D(tDiffuse, vUv);
      vec3 c = src.rgb;
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      // séparation des tons
      c *= mix(shadowTint, highTint, smoothstep(0.15, 0.85, l));
      // saturation
      float l2 = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(l2), c, saturation);
      // courbe en S
      c = mix(c, c * c * (3.0 - 2.0 * c), contrast);
      // vignettage
      vec2 q = (vUv - 0.5) * vec2(aspect, 1.0);
      c *= 1.0 - vignette * smoothstep(0.35, 1.05, length(q) / (0.5 * aspect + 0.5));
      // grain
      c += (hash(gl_FragCoord.xy + fract(l * 91.7)) - 0.5) * grain;
      gl_FragColor = vec4(clamp(c, 0.0, 1.0), src.a);
    }`,
};

/**
 * Chaîne de rendu « premium » :
 *   scène (HDR, MSAA) → occlusion ambiante GTAO → halo lumineux (nuit)
 *   → sortie (tone mapping ACES + sRGB).
 *
 * Le GTAO reconstruit les normales depuis la profondeur de la passe
 * principale : les palmes (alphaTest) produisent donc une occlusion juste.
 * Les buffers sont gérés à la main (pas d'EffectComposer) pour garder
 * la texture de profondeur stable quand on active / coupe le halo.
 */
export class PostFX {
  constructor(renderer, scene, camera, { msaa = 4 } = {}) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.aoEnabled = true;
    this.bloomEnabled = false;

    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    const w = size.x, h = size.y;
    const depthTexture = new THREE.DepthTexture(w, h);
    depthTexture.type = THREE.UnsignedIntType;
    this.sceneRT = new THREE.WebGLRenderTarget(w, h, {
      type: THREE.HalfFloatType,
      samples: msaa,
      depthTexture,
    });
    this.fxRT = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType });

    this.gtao = new GTAOPass(scene, camera, w, h, undefined, {
      radius: 1.6,
      distanceExponent: 1.6,
      thickness: 2.5,
      scale: 1.15,
      samples: 16,
      distanceFallOff: 1,
      screenSpaceRadius: false,
    }, {
      lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16,
    });
    // profondeur de la passe principale, normales reconstruites
    // (appel séparé : le constructeur de GTAOPass r183 plante sinon)
    this.gtao.setGBuffer(depthTexture);
    this.gtao.blendIntensity = 0.9;

    this.bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.4, 0.35, 1.6);
    this.output = new OutputPass();
    this.output.renderToScreen = true;

    // étalonnage final (LDR sRGB 8 bits → écran)
    this.gradeEnabled = true;
    this.ldrRT = new THREE.WebGLRenderTarget(w, h, { type: THREE.UnsignedByteType });
    this.grade = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(GradeShader.uniforms),
      vertexShader: GradeShader.vertexShader,
      fragmentShader: GradeShader.fragmentShader,
      depthTest: false,
      depthWrite: false,
    });
    this.grade.uniforms.aspect.value = w / h;
    this._gradeQuad = new FullScreenQuad(this.grade);
  }

  /** Tone mapping + étalonnage d'une image HDR vers l'écran */
  present(src) {
    const r = this.renderer;
    if (!this.gradeEnabled) {
      this.output.render(r, null, src);
      return;
    }
    if (this.ldrRT.width !== src.width || this.ldrRT.height !== src.height) this.ldrRT.setSize(src.width, src.height);
    this.output.renderToScreen = false;
    this.output.render(r, this.ldrRT, src);
    this.output.renderToScreen = true;
    this.grade.uniforms.tDiffuse.value = this.ldrRT.texture;
    this.grade.uniforms.aspect.value = src.width / src.height;
    r.setRenderTarget(null);
    this._gradeQuad.render(r);
  }

  setSize(w, h) {
    this.sceneRT.setSize(w, h);
    this.fxRT.setSize(w, h);
    this.gtao.setSize(w, h);
    this.bloom.setSize(w, h);
    this.output.setSize?.(w, h);
    this.ldrRT.setSize(w, h);
  }

  render() {
    const r = this.renderer;
    r.setRenderTarget(this.sceneRT);
    r.clear();
    r.render(this.scene, this.camera);

    let src = this.sceneRT;
    if (this.aoEnabled) {
      this.gtao.renderToScreen = false;
      this.gtao.render(r, this.fxRT, this.sceneRT);
      src = this.fxRT;
    }
    if (this.bloomEnabled) {
      // le halo se compose directement dans le buffer source
      this.bloom.render(r, null, src);
    }
    this.present(src);
    r.setRenderTarget(null);
  }

  dispose() {
    this.sceneRT.dispose();
    this.fxRT.dispose();
    this.gtao.dispose();
    this.bloom.dispose();
    this.output.dispose();
    this.ldrRT.dispose();
    this.grade.dispose();
    this._gradeQuad.dispose();
  }
}
