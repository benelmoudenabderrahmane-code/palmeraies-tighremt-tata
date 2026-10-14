/*
 * Mode présentation : planches HD avec cartouche, vidéo de la visite
 * (titres, légendes, générique) et archive .zip — sans dépendance.
 */

export const ASSO = {
  name: 'Association Palmeraies Tighremt Tata',
  project: 'Aménagement du site de Sidi Ouaziz',
  place: 'Douar Tighremt · Province de Tata · Maroc',
  email: 'palmeraies.tighremt.tata@gmail.com',
  site: 'association-palmeraies-tighremt.com',
  gps: '29°46′22.6″ N · 7°58′22.8″ O',
};

/** Planches proposées (caméra en mètres, heure locale) */
export const SHOTS = [
  { id: 'ensemble', title: 'Vue d’ensemble du site', caption: 'Terrain, jardins collaboratifs et bassin au pied de la montagne', pos: [165, 62, 175], target: [-12, 0, -18], hour: 17 },
  { id: 'aerienne', title: 'Vue aérienne', caption: 'Implantation conforme au plan d’aménagement au 1:500', pos: [-8, 330, 150], target: [-8, 0, -45], hour: 11, fov: 38 },
  { id: 'terrain', title: 'Le terrain de football', caption: 'Aire de jeu nivelée, marquage, buts neufs et allée pour les spectateurs', pos: [38, 14, 82], target: [0, 0, 12], hour: 16.5 },
  { id: 'vestiaire', title: 'Le vestiaire et le bassin de rétention', caption: 'Le vestiaire construit en 2018–2019 et le dispositif hydraulique', pos: [-22, 9, 32], target: [-62, 1, 8], hour: 17.25 },
  { id: 'jardins', title: 'Les jardins collaboratifs', caption: 'Parcelles cultivées par les familles, palmiers dattiers et allées ombragées', pos: [-18, 2.4, -52], target: [-42, 3.5, -82], hour: 16 },
  { id: 'avant-apres', title: 'Aujourd’hui / Demain', caption: 'De la terre nue à un lieu de vie partagé', pos: [120, 45, 130], target: [-10, 0, -10], hour: 17, diptych: true },
  { id: 'nuit', title: 'Le site en soirée', caption: 'Proposition d’éclairage solaire de l’allée et du terrain', pos: [110, 38, 120], target: [0, 0, 0], hour: 20.75 },
];

/** Parcours de la vidéo : position caméra, point visé, légende */
export const TOUR = [
  { pos: [230, 120, 260], look: [-10, 0, -20], caption: 'Le site de Sidi Ouaziz, à l’est de la palmeraie de Tighremt' },
  { pos: [120, 45, 140], look: [-5, 0, 0], caption: 'Un terrain de football aménagé pour la jeunesse du douar' },
  { pos: [40, 10, 70], look: [0, 1, 0], caption: 'Une allée périphérique pour les spectateurs' },
  { pos: [-15, 6, 40], look: [-50, 2, 5], caption: 'Le vestiaire, construit par l’association en 2018–2019' },
  { pos: [-45, 7, 45], look: [-70, 1, 12], caption: 'Le bassin de rétention, alimenté par un puits' },
  { pos: [-80, 3, -10], look: [-55, 3, -60], caption: 'Des jardins collaboratifs cultivés par les familles' },
  { pos: [-30, 2.6, -55], look: [-10, 4, -95], caption: 'Palmiers dattiers et allées ombragées' },
  { pos: [40, 30, -150], look: [-10, 0, -175], caption: 'Le city stade réalisé par l’État, juste au nord' },
  { pos: [170, 70, -40], look: [-10, 0, -40], caption: 'Un lieu de vie partagé, entre sport, nature et partage' },
  { pos: [200, 95, 200], look: [-10, 0, -20], caption: 'Un projet porté par l’Association Palmeraies Tighremt Tata' },
];

/* ----------------------------- chargement ----------------------------- */

let logoPromise = null;
export function loadLogo() {
  if (!logoPromise) {
    logoPromise = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = '/logo.png';
    });
  }
  return logoPromise;
}

export async function ensureFonts() {
  try {
    await Promise.all([
      document.fonts.load('500 40px "Cormorant Garamond"'),
      document.fonts.load('italic 500 40px "Cormorant Garamond"'),
      document.fonts.load('600 20px "Plus Jakarta Sans"'),
    ]);
  } catch { /* polices système en secours */ }
}

const SERIF = '"Cormorant Garamond", Georgia, serif';
const SANS = '"Plus Jakarta Sans", system-ui, sans-serif';

export function monthYear() {
  return new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

/* ------------------------------ cartouche ------------------------------ */

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawLogo(ctx, logo, cx, cy, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  if (logo) {
    ctx.clip();
    const s = r * 1.86;
    ctx.drawImage(logo, cx - s / 2, cy - s / 2, s, s);
  }
  ctx.restore();
}

/** Cartouche en bas de planche (titre de vue, projet, association) */
export function drawCartouche(ctx, w, h, { title, caption, index, total, logo }) {
  const u = h / 1080; // unité relative
  const bandH = 190 * u;
  const g = ctx.createLinearGradient(0, h - bandH * 1.9, 0, h);
  g.addColorStop(0, 'rgba(8,24,14,0)');
  g.addColorStop(0.45, 'rgba(8,24,14,0.62)');
  g.addColorStop(1, 'rgba(8,24,14,0.9)');
  ctx.fillStyle = g;
  ctx.fillRect(0, h - bandH * 1.9, w, bandH * 1.9);

  const pad = 64 * u;
  const base = h - pad;
  drawLogo(ctx, logo, pad + 40 * u, base - 46 * u, 40 * u);

  const x = pad + 104 * u;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#d4b483';
  ctx.font = `600 ${17 * u}px ${SANS}`;
  ctx.letterSpacing = `${3 * u}px`;
  ctx.fillText(`${ASSO.project.toUpperCase()}${index ? `  ·  PLANCHE ${index}/${total}` : ''}`, x, base - 82 * u);
  ctx.letterSpacing = '0px';
  ctx.fillStyle = '#ffffff';
  ctx.font = `500 ${54 * u}px ${SERIF}`;
  ctx.fillText(title, x, base - 30 * u);
  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.font = `400 ${21 * u}px ${SANS}`;
  ctx.fillText(caption || '', x, base + 2 * u);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.font = `600 ${19 * u}px ${SANS}`;
  ctx.fillText(ASSO.name, w - pad, base - 30 * u);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = `400 ${16 * u}px ${SANS}`;
  ctx.fillText(ASSO.place, w - pad, base - 6 * u);
  ctx.fillText(`Vue 3D indicative · ${monthYear()}`, w - pad, base + 16 * u);
  ctx.textAlign = 'left';

  // flèche du nord discrète en haut à droite
  ctx.save();
  ctx.translate(w - pad - 26 * u, pad + 30 * u);
  ctx.fillStyle = 'rgba(8,24,14,0.55)';
  ctx.beginPath();
  ctx.arc(0, 0, 30 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d4b483';
  ctx.font = `600 ${22 * u}px ${SERIF}`;
  ctx.textAlign = 'center';
  ctx.fillText('N', 0, 10 * u);
  ctx.restore();
}

/** Étiquette de demi-image (diptyque avant / après) */
export function drawTag(ctx, x, y, text, u, dark) {
  ctx.font = `600 ${20 * u}px ${SANS}`;
  ctx.letterSpacing = `${2 * u}px`;
  const tw = ctx.measureText(text).width;
  roundRect(ctx, x, y, tw + 36 * u, 46 * u, 23 * u);
  ctx.fillStyle = dark ? '#133d20' : '#c2652a';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, x + 18 * u, y + 30 * u);
  ctx.letterSpacing = '0px';
}

/* ------------------------- habillage de la vidéo ------------------------- */

const ease = (x) => Math.max(0, Math.min(1, x));

/** Dessine titres, légendes et générique sur l'image (t ∈ [0, 1]) */
export function drawVideoOverlay(ctx, t, w, h, duration, logo) {
  const u = h / 1080;
  const sec = t * duration;
  const end = duration - sec;

  // filigrane permanent
  ctx.save();
  ctx.globalAlpha = 0.9 * ease((sec - 3) / 1) * ease((end - 3.5) / 1);
  drawLogo(ctx, logo, 58 * u, 58 * u, 26 * u);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 8 * u;
  ctx.font = `600 ${18 * u}px ${SANS}`;
  ctx.fillText(ASSO.name, 98 * u, 54 * u);
  ctx.font = `400 ${15 * u}px ${SANS}`;
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText(ASSO.project, 98 * u, 76 * u);
  ctx.restore();

  // légende de la séquence en cours
  const n = TOUR.length - 1;
  const segF = t * n;
  const seg = Math.min(n - 1, Math.floor(segF));
  const local = segF - seg;
  const cap = TOUR[seg].caption;
  const capAlpha = ease(local / 0.12) * ease((1 - local) / 0.12) * ease((sec - 4) / 0.6) * ease((end - 4.5) / 0.6);
  if (capAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = capAlpha;
    ctx.font = `500 ${34 * u}px ${SERIF}`;
    const tw = ctx.measureText(cap).width;
    const x = 64 * u, y = h - 120 * u;
    roundRect(ctx, x - 26 * u, y - 46 * u, tw + 52 * u, 72 * u, 12 * u);
    ctx.fillStyle = 'rgba(8,24,14,0.72)';
    ctx.fill();
    ctx.fillStyle = '#d4b483';
    ctx.fillRect(x - 26 * u, y - 46 * u, 4 * u, 72 * u);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(cap, x, y + 2 * u);
    ctx.restore();
  }

  // titre d'ouverture
  const intro = 1 - ease((sec - 2.6) / 1.4);
  if (intro > 0) titleCard(ctx, w, h, u, intro, logo, [
    { text: ASSO.name.toUpperCase(), font: `600 ${20 * u}px ${SANS}`, color: '#d4b483', spacing: 5 },
    { text: 'Aménagement du site', font: `500 ${84 * u}px ${SERIF}`, color: '#ffffff' },
    { text: 'de Sidi Ouaziz', font: `italic 500 ${84 * u}px ${SERIF}`, color: '#d4b483' },
    { text: 'Terrain de football · Bassin de rétention · Jardins collaboratifs', font: `400 ${24 * u}px ${SANS}`, color: 'rgba(255,255,255,0.85)' },
  ]);

  // générique de fin
  const outro = ease((4.2 - end) / 1.2);
  if (outro > 0) titleCard(ctx, w, h, u, outro, logo, [
    { text: '« Redonner vie à la terre, rassembler les générations »', font: `italic 500 ${50 * u}px ${SERIF}`, color: '#ffffff' },
    { text: ASSO.name, font: `600 ${26 * u}px ${SANS}`, color: '#d4b483' },
    { text: `${ASSO.email}  ·  ${ASSO.site}`, font: `400 ${22 * u}px ${SANS}`, color: 'rgba(255,255,255,0.85)' },
    { text: `${ASSO.place}  ·  GPS ${ASSO.gps}`, font: `400 ${18 * u}px ${SANS}`, color: 'rgba(255,255,255,0.65)' },
  ]);
}

function titleCard(ctx, w, h, u, alpha, logo, lines) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
  g.addColorStop(0, 'rgba(10,32,18,0.82)');
  g.addColorStop(1, 'rgba(6,18,10,0.95)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  drawLogo(ctx, logo, w / 2, h / 2 - 210 * u, 62 * u);
  ctx.textAlign = 'center';
  let y = h / 2 - 90 * u;
  for (const l of lines) {
    ctx.font = l.font;
    ctx.fillStyle = l.color;
    ctx.letterSpacing = `${(l.spacing || 0) * u}px`;
    const size = parseFloat(l.font.match(/(\d+(\.\d+)?)px/)[1]);
    y += size * 1.15;
    ctx.fillText(l.text, w / 2, y);
    ctx.letterSpacing = '0px';
  }
  ctx.restore();
}

/* --------------------------------- zip --------------------------------- */

const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Archive .zip non compressée (les PNG sont déjà compressés) */
export function makeZip(files) {
  const enc = new TextEncoder();
  const parts = [];
  const central = [];
  let offset = 0;
  const d = new Date();
  const dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  for (const f of files) {
    const name = enc.encode(f.name);
    const data = f.data;
    const crc = crc32(data);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true);
    lh.setUint16(4, 20, true);
    lh.setUint16(6, 0x0800, true); // noms en UTF-8
    lh.setUint16(8, 0, true);
    lh.setUint16(10, dosTime, true);
    lh.setUint16(12, dosDate, true);
    lh.setUint32(14, crc, true);
    lh.setUint32(18, data.length, true);
    lh.setUint32(22, data.length, true);
    lh.setUint16(26, name.length, true);
    lh.setUint16(28, 0, true);
    parts.push(lh, name, data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true);
    ch.setUint16(4, 20, true);
    ch.setUint16(6, 20, true);
    ch.setUint16(8, 0x0800, true);
    ch.setUint16(10, 0, true);
    ch.setUint16(12, dosTime, true);
    ch.setUint16(14, dosDate, true);
    ch.setUint32(16, crc, true);
    ch.setUint32(20, data.length, true);
    ch.setUint32(24, data.length, true);
    ch.setUint16(28, name.length, true);
    ch.setUint32(42, offset, true);
    central.push(ch, name);
    offset += 30 + name.length + data.length;
  }
  const cdSize = central.reduce((s, p) => s + (p.byteLength ?? p.length), 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, cdSize, true);
  end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end], { type: 'application/zip' });
}

export function canvasToBlob(canvas, type = 'image/png', quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Meilleure méthode d'export vidéo disponible :
 *  1. WebCodecs + MP4 H.264 (image par image, lisible partout)
 *  2. WebCodecs + WebM VP9
 *  3. MediaRecorder (temps réel) en dernier recours
 */
export async function detectVideoFormat(width, height) {
  if (typeof window !== 'undefined' && 'VideoEncoder' in window) {
    try {
      const { canEncodeVideo, QUALITY_HIGH } = await import('mediabunny');
      for (const [codec, ext, label] of [['avc', 'mp4', 'MP4 (H.264)'], ['vp9', 'webm', 'WebM (VP9)']]) {
        if (await canEncodeVideo(codec, { width, height, quality: QUALITY_HIGH })) {
          return { kind: 'webcodecs', codec, ext, label };
        }
      }
    } catch { /* repli ci-dessous */ }
  }
  const mime = pickVideoMime();
  if (!mime) return null;
  const mp4 = mime.startsWith('video/mp4');
  return { kind: 'recorder', mime, ext: mp4 ? 'mp4' : 'webm', label: mp4 ? 'MP4' : 'WebM' };
}

/**
 * Recompresse une vidéo dans le navigateur (WebCodecs) : redimensionnement
 * et débit réduit, sans refaire le rendu 3D. Renvoie un Blob.
 */
export async function compressVideo(blob, { width, height, bitrate, codec, onProgress }) {
  const mb = await import('mediabunny');
  const isMp4 = codec === 'avc';
  const input = new mb.Input({ source: new mb.BlobSource(blob), formats: mb.ALL_FORMATS });
  // jamais d'agrandissement ni de débit supérieur à l'original
  const track = await input.getPrimaryVideoTrack();
  if (!track) throw new Error('aucune piste vidéo trouvée');
  if (track.displayHeight && track.displayHeight < height) {
    width = Math.round((track.displayWidth * height) / track.displayHeight) || width;
    height = track.displayHeight;
    width = Math.min(width, track.displayWidth);
  }
  const duration = await input.computeDuration().catch(() => 0);
  if (duration > 0) bitrate = Math.min(bitrate, Math.round(((blob.size * 8) / duration) * 0.6));
  width -= width % 2;
  height -= height % 2;
  const output = new mb.Output({
    format: isMp4 ? new mb.Mp4OutputFormat({ fastStart: 'in-memory' }) : new mb.WebMOutputFormat(),
    target: new mb.BufferTarget(),
  });
  const conversion = await mb.Conversion.init({
    input,
    output,
    video: { width, height, fit: 'contain', codec, quality: new mb.Quality({ bitrate: Math.round(bitrate) }), keyFrameInterval: 4, forceTranscode: true },
    showWarnings: false,
  });
  if (!conversion.isValid) {
    const why = conversion.discardedTracks.map((d) => d.reason).join(', ');
    throw new Error(`format non pris en charge par ce navigateur${why ? ` (${why})` : ''}`);
  }
  if (onProgress) conversion.onProgress = (p) => onProgress(p);
  await conversion.execute();
  return new Blob([output.target.buffer], { type: isMp4 ? 'video/mp4' : 'video/webm' });
}

/** Format MediaRecorder (repli) : H.264 d'abord, puis WebM, puis MP4 générique (Safari) */
export function pickVideoMime() {
  if (typeof MediaRecorder === 'undefined') return null;
  const list = [
    'video/mp4;codecs=avc1.640028',
    'video/mp4;codecs=avc1.4d0028',
    'video/mp4;codecs=avc1',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ];
  return list.find((m) => MediaRecorder.isTypeSupported(m)) || null;
}
