/*
 * Garde-fous pour la carte graphique. Le tracé de chemins envoie des
 * calculs très lourds : enchaînés sans attendre, ils saturent la carte,
 * l'écran et la souris ne répondent plus et il faut redémarrer
 * l'ordinateur. On n'envoie donc une nouvelle tuile que lorsque la
 * précédente est terminée.
 */

/** Pose un repère dans la file de travail de la carte graphique */
export function gpuFence(renderer) {
  const gl = renderer.getContext();
  if (!gl.fenceSync) return null;
  const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
  gl.flush();
  return sync;
}

/** Le travail envoyé avant le repère est-il terminé ? */
export function gpuFenceDone(renderer, sync) {
  if (!sync) return true;
  const gl = renderer.getContext();
  if (gl.clientWaitSync(sync, 0, 0) === gl.TIMEOUT_EXPIRED) return false;
  gl.deleteSync(sync);
  return true;
}

/** Attend (sans bloquer la page) que le travail avant le repère soit fini */
export function gpuWait(renderer, sync) {
  return new Promise((resolve) => {
    const check = () => (gpuFenceDone(renderer, sync) ? resolve() : setTimeout(check, 2));
    check();
  });
}

/** Carte graphique intégrée ou rendu logiciel : qualité allégée par défaut */
export function isWeakGPU(renderer) {
  try {
    const gl = renderer.getContext();
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
    return /intel|iris|uhd|hd graphics|radeon(\(tm\))? graphics|mali|adreno|powervr|swiftshader|llvmpipe|software|basic render/i.test(name)
      && !/\barc\b/i.test(name); // Intel Arc : carte dédiée
  } catch {
    return false;
  }
}
