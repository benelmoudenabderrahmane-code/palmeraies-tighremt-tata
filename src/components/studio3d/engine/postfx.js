import * as THREE from 'three';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

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
  }

  setSize(w, h) {
    this.sceneRT.setSize(w, h);
    this.fxRT.setSize(w, h);
    this.gtao.setSize(w, h);
    this.bloom.setSize(w, h);
    this.output.setSize?.(w, h);
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
    this.output.render(r, null, src);
    r.setRenderTarget(null);
  }

  dispose() {
    this.sceneRT.dispose();
    this.fxRT.dispose();
    this.gtao.dispose();
    this.bloom.dispose();
    this.output.dispose();
  }
}
