'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import Link from 'next/link';
import {
  MousePointer2, RotateCw, Scaling, Ruler, Magnet, Box, Map as MapIcon, Footprints, Clapperboard,
  Undo2, Redo2, Upload, Camera, Layers, Library, ListTree, Trash2, Copy, Lock, LockOpen,
  Eye, EyeOff, Sun, Moon, Focus, RefreshCcw, ArrowLeft, Info, Search, X, FileJson, Rotate3d, Pause,
} from 'lucide-react';
import { StudioEngine } from './engine/Engine';
import { buildInitialEntities, polygonArea, SITE } from './engine/planData';
import {
  CATALOG, CATEGORIES, PLAN_FIELDS, STATUS, LAYERS, DEFAULT_LAYERS, newEntity, ghostEntity,
} from './catalog';
import './studio3d.css';

const STORAGE_KEY = 'studio3d-sidi-ouaziz-v1';
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const MONTH_DAY = [15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349];

/* ------------------------- état + historique ------------------------- */

function reducer(state, action) {
  const commit = (entities) => ({
    past: [...state.past.slice(-79), state.entities],
    entities,
    future: [],
  });
  switch (action.type) {
    case 'load':
      return { past: [], entities: action.entities, future: [] };
    case 'add':
      return commit([...state.entities, ...[].concat(action.entity)]);
    case 'update':
      return commit(state.entities.map((e) => (e.id === action.id ? { ...e, ...action.patch } : e)));
    case 'updateProps':
      return commit(state.entities.map((e) => (e.id === action.id ? { ...e, props: { ...e.props, ...action.props } } : e)));
    case 'remove':
      return commit(state.entities.filter((e) => !action.ids.includes(e.id)));
    case 'undo':
      if (!state.past.length) return state;
      return { past: state.past.slice(0, -1), entities: state.past[state.past.length - 1], future: [state.entities, ...state.future] };
    case 'redo':
      if (!state.future.length) return state;
      return { past: [...state.past, state.entities], entities: state.future[0], future: state.future.slice(1) };
    default:
      return state;
  }
}

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return Array.isArray(data?.entities) ? data : null;
  } catch {
    return null;
  }
}

/* ============================== composant ============================== */

export default function Studio3D() {
  const mountRef = useRef(null);
  const engineRef = useRef(null);
  const fileRef = useRef(null);
  const [state, dispatch] = useReducer(reducer, null, () => ({ past: [], entities: buildInitialEntities(), future: [] }));
  const { entities } = state;
  const [selectedId, setSelectedId] = useState(null);
  const [tool, setTool] = useState('select');
  const [tmode, setTmode] = useState('translate');
  const [view, setView] = useState('orbit');
  const [snap, setSnap] = useState(false);
  const [layers, setLayers] = useState(DEFAULT_LAYERS);
  const [planOpacity, setPlanOpacity] = useState(0.85);
  const [mode, setMode] = useState('apres');
  const [hour, setHour] = useState(17);
  const [month, setMonth] = useState(3);
  const [sunInfo, setSunInfo] = useState(null);
  const [leftTab, setLeftTab] = useState('library');
  const [measures, setMeasures] = useState([]);
  const [measurePreview, setMeasurePreview] = useState(null);
  const [touring, setTouring] = useState(false);
  const [toast, setToast] = useState(null);
  const [query, setQuery] = useState('');
  const [ready, setReady] = useState(false);
  const [webglError, setWebglError] = useState(false);
  const [panelsOpen, setPanelsOpen] = useState({ left: true, right: true });
  const [savedAt, setSavedAt] = useState(null);

  const selected = useMemo(() => entities.find((e) => e.id === selectedId) || null, [entities, selectedId]);
  const notify = useCallback((msg) => {
    setToast(msg);
    clearTimeout(notify._t);
    notify._t = setTimeout(() => setToast(null), 2600);
  }, []);

  /* ----------------------------- moteur ----------------------------- */

  const cbRef = useRef({});
  cbRef.current = {
    onSelect: (id) => setSelectedId(id),
    onTransform: (id, patch) => dispatch({ type: 'update', id, patch }),
    onPlace: (type, position) => {
      const e = newEntity(type, position);
      dispatch({ type: 'add', entity: e });
      setSelectedId(e.id);
    },
    onMeasures: setMeasures,
    onMeasurePreview: setMeasurePreview,
    ghostEntity,
  };

  useEffect(() => {
    let engine;
    try {
      const test = document.createElement('canvas');
      if (!(test.getContext('webgl2') || test.getContext('webgl'))) throw new Error('webgl');
      engine = new StudioEngine(mountRef.current, {
        onSelect: (...a) => cbRef.current.onSelect(...a),
        onTransform: (...a) => cbRef.current.onTransform(...a),
        onPlace: (...a) => cbRef.current.onPlace(...a),
        onMeasures: (...a) => cbRef.current.onMeasures(...a),
        onMeasurePreview: (...a) => cbRef.current.onMeasurePreview(...a),
        ghostEntity: (...a) => cbRef.current.ghostEntity(...a),
      });
    } catch (err) {
      console.error(err);
      setWebglError(true);
      return undefined;
    }
    engineRef.current = engine;
    if (process.env.NODE_ENV !== 'production' || new URLSearchParams(location.search).has('debug')) window.__studio = engine;
    const saved = loadSaved();
    if (saved) {
      dispatch({ type: 'load', entities: saved.entities });
      setSavedAt(saved.savedAt || null);
    }
    if (window.innerWidth < 900) setPanelsOpen({ left: false, right: false });
    setReady(true);
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => { engineRef.current?.setEntities(entities); }, [entities, ready]);
  useEffect(() => { engineRef.current?.select(selectedId); }, [selectedId, ready]);
  useEffect(() => { engineRef.current?.setLayers(layers); }, [layers, ready]);
  useEffect(() => { engineRef.current?.setPlanOpacity(planOpacity); }, [planOpacity, ready]);
  useEffect(() => { engineRef.current?.setMode(mode); }, [mode, ready]);
  useEffect(() => { engineRef.current?.setTransformMode(tmode); }, [tmode, ready]);
  useEffect(() => { engineRef.current?.setSnapPlacement(snap); }, [snap, ready]);
  useEffect(() => { engineRef.current?.setTool(tool); }, [tool, ready]);
  useEffect(() => {
    if (!engineRef.current) return;
    setSunInfo(engineRef.current.setTime(hour, MONTH_DAY[month]));
  }, [hour, month, ready]);

  // sauvegarde automatique
  useEffect(() => {
    if (!ready) return undefined;
    const t = setTimeout(() => {
      try {
        const now = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, savedAt: now, entities }));
        setSavedAt(now);
      } catch { /* stockage indisponible */ }
    }, 600);
    return () => clearTimeout(t);
  }, [entities, ready]);

  /* ----------------------------- actions ---------------------------- */

  const changeView = useCallback((v) => {
    setView(v);
    setTouring(false);
    engineRef.current?.setView(v);
    if (v === 'walk') notify('Visite à pied : Z/Q/S/D ou flèches pour marcher, glisser pour regarder, Maj pour courir.');
  }, [notify]);

  const removeSelected = useCallback(() => {
    if (!selected) return;
    if (selected.locked) return notify('Élément verrouillé : déverrouillez-le pour le supprimer.');
    dispatch({ type: 'remove', ids: [selected.id] });
    setSelectedId(null);
  }, [selected, notify]);

  const duplicateSelected = useCallback(() => {
    if (!selected) return;
    const copy = {
      ...structuredClone(selected),
      id: `${selected.type}-${Date.now().toString(36)}`,
      name: `${selected.name} (copie)`,
      position: [selected.position[0] + 3, selected.position[1] + 3],
      locked: false,
      added: true,
    };
    dispatch({ type: 'add', entity: copy });
    setSelectedId(copy.id);
  }, [selected]);

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ version: 1, site: SITE, exportedAt: new Date().toISOString(), entities }, null, 2)], { type: 'application/json' });
    download(blob, 'projet-sidi-ouaziz.json');
  };

  const importJSON = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data.entities)) throw new Error();
        dispatch({ type: 'load', entities: data.entities });
        setSelectedId(null);
        notify('Projet importé.');
      } catch {
        notify('Fichier invalide : choisissez un projet .json exporté depuis le Studio.');
      }
    };
    reader.readAsText(file);
  };

  const screenshot = () => {
    const url = engineRef.current?.screenshot(3840, 2160);
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `sidi-ouaziz-${String(hour).padStart(2, '0')}h-4k.png`;
    a.click();
    notify('Capture 4K enregistrée.');
  };

  const exportGLB = async () => {
    notify('Préparation du modèle 3D…');
    try {
      const blob = await engineRef.current.exportGLB();
      download(blob, 'sidi-ouaziz.glb');
      notify('Modèle .glb exporté (Blender, SketchUp, etc.).');
    } catch (e) {
      console.error(e);
      notify('Export impossible sur ce navigateur.');
    }
  };

  const resetProject = () => {
    if (!window.confirm('Revenir au plan d’origine ? Les modifications non exportées seront perdues.')) return;
    dispatch({ type: 'load', entities: buildInitialEntities() });
    setSelectedId(null);
    notify('Plan d’origine rechargé.');
  };

  const toggleTour = () => {
    const eng = engineRef.current;
    if (!eng) return;
    if (touring) {
      eng.stopTour();
      setTouring(false);
    } else {
      setView('orbit');
      eng.setView('orbit');
      eng.startTour(() => setTouring(false));
      setTouring(true);
    }
  };

  // raccourcis clavier
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      const k = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      if (mod && k === 'z' && !e.shiftKey) { e.preventDefault(); dispatch({ type: 'undo' }); return; }
      if (mod && (k === 'y' || (k === 'z' && e.shiftKey))) { e.preventDefault(); dispatch({ type: 'redo' }); return; }
      if (mod && k === 'd') { e.preventDefault(); duplicateSelected(); return; }
      if (mod) return;
      if (k === 'escape') {
        if (touring) toggleTour();
        setTool('select');
        setSelectedId(null);
        return;
      }
      if (k === 'delete' || k === 'backspace') { removeSelected(); return; }
      if (view === 'walk') return;
      if (k === 'v') setTool('select');
      if (k === 'g') { setTool('select'); setTmode('translate'); }
      if (k === 'r') { setTool('select'); setTmode('rotate'); }
      if (k === 'e') { setTool('select'); setTmode('scale'); }
      if (k === 'm') setTool('measure');
      if (k === 'f' && selectedId) engineRef.current?.focus(selectedId);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  /* ----------------------------- calculs ---------------------------- */

  const stats = useMemo(() => {
    const count = (t) => entities.filter((e) => e.type === t).length;
    const parcels = entities.filter((e) => e.type === 'parcelle');
    const gardenArea = parcels.reduce((s, p) => s + polygonArea(p.points) * (p.scale || 1) ** 2, 0);
    const pitch = entities.find((e) => e.type === 'terrain');
    const bassin = entities.find((e) => e.type === 'bassin');
    const vol = bassin ? bassin.props.width * bassin.props.depth * (bassin.props.height - 0.3) * (bassin.scale || 1) ** 3 : 0;
    return {
      palms: count('palmier'),
      olives: count('olivier') + count('arbuste'),
      parcels: parcels.length,
      attributed: parcels.filter((p) => p.props.famille).length,
      gardenArea,
      pitchArea: pitch ? pitch.props.length * pitch.props.width : 0,
      pitchDims: pitch ? `${pitch.props.length} × ${pitch.props.width} m` : '—',
      volume: vol,
      added: entities.filter((e) => e.added).length,
    };
  }, [entities]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = entities.filter((e) => !q || e.name.toLowerCase().includes(q) || (e.props?.famille || '').toLowerCase().includes(q));
    const groups = {};
    for (const e of list) {
      const g = e.type === 'palmier' ? 'Palmiers' : e.type === 'parcelle' ? 'Parcelles' : e.layer === 'existant' ? 'Existant' : e.layer === 'projet' ? 'Projet' : 'Mobilier & ajouts';
      (groups[g] ||= []).push(e);
    }
    return groups;
  }, [entities, query]);

  /* ------------------------------ rendu ------------------------------ */

  const tip = tool.startsWith('place:')
    ? `Cliquez sur le sol pour placer « ${CATALOG[tool.slice(6)]?.label} » · Échap pour terminer`
    : tool === 'measure'
      ? measurePreview != null ? `Distance : ${measurePreview.toFixed(2)} m — cliquez pour fixer` : 'Mesure : cliquez deux points au sol'
      : view === 'walk'
        ? 'Visite à pied · Z/Q/S/D ou flèches · glisser pour regarder · Maj pour courir'
        : selected?.locked
          ? 'Élément du plan verrouillé — déverrouillez-le dans les propriétés pour le modifier'
          : 'Clic : sélectionner · Glisser : tourner la vue · Clic droit : déplacer la vue · Molette : zoom';

  return (
    <div className="s3d">
      {/* ------------------------------ barre haute ------------------------------ */}
      <header className="s3d-top">
        <div className="s3d-brand">
          <Link href="/projets" className="s3d-back" title="Retour au site"><ArrowLeft size={16} /></Link>
          <img src="/logo.png" alt="" width={30} height={30} />
          <div>
            <div className="s3d-title">Studio 3D <em>Sidi Ouaziz</em></div>
            <div className="s3d-sub">Plan d’aménagement · échelle 1:500 · Douar Tighremt, Tata</div>
          </div>
        </div>
        <div className="s3d-actions">
          <IconBtn icon={Undo2} label="Annuler (Ctrl+Z)" onClick={() => dispatch({ type: 'undo' })} disabled={!state.past.length} />
          <IconBtn icon={Redo2} label="Rétablir (Ctrl+Y)" onClick={() => dispatch({ type: 'redo' })} disabled={!state.future.length} />
          <span className="s3d-sep" />
          <IconBtn icon={Camera} label="Capture 4K (PNG)" onClick={screenshot} text="Capture HD" />
          <IconBtn icon={Box} label="Exporter le modèle 3D (.glb)" onClick={exportGLB} text=".glb" />
          <IconBtn icon={FileJson} label="Exporter le projet (.json)" onClick={exportJSON} />
          <IconBtn icon={Upload} label="Importer un projet (.json)" onClick={() => fileRef.current?.click()} />
          <IconBtn icon={RefreshCcw} label="Revenir au plan d’origine" onClick={resetProject} />
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => { if (e.target.files?.[0]) importJSON(e.target.files[0]); e.target.value = ''; }} />
          <span className="s3d-saved" title="Sauvegarde automatique dans ce navigateur">
            {savedAt ? 'Enregistré' : 'Non enregistré'}
          </span>
        </div>
      </header>

      <div className="s3d-body">
        {/* ------------------------------ outils ------------------------------ */}
        <nav className="s3d-tools" aria-label="Outils">
          <ToolBtn icon={MousePointer2} label="Sélection / déplacer (V, G)" active={tool === 'select' && tmode === 'translate'} onClick={() => { setTool('select'); setTmode('translate'); }} />
          <ToolBtn icon={RotateCw} label="Rotation (R)" active={tool === 'select' && tmode === 'rotate'} onClick={() => { setTool('select'); setTmode('rotate'); }} />
          <ToolBtn icon={Scaling} label="Échelle (E)" active={tool === 'select' && tmode === 'scale'} onClick={() => { setTool('select'); setTmode('scale'); }} />
          <ToolBtn icon={Ruler} label="Mesurer (M)" active={tool === 'measure'} onClick={() => setTool(tool === 'measure' ? 'select' : 'measure')} />
          <ToolBtn icon={Magnet} label="Aimanter à la grille (1 m / 15°)" active={snap} onClick={() => setSnap((s) => !s)} />
          <div className="s3d-tools-sep" />
          <ToolBtn icon={Rotate3d} label="Vue 3D" active={view === 'orbit' && !touring} onClick={() => changeView('orbit')} />
          <ToolBtn icon={MapIcon} label="Vue en plan" active={view === 'top'} onClick={() => changeView('top')} />
          <ToolBtn icon={Footprints} label="Visite à pied" active={view === 'walk'} onClick={() => changeView('walk')} />
          <ToolBtn icon={touring ? Pause : Clapperboard} label={touring ? 'Arrêter la visite guidée' : 'Visite guidée (survol)'} active={touring} onClick={toggleTour} />
          <ToolBtn icon={Focus} label="Recentrer la vue" onClick={() => { changeView('orbit'); engineRef.current?.resetCamera(); }} />
        </nav>

        {/* ------------------------------ panneau gauche ------------------------------ */}
        <aside className={`s3d-panel s3d-left ${panelsOpen.left ? '' : 'is-closed'}`}>
          <div className="s3d-tabs" role="tablist">
            <TabBtn icon={Library} label="Bibliothèque" active={leftTab === 'library'} onClick={() => setLeftTab('library')} />
            <TabBtn icon={Layers} label="Calques" active={leftTab === 'layers'} onClick={() => setLeftTab('layers')} />
            <TabBtn icon={ListTree} label="Objets" active={leftTab === 'objects'} onClick={() => setLeftTab('objects')} />
          </div>

          {leftTab === 'library' && (
            <div className="s3d-scroll">
              <p className="s3d-help">Choisissez un élément puis cliquez sur le terrain pour le poser. Vous pouvez en poser plusieurs à la suite.</p>
              {CATEGORIES.map((cat) => (
                <section key={cat.key} className="s3d-cat">
                  <h4>{cat.label}</h4>
                  <div className="s3d-grid">
                    {Object.entries(CATALOG).filter(([, d]) => d.cat === cat.key).map(([type, d]) => {
                      const Icon = d.icon;
                      const active = tool === `place:${type}`;
                      return (
                        <button key={type} className={`s3d-item ${active ? 'is-active' : ''}`} onClick={() => { setTool(active ? 'select' : `place:${type}`); setSelectedId(null); }} title={d.desc || d.label}>
                          <Icon size={20} strokeWidth={1.6} />
                          <span>{d.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}

          {leftTab === 'layers' && (
            <div className="s3d-scroll">
              {LAYERS.map((l) => (
                <div key={l.key} className="s3d-layer">
                  <button className="s3d-eye" onClick={() => setLayers((s) => ({ ...s, [l.key]: !s[l.key] }))} aria-label={layers[l.key] ? 'Masquer' : 'Afficher'}>
                    {layers[l.key] ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <div>
                    <div className="s3d-layer-name">{l.label}</div>
                    <div className="s3d-layer-hint">{l.hint}</div>
                  </div>
                </div>
              ))}
              {layers.plan2d && (
                <div className="s3d-field">
                  <span>Opacité du plan 2D</span>
                  <input type="range" min="0.1" max="1" step="0.05" value={planOpacity} onChange={(e) => setPlanOpacity(+e.target.value)} />
                </div>
              )}
              <div className="s3d-legend">
                <h4>Légende du plan</h4>
                <ul>
                  <li><b className="n">1</b> Terrain de football <i className="p">Projet</i></li>
                  <li><b className="n g">2</b> Jardins collaboratifs <i className="p">Projet</i></li>
                  <li><b className="n r">3</b> Bassin de rétention <i className="p">Projet</i></li>
                  <li><b className="n r">4</b> Puits <i className="p">Projet</i></li>
                  <li><b className="n b">5</b> Vestiaire <i className="e">Existant</i></li>
                  <li><b className="n b">6</b> City stade <i className="e">Existant · État</i></li>
                  <li><b className="n s">7</b> Cimetière <i className="e">Existant</i></li>
                </ul>
              </div>
            </div>
          )}

          {leftTab === 'objects' && (
            <div className="s3d-scroll">
              <div className="s3d-search">
                <Search size={14} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher (nom, famille…)" />
                {query && <button onClick={() => setQuery('')} aria-label="Effacer"><X size={14} /></button>}
              </div>
              {Object.entries(filtered).map(([g, list]) => (
                <details key={g} className="s3d-group" open={g !== 'Palmiers' && g !== 'Parcelles' ? true : !!query}>
                  <summary>{g} <span>{list.length}</span></summary>
                  {list.map((e) => (
                    <button key={e.id} className={`s3d-row ${e.id === selectedId ? 'is-active' : ''}`} onClick={() => { setSelectedId(e.id); setTool('select'); }} onDoubleClick={() => engineRef.current?.focus(e.id)}>
                      <span className="dot" style={{ background: STATUS[e.status]?.color }} />
                      <span className="name">{e.name}</span>
                      {e.locked && <Lock size={12} />}
                    </button>
                  ))}
                </details>
              ))}
            </div>
          )}
        </aside>

        {/* ------------------------------ scène ------------------------------ */}
        <main className="s3d-stage">
          <div ref={mountRef} className="s3d-canvas" />
          {!ready && !webglError && <div className="s3d-loading"><div className="s3d-spinner" />Construction de la maquette…</div>}
          {webglError && (
            <div className="s3d-loading">
              <Info size={22} />
              Votre navigateur ne prend pas en charge la 3D (WebGL). Essayez avec Chrome, Edge, Firefox ou Safari récents.
            </div>
          )}

          <button className="s3d-toggle left" onClick={() => setPanelsOpen((p) => ({ ...p, left: !p.left }))} aria-label="Afficher / masquer le panneau gauche">
            <Library size={16} />
          </button>
          <button className="s3d-toggle right" onClick={() => setPanelsOpen((p) => ({ ...p, right: !p.right }))} aria-label="Afficher / masquer le panneau droit">
            <Info size={16} />
          </button>

          <div className="s3d-compass" aria-hidden="true"><span>N</span></div>

          <div className="s3d-ba" role="group" aria-label="Avant / après">
            <button className={mode === 'avant' ? 'is-active' : ''} onClick={() => setMode('avant')}>Aujourd’hui</button>
            <button className={mode === 'apres' ? 'is-active' : ''} onClick={() => setMode('apres')}>Projet</button>
          </div>

          {measures.length > 0 && (
            <div className="s3d-measures">
              <div className="hd">Mesures <button onClick={() => engineRef.current?.clearMeasures()}>Effacer</button></div>
              {measures.map((m, i) => <div key={i}>#{i + 1} · <b>{m.d.toFixed(2)} m</b></div>)}
            </div>
          )}

          <div className="s3d-bottom">
            <div className="s3d-sun">
              {hour >= 7 && hour <= 19 ? <Sun size={16} /> : <Moon size={16} />}
              <input type="range" min="5" max="21" step="0.25" value={hour} onChange={(e) => setHour(+e.target.value)} aria-label="Heure de la journée" />
              <span className="s3d-hour">{fmtHour(hour)}</span>
              <select value={month} onChange={(e) => setMonth(+e.target.value)} aria-label="Mois">
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              {sunInfo && <span className="s3d-sunmeta">soleil {Math.round(sunInfo.elevation)}° · azimut {Math.round(sunInfo.azimuth)}°</span>}
            </div>
            <div className="s3d-tip">{tip}</div>
          </div>

          {view === 'walk' && <WalkPad onChange={(v) => engineRef.current?.setWalkJoystick(v)} />}
          {toast && <div className="s3d-toast">{toast}</div>}
        </main>

        {/* ------------------------------ panneau droit ------------------------------ */}
        <aside className={`s3d-panel s3d-right ${panelsOpen.right ? '' : 'is-closed'}`}>
          {selected ? (
            <Properties
              e={selected}
              onPatch={(patch) => dispatch({ type: 'update', id: selected.id, patch })}
              onProps={(props) => dispatch({ type: 'updateProps', id: selected.id, props })}
              onFocus={() => engineRef.current?.focus(selected.id)}
              onDuplicate={duplicateSelected}
              onDelete={removeSelected}
              onClose={() => setSelectedId(null)}
            />
          ) : (
            <ProjectSummary stats={stats} />
          )}
        </aside>
      </div>
    </div>
  );
}

/* ============================= sous-composants ============================= */

function IconBtn({ icon: Icon, label, onClick, disabled, text }) {
  return (
    <button className="s3d-btn" onClick={onClick} disabled={disabled} title={label} aria-label={label}>
      <Icon size={16} />
      {text && <span>{text}</span>}
    </button>
  );
}

function ToolBtn({ icon: Icon, label, active, onClick }) {
  return (
    <button className={`s3d-tool ${active ? 'is-active' : ''}`} onClick={onClick} title={label} aria-label={label} aria-pressed={!!active}>
      <Icon size={18} strokeWidth={1.7} />
    </button>
  );
}

function TabBtn({ icon: Icon, label, active, onClick }) {
  return (
    <button role="tab" aria-selected={active} className={`s3d-tab ${active ? 'is-active' : ''}`} onClick={onClick}>
      <Icon size={14} /> {label}
    </button>
  );
}

function NumberField({ label, value, onChange, step = 0.1, min, max, suffix }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const v = parseFloat(draft.replace(',', '.'));
    if (Number.isFinite(v)) onChange(Math.min(max ?? Infinity, Math.max(min ?? -Infinity, v)));
    else setDraft(String(value));
  };
  return (
    <label className="s3d-field">
      <span>{label}</span>
      <div className="s3d-input">
        <input type="number" value={draft} step={step} min={min} max={max} onChange={(e) => setDraft(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
        {suffix && <em>{suffix}</em>}
      </div>
    </label>
  );
}

function TextField({ label, value, onChange, placeholder, area }) {
  const [draft, setDraft] = useState(value || '');
  useEffect(() => setDraft(value || ''), [value]);
  const Tag = area ? 'textarea' : 'input';
  return (
    <label className="s3d-field">
      <span>{label}</span>
      <Tag className="s3d-text" value={draft} placeholder={placeholder} rows={area ? 3 : undefined} onChange={(e) => setDraft(e.target.value)} onBlur={() => draft !== (value || '') && onChange(draft)} onKeyDown={(e) => !area && e.key === 'Enter' && e.currentTarget.blur()} />
    </label>
  );
}

function Properties({ e, onPatch, onProps, onFocus, onDuplicate, onDelete, onClose }) {
  const def = CATALOG[e.type];
  const fields = PLAN_FIELDS[e.type] || def?.fields || [];
  const Icon = def?.icon || Box;
  const area = e.points ? polygonArea(e.points) * (e.scale || 1) ** 2 : null;
  const st = STATUS[e.status] || STATUS.projet;
  return (
    <div className="s3d-scroll s3d-props">
      <div className="s3d-props-hd">
        <div className="s3d-props-icon"><Icon size={18} /></div>
        <div className="s3d-props-title">
          <div className="s3d-badge" style={{ '--c': st.color }}>{st.label}</div>
          <h3>{e.name}</h3>
        </div>
        <button className="s3d-close" onClick={onClose} aria-label="Fermer"><X size={16} /></button>
      </div>

      <div className="s3d-props-actions">
        <button onClick={onFocus}><Focus size={14} /> Centrer</button>
        <button onClick={onDuplicate}><Copy size={14} /> Dupliquer</button>
        <button onClick={() => onPatch({ locked: !e.locked })}>{e.locked ? <><LockOpen size={14} /> Déverrouiller</> : <><Lock size={14} /> Verrouiller</>}</button>
        <button className="danger" onClick={onDelete} disabled={e.locked}><Trash2 size={14} /> Supprimer</button>
      </div>

      <TextField label="Nom" value={e.name} onChange={(name) => onPatch({ name })} />
      <label className="s3d-field">
        <span>Statut</span>
        <select className="s3d-text" value={e.status} onChange={(ev) => onPatch({ status: ev.target.value })}>
          <option value="existant">Existant</option>
          <option value="projet">Projet</option>
        </select>
      </label>

      <h4 className="s3d-h">Position</h4>
      <div className="s3d-row2">
        <NumberField label="X (est)" value={e.position[0]} step={0.5} suffix="m" onChange={(v) => onPatch({ position: [v, e.position[1]] })} />
        <NumberField label="Z (sud)" value={e.position[1]} step={0.5} suffix="m" onChange={(v) => onPatch({ position: [e.position[0], v] })} />
      </div>
      <div className="s3d-row2">
        <NumberField label="Rotation" value={Math.round(((e.rotation || 0) * 180) / Math.PI * 10) / 10} step={5} suffix="°" onChange={(v) => onPatch({ rotation: +((v * Math.PI) / 180).toFixed(4) })} />
        <NumberField label="Échelle" value={e.scale || 1} step={0.05} min={0.2} max={6} suffix="×" onChange={(v) => onPatch({ scale: v })} />
      </div>

      {fields.length > 0 && <h4 className="s3d-h">Caractéristiques</h4>}
      {fields.map((f) => {
        const v = e.props?.[f.key];
        if (f.type === 'number') return <NumberField key={f.key} label={f.label} value={v ?? 0} step={f.step} min={f.min} max={f.max} onChange={(nv) => onProps({ [f.key]: nv })} />;
        if (f.type === 'select')
          return (
            <label key={f.key} className="s3d-field">
              <span>{f.label}</span>
              <select className="s3d-text" value={v ?? f.options[0][0]} onChange={(ev) => { const raw = ev.target.value; onProps({ [f.key]: typeof f.options[0][0] === 'number' ? +raw : raw }); }}>
                {f.options.map(([val, lab]) => <option key={val} value={val}>{lab}</option>)}
              </select>
            </label>
          );
        return <TextField key={f.key} label={f.label} value={v} placeholder={f.placeholder} onChange={(nv) => onProps({ [f.key]: nv })} />;
      })}

      <div className="s3d-metrics">
        {area != null && <Metric label="Surface" value={`${fmt(area)} m²`} />}
        {e.type === 'terrain' && <Metric label="Aire de jeu" value={`${fmt(e.props.length * e.props.width)} m²`} />}
        {e.type === 'bassin' && <Metric label="Volume utile" value={`${fmt(e.props.width * e.props.depth * (e.props.height - 0.3) * (e.scale || 1) ** 3)} m³`} />}
        {e.type === 'vestiaire' && <Metric label="Emprise" value={`${fmt(e.props.width * e.props.depth)} m²`} />}
        {(e.type === 'cloture' || e.type === 'mur-segment') && <Metric label="Linéaire" value={`${fmt(e.props.length * (e.scale || 1))} m`} />}
      </div>

      <TextField label="Notes" area value={e.notes} placeholder="Remarques, coût estimé, responsable…" onChange={(notes) => onPatch({ notes })} />
      {e.locked && <p className="s3d-help">Cet élément provient du plan d’implantation : il est verrouillé pour éviter de le déplacer par erreur.</p>}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="s3d-metric">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function ProjectSummary({ stats }) {
  return (
    <div className="s3d-scroll">
      <div className="s3d-summary-hd">
        <span className="s3d-kicker">Projet communautaire</span>
        <h3>Aménagement du site de <em>Sidi Ouaziz</em></h3>
        <p>Terrain de football, bassin de rétention et jardins collaboratifs, à l’est de la palmeraie de Tighremt.</p>
      </div>
      <div className="s3d-kpis">
        <Metric label="Terrain" value={stats.pitchDims} />
        <Metric label="Aire de jeu" value={`${fmt(stats.pitchArea)} m²`} />
        <Metric label="Jardins" value={`${fmt(stats.gardenArea)} m²`} />
        <Metric label="Parcelles" value={`${stats.parcels}${stats.attributed ? ` · ${stats.attributed} attribuées` : ''}`} />
        <Metric label="Palmiers" value={stats.palms} />
        <Metric label="Autres arbres" value={stats.olives} />
        <Metric label="Bassin" value={`${fmt(stats.volume)} m³`} />
        <Metric label="Objets ajoutés" value={stats.added} />
      </div>
      <div className="s3d-gps">
        <span>Coordonnées GPS</span>
        <b>29°46′22.6″ N · 7°58′22.8″ O</b>
      </div>
      <h4 className="s3d-h">Prise en main</h4>
      <ul className="s3d-howto">
        <li><b>Bibliothèque</b> : posez palmiers, bancs, lampadaires, gradins…</li>
        <li><b>Clic</b> sur un objet pour le sélectionner, puis déplacez-le avec les flèches du gizmo.</li>
        <li><b>Avant / après</b> en bas : comparez le terrain actuel et le projet.</li>
        <li><b>Curseur du soleil</b> : visualisez l’ombre des palmiers à toute heure.</li>
        <li><b>Calques</b> : superposez le plan 2D au 1:500 pour vérifier l’implantation.</li>
        <li>Votre travail est enregistré automatiquement dans ce navigateur ; exportez le <b>.json</b> pour le partager.</li>
      </ul>
      <p className="s3d-disclaimer">Représentation indicative établie d’après le plan d’implantation au 1:500 du dossier de présentation (octobre 2026).</p>
    </div>
  );
}

function WalkPad({ onChange }) {
  const ref = useRef(null);
  const [knob, setKnob] = useState([0, 0]);
  const move = (ev) => {
    const r = ref.current.getBoundingClientRect();
    let x = (ev.clientX - r.left - r.width / 2) / (r.width / 2);
    let y = (ev.clientY - r.top - r.height / 2) / (r.height / 2);
    const l = Math.hypot(x, y);
    if (l > 1) { x /= l; y /= l; }
    setKnob([x, y]);
    onChange({ x, y: -y });
  };
  const end = () => { setKnob([0, 0]); onChange(null); };
  return (
    <div
      ref={ref}
      className="s3d-pad"
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); move(e); }}
      onPointerMove={(e) => e.buttons && move(e)}
      onPointerUp={end}
      onPointerCancel={end}
      aria-label="Joystick de déplacement"
    >
      <span style={{ transform: `translate(${knob[0] * 28}px, ${knob[1] * 28}px)` }} />
    </div>
  );
}

/* ================================ utilitaires ================================ */

function fmt(n) {
  return Number(n || 0).toLocaleString('fr-FR', { maximumFractionDigits: n >= 100 ? 0 : 1 });
}

function fmtHour(h) {
  const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, '0')}h${String(mm).padStart(2, '0')}`;
}

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
