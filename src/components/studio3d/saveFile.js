/**
 * Enregistre un fichier généré. Dans une page hébergée par claude.ai, les
 * téléchargements passent par la capacité « downloads » (le visiteur
 * confirme) ; ailleurs, un lien de téléchargement classique suffit.
 */
let downloadsPromise = null;
function getDownloads() {
  if (!downloadsPromise) {
    downloadsPromise = typeof window !== 'undefined' && window.claude?.use
      ? window.claude.use('downloads').catch(() => null)
      : Promise.resolve(null);
  }
  return downloadsPromise;
}

/** true si le format peut être proposé dans cet environnement */
export async function canSave(filename) {
  const d = await getDownloads();
  if (!d) return true;
  const ext = filename.split('.').pop().toLowerCase();
  return ['gif', 'png', 'jpg', 'jpeg', 'webp', 'mp4', 'webm', 'txt', 'json', 'md', 'zip', 'csv', 'pdf'].includes(ext);
}

/** Renvoie true si le fichier a été remis au navigateur */
export async function saveFile(blob, filename) {
  const d = await getDownloads();
  if (d) {
    try {
      await d.save({ filename, data: blob });
      return true;
    } catch (e) {
      if (e?.code === 'declined') return false;
      throw e;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return true;
}
