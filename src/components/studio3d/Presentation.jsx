'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Images, Film, Download, LoaderCircle, Square, Info } from 'lucide-react';
import {
  SHOTS, TOUR, ASSO, loadLogo, ensureFonts, drawCartouche, drawTag, drawVideoOverlay,
  makeZip, canvasToBlob, detectVideoFormat,
} from './presentation';
import { saveFile } from './saveFile';

const RES = {
  '4k': { w: 3840, h: 2160, label: '4K · 3840 × 2160' },
  hd: { w: 1920, h: 1080, label: 'Full HD · 1920 × 1080' },
};
const VRES = {
  '1080': { w: 1920, h: 1080, label: '1080p' },
  '720': { w: 1280, h: 720, label: '720p (plus léger)' },
};

/**
 * Mode présentation : génère les planches (images avec cartouche) et la
 * vidéo de la visite, prêtes à joindre au dossier.
 */
export default function Presentation({ engine, onClose, notify }) {
  const [tab, setTab] = useState('images');
  const [selected, setSelected] = useState(() => new Set(SHOTS.map((s) => s.id)));
  const [res, setRes] = useState('4k');
  const [cartouche, setCartouche] = useState(true);
  const [busy, setBusy] = useState(null); // { label, progress }
  const [results, setResults] = useState([]); // { id, title, url, blob, name }
  const [vDur, setVDur] = useState(45);
  const [vRes, setVRes] = useState('1080');
  const [sunset, setSunset] = useState(true);
  const [video, setVideo] = useState(null); // { url, name, mime }
  const [format, setFormat] = useState(undefined); // undefined = détection en cours
  const cancelRef = useRef(false);

  useEffect(() => {
    let alive = true;
    const { w, h } = VRES[vRes];
    detectVideoFormat(w, h).then((f) => alive && setFormat(f));
    return () => { alive = false; };
  }, [vRes]);

  useEffect(() => () => {
    results.forEach((r) => URL.revokeObjectURL(r.url));
    if (video) URL.revokeObjectURL(video.url);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id) => setSelected((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  /* ------------------------------ planches ------------------------------ */

  const generateStills = async () => {
    const list = SHOTS.filter((s) => selected.has(s.id));
    if (!list.length) return;
    cancelRef.current = false;
    results.forEach((r) => URL.revokeObjectURL(r.url));
    setResults([]);
    const { w, h } = RES[res];
    const logo = await loadLogo();
    await ensureFonts();
    const out = [];
    for (let i = 0; i < list.length; i++) {
      if (cancelRef.current) break;
      const shot = list[i];
      setBusy({ label: `Rendu de « ${shot.title} » (${i + 1}/${list.length})…`, progress: i / list.length });
      await new Promise((r) => setTimeout(r, 60)); // laisse l'interface respirer
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (shot.diptych) {
        const half = Math.round(w / 2);
        const a = engine.renderStill({ ...shot, mode: 'avant', width: half, height: h });
        const b = engine.renderStill({ ...shot, mode: 'apres', width: w - half, height: h });
        ctx.drawImage(a, 0, 0);
        ctx.drawImage(b, half, 0);
        ctx.fillStyle = '#f3ecdf';
        ctx.fillRect(half - 3, 0, 6, h);
        const u = h / 1080;
        drawTag(ctx, 48 * u, 48 * u, 'AUJOURD’HUI', u, false);
        drawTag(ctx, half + 48 * u, 48 * u, 'DEMAIN · PROJET', u, true);
      } else {
        ctx.drawImage(engine.renderStill({ ...shot, width: w, height: h }), 0, 0);
      }
      if (cartouche) drawCartouche(ctx, w, h, { title: shot.title, caption: shot.caption, index: i + 1, total: list.length, logo });
      const blob = await canvasToBlob(canvas);
      const name = `${String(i + 1).padStart(2, '0')}-sidi-ouaziz-${shot.id}${res === '4k' ? '-4k' : ''}.png`;
      const item = { id: shot.id, title: shot.title, url: URL.createObjectURL(blob), blob, name };
      out.push(item);
      setResults((r) => [...r, item]);
    }
    setBusy(null);
    if (out.length) notify(`${out.length} planche${out.length > 1 ? 's' : ''} prête${out.length > 1 ? 's' : ''}.`);
  };

  const downloadZip = async () => {
    setBusy({ label: 'Préparation de l’archive…', progress: 1 });
    const files = await Promise.all(results.map(async (r) => ({ name: r.name, data: new Uint8Array(await r.blob.arrayBuffer()) })));
    files.push({ name: 'LISEZ-MOI.txt', data: new TextEncoder().encode(readme(results)) });
    setBusy(null);
    await save(makeZip(files), 'planches-sidi-ouaziz.zip');
  };

  /* ------------------------------- vidéo -------------------------------- */

  const recordVideo = async () => {
    if (!format) return;
    if (video) URL.revokeObjectURL(video.url);
    setVideo(null);
    const logo = await loadLogo();
    await ensureFonts();
    const { w, h } = VRES[vRes];
    const realtime = format.kind === 'recorder';
    setBusy({
      label: realtime ? 'Enregistrement de la visite… gardez cet onglet ouvert et visible.' : 'Calcul de la vidéo image par image…',
      progress: 0,
      video: true,
    });
    const common = {
      keyframes: TOUR,
      width: w,
      height: h,
      duration: vDur,
      hourFrom: sunset ? 16.25 : null,
      hourTo: sunset ? 20.9 : null,
      overlay: (ctx, t, cw, ch, d) => drawVideoOverlay(ctx, t, cw, ch, d, logo),
      onProgress: (p) => setBusy((b) => (b ? { ...b, progress: p } : b)),
    };
    try {
      const blob = realtime
        ? await engine.recordTour({ ...common, mime: format.mime })
        : await engine.renderTourVideo({ ...common, codec: format.codec });
      setVideo({ blob, url: URL.createObjectURL(blob), name: `visite-sidi-ouaziz-${vRes}p.${format.ext}`, size: blob.size });
      notify('Vidéo prête.');
    } catch (e) {
      if (e?.message !== 'cancelled') {
        console.error(e);
        notify('L’export vidéo a échoué sur ce navigateur.');
      }
    }
    setBusy(null);
  };

  const save = async (blob, name) => {
    try {
      await saveFile(blob, name);
    } catch {
      notify('Enregistrement impossible ici.');
    }
  };

  const cancel = () => {
    cancelRef.current = true;
    engine.cancelRecording();
  };


  return (
    <div className="s3d-modal" role="dialog" aria-modal="true" aria-label="Mode présentation" onKeyDown={(e) => e.stopPropagation()}>
      <div className={`s3d-modal-card ${busy?.video ? 'is-recording' : ''}`}>
        <header className="s3d-modal-hd">
          <div>
            <span className="s3d-kicker">Mode présentation</span>
            <h3>Documents pour les autorités de la <em>Province de Tata</em></h3>
          </div>
          <button className="s3d-close" onClick={onClose} disabled={!!busy} aria-label="Fermer"><X size={18} /></button>
        </header>

        <div className="s3d-modal-tabs">
          <button className={tab === 'images' ? 'is-active' : ''} onClick={() => setTab('images')} disabled={!!busy}><Images size={15} /> Planches HD</button>
          <button className={tab === 'video' ? 'is-active' : ''} onClick={() => setTab('video')} disabled={!!busy}><Film size={15} /> Vidéo de la visite</button>
        </div>

        {tab === 'images' && (
          <div className="s3d-modal-body">
            <p className="s3d-help">Chaque planche est rendue avec la meilleure qualité (ombres, occlusion ambiante) et un cartouche au nom de l’association. Le projet tel que vous l’avez modifié est utilisé.</p>
            <div className="s3d-shots">
              {SHOTS.map((s, i) => (
                <label key={s.id} className={`s3d-shot ${selected.has(s.id) ? 'is-on' : ''}`}>
                  <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} disabled={!!busy} />
                  <span className="n">{i + 1}</span>
                  <span className="t">
                    <b>{s.title}</b>
                    <em>{s.caption}</em>
                  </span>
                </label>
              ))}
            </div>
            <div className="s3d-opts">
              <label>Définition
                <select className="s3d-text" value={res} onChange={(e) => setRes(e.target.value)} disabled={!!busy}>
                  {Object.entries(RES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </label>
              <label className="s3d-check">
                <input type="checkbox" checked={cartouche} onChange={(e) => setCartouche(e.target.checked)} disabled={!!busy} />
                Cartouche (logo, titre, légende)
              </label>
            </div>
            <div className="s3d-modal-actions">
              <button className="s3d-primary" onClick={generateStills} disabled={!!busy || !selected.size}>
                {busy && !busy.video ? <LoaderCircle size={16} className="spin" /> : <Images size={16} />}
                Générer {selected.size} planche{selected.size > 1 ? 's' : ''}
              </button>
              {results.length > 0 && !busy && (
                <button className="s3d-secondary" onClick={downloadZip}><Download size={16} /> Tout télécharger (.zip)</button>
              )}
            </div>
            {results.length > 0 && (
              <div className="s3d-results">
                {results.map((r) => (
                  <button type="button" key={r.id} onClick={() => save(r.blob, r.name)} className="s3d-result" title={`Télécharger ${r.name}`}>
                    <img src={r.url} alt={r.title} />
                    <span>{r.title}</span>
                    <Download size={14} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'video' && (
          <div className="s3d-modal-body">
            {format === null ? (
              <p className="s3d-warn"><Info size={16} /> Ce navigateur ne permet pas d’enregistrer de vidéo. Utilisez Chrome, Edge ou Safari récents.</p>
            ) : (
              <>
                <p className="s3d-help">
                  Survol cinématographique du site avec titre d’ouverture, légendes des différentes zones et générique (coordonnées de l’association).
                  {format?.kind === 'recorder'
                    ? `Ce navigateur enregistre en temps réel : gardez l’onglet visible pendant ${vDur} secondes.`
                    : 'La vidéo est calculée image par image (30 images/s) : la qualité ne dépend pas de la puissance de l’ordinateur.'}
                </p>
                <ol className="s3d-tourlist">
                  {TOUR.slice(0, -1).map((k, i) => <li key={i}>{k.caption}</li>)}
                </ol>
                <div className="s3d-opts">
                  <label>Durée
                    <select className="s3d-text" value={vDur} onChange={(e) => setVDur(+e.target.value)} disabled={!!busy}>
                      <option value={30}>30 secondes</option>
                      <option value={45}>45 secondes</option>
                      <option value={60}>1 minute</option>
                      <option value={90}>1 min 30</option>
                    </select>
                  </label>
                  <label>Définition
                    <select className="s3d-text" value={vRes} onChange={(e) => setVRes(e.target.value)} disabled={!!busy}>
                      {Object.entries(VRES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </label>
                  <label className="s3d-check">
                    <input type="checkbox" checked={sunset} onChange={(e) => setSunset(e.target.checked)} disabled={!!busy} />
                    Du jour à la nuit (coucher de soleil, éclairage allumé)
                  </label>
                </div>
                <div className="s3d-modal-actions">
                  {busy?.video ? (
                    <button className="s3d-secondary" onClick={cancel}><Square size={14} /> Arrêter</button>
                  ) : (
                    <button className="s3d-primary" onClick={recordVideo} disabled={!!busy || !format}><Film size={16} /> Créer la vidéo</button>
                  )}
                  <span className="s3d-format">
                    Format : {format === undefined ? 'détection…' : format.ext === 'mp4' ? `${format.label} — lisible partout` : `${format.label} — lisible avec Chrome, Firefox ou VLC`}
                  </span>
                </div>
                {video && (
                  <div className="s3d-video">
                    <video src={video.url} controls playsInline />
                    <button type="button" className="s3d-primary" onClick={() => save(video.blob, video.name)}><Download size={16} /> Télécharger ({(video.size / 1e6).toFixed(1)} Mo)</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {busy && (
          <div className="s3d-progress">
            <div className="lbl">{busy.label}</div>
            <div className="bar"><span style={{ width: `${Math.round((busy.progress || 0) * 100)}%` }} /></div>
            {!busy.video && <button className="s3d-link" onClick={cancel}>Annuler</button>}
          </div>
        )}
      </div>
    </div>
  );
}

function readme(results) {
  return [
    `${ASSO.project} — planches de présentation`,
    ASSO.name,
    ASSO.place,
    '',
    'Contenu :',
    ...results.map((r) => `  - ${r.name} : ${r.title}`),
    '',
    'Vues 3D indicatives établies d’après le plan d’implantation au 1:500.',
    `Contact : ${ASSO.email} · ${ASSO.site}`,
    '',
  ].join('\r\n');
}
