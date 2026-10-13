import {
  TreePalm, Trees, Shrub, Armchair, LampFloor, Trash, Droplets, Signpost, Tent, Goal,
  Fence, BrickWall, Lightbulb, User, Car, Cylinder, Baby, Sun, Warehouse, Waves, Sprout, Building2, LandPlot,
} from 'lucide-react';

/** Catégories de la bibliothèque d'objets */
export const CATEGORIES = [
  { key: 'vegetation', label: 'Végétation' },
  { key: 'mobilier', label: 'Mobilier' },
  { key: 'sport', label: 'Sport & loisirs' },
  { key: 'eau', label: 'Eau & énergie' },
  { key: 'construction', label: 'Construction' },
  { key: 'echelle', label: 'Repères d’échelle' },
];

/**
 * Objets ajoutables. `fields` décrit les propriétés éditables
 * affichées dans le panneau de droite.
 */
export const CATALOG = {
  palmier: { label: 'Palmier dattier', cat: 'vegetation', icon: TreePalm, layer: 'vegetation', scale: 1, desc: 'Phoenix dactylifera, ~9 m' },
  olivier: { label: 'Olivier', cat: 'vegetation', icon: Trees, layer: 'vegetation', desc: 'Arbre d’ombrage, ~4 m' },
  arbuste: { label: 'Arbuste', cat: 'vegetation', icon: Shrub, layer: 'vegetation', desc: 'Haie, massif' },
  parcelle: { label: 'Parcelle', cat: 'vegetation', icon: Sprout, layer: 'projet', desc: '10 × 8 m, potager', placeable: true },

  banc: { label: 'Banc', cat: 'mobilier', icon: Armchair, layer: 'mobilier', desc: 'Béton et bois, 2 m' },
  lampadaire: { label: 'Lampadaire solaire', cat: 'mobilier', icon: LampFloor, layer: 'mobilier', desc: 'Mât 5 m' },
  projecteur: { label: 'Mât d’éclairage', cat: 'sport', icon: Lightbulb, layer: 'mobilier', desc: 'Projecteurs 15 m' },
  poubelle: { label: 'Poubelle', cat: 'mobilier', icon: Trash, layer: 'mobilier' },
  fontaine: { label: 'Fontaine à boire', cat: 'mobilier', icon: Droplets, layer: 'mobilier' },
  panneau: {
    label: 'Panneau d’information', cat: 'mobilier', icon: Signpost, layer: 'mobilier',
    props: { text: 'Site de Sidi Ouaziz' },
    fields: [{ key: 'text', label: 'Texte', type: 'text' }],
  },
  pergola: { label: 'Pergola / ombrière', cat: 'mobilier', icon: Tent, layer: 'mobilier', desc: '6 × 4 m, canisses' },

  but: { label: 'But de football', cat: 'sport', icon: Goal, layer: 'mobilier', desc: '7,32 × 2,44 m' },
  tribune: { label: 'Gradins', cat: 'sport', icon: Building2, layer: 'mobilier', desc: '4 rangées, 10 m' },
  jeux: { label: 'Aire de jeux', cat: 'sport', icon: Baby, layer: 'mobilier', desc: 'Balançoire, toboggan' },

  puits: { label: 'Puits', cat: 'eau', icon: Cylinder, layer: 'projet', props: { width: 3.5 } },
  citerne: { label: 'Citerne', cat: 'eau', icon: Waves, layer: 'projet', desc: '≈ 12 m³' },
  'panneau-solaire': { label: 'Panneau solaire', cat: 'eau', icon: Sun, layer: 'projet', desc: 'Pompage solaire' },
  'local-pompe': { label: 'Local technique', cat: 'eau', icon: Warehouse, layer: 'projet', props: { width: 3.5, depth: 3 } },

  cloture: {
    label: 'Clôture grillagée', cat: 'construction', icon: Fence, layer: 'mobilier',
    props: { length: 10, height: 2 },
    fields: [
      { key: 'length', label: 'Longueur (m)', type: 'number', min: 1, max: 200, step: 0.5 },
      { key: 'height', label: 'Hauteur (m)', type: 'number', min: 0.5, max: 5, step: 0.1 },
    ],
  },
  'mur-segment': {
    label: 'Mur en pierre', cat: 'construction', icon: BrickWall, layer: 'mobilier',
    props: { length: 10, height: 1.8 },
    fields: [
      { key: 'length', label: 'Longueur (m)', type: 'number', min: 1, max: 200, step: 0.5 },
      { key: 'height', label: 'Hauteur (m)', type: 'number', min: 0.3, max: 5, step: 0.1 },
    ],
  },
  zone: { label: 'Zone (emprise)', cat: 'construction', icon: LandPlot, layer: 'projet', placeable: true, desc: '12 × 12 m' },

  personne: {
    label: 'Personne', cat: 'echelle', icon: User, layer: 'mobilier', props: { variant: 0 },
    fields: [{ key: 'variant', label: 'Tenue', type: 'select', options: [[0, 'Bleue'], [1, 'Rouge']] }],
  },
  voiture: { label: 'Voiture', cat: 'echelle', icon: Car, layer: 'mobilier' },
};

/** Propriétés propres aux éléments du plan (non présents dans la bibliothèque) */
export const PLAN_FIELDS = {
  terrain: [
    { key: 'surface', label: 'Revêtement', type: 'select', options: [['terre', 'Terre stabilisée'], ['gazon', 'Gazon synthétique']] },
    { key: 'length', label: 'Longueur (m)', type: 'number', min: 40, max: 120, step: 0.5 },
    { key: 'width', label: 'Largeur (m)', type: 'number', min: 25, max: 90, step: 0.5 },
  ],
  allee: [
    { key: 'length', label: 'Longueur (m)', type: 'number', min: 50, max: 160, step: 0.5 },
    { key: 'width', label: 'Largeur (m)', type: 'number', min: 30, max: 120, step: 0.5 },
    { key: 'radius', label: 'Rayon des angles (m)', type: 'number', min: 0, max: 30, step: 0.5 },
  ],
  parcelle: [
    { key: 'culture', label: 'Couvert', type: 'select', options: [['gazon', 'Gazon / prairie'], ['potager', 'Potager'], ['terre', 'Terre nue']] },
    { key: 'famille', label: 'Famille attributaire', type: 'text', placeholder: 'Non attribuée' },
  ],
  bassin: [
    { key: 'width', label: 'Largeur (m)', type: 'number', min: 3, max: 40, step: 0.5 },
    { key: 'depth', label: 'Longueur (m)', type: 'number', min: 3, max: 40, step: 0.5 },
    { key: 'height', label: 'Hauteur des murs (m)', type: 'number', min: 0.8, max: 4, step: 0.1 },
  ],
  vestiaire: [
    { key: 'width', label: 'Façade (m)', type: 'number', min: 4, max: 20, step: 0.1 },
    { key: 'depth', label: 'Profondeur (m)', type: 'number', min: 4, max: 20, step: 0.1 },
  ],
  mur: [{ key: 'height', label: 'Hauteur (m)', type: 'number', min: 0.5, max: 4, step: 0.1 }],
  citystade: [],
};

export const STATUS = {
  existant: { label: 'Existant', color: '#3b5bdb' },
  projet: { label: 'Projet', color: '#c2410c' },
};

export const LAYERS = [
  { key: 'existant', label: 'Existant', hint: 'Vestiaire, city stade, cimetière' },
  { key: 'projet', label: 'Projet', hint: 'Terrain, allée, bassin, jardins' },
  { key: 'vegetation', label: 'Végétation', hint: 'Palmiers, oliviers, arbustes' },
  { key: 'mobilier', label: 'Mobilier & équipements', hint: 'Bancs, buts, lampadaires…' },
  { key: 'annotations', label: 'Étiquettes & mesures', hint: 'Noms des zones, cotes' },
  { key: 'environnement', label: 'Paysage', hint: 'Montagnes, palmeraie de Tighremt' },
  { key: 'plan2d', label: 'Plan 2D (1:500)', hint: 'Calque du plan d’implantation' },
];

export const DEFAULT_LAYERS = {
  existant: true, projet: true, vegetation: true, mobilier: true,
  annotations: true, environnement: true, plan2d: false,
};

let counter = 0;
export function newEntity(type, position) {
  const def = CATALOG[type] || {};
  const id = `${type}-${Date.now().toString(36)}-${(counter++).toString(36)}`;
  const base = {
    id, type, name: def.label || type, status: 'projet', layer: def.layer || 'mobilier',
    position, rotation: 0, scale: 1, props: { ...(def.props || {}) }, notes: '', added: true,
  };
  if (type === 'parcelle') base.points = [[-5, -4], [5, -4], [5, 4], [-5, 4]], base.props = { culture: 'potager', famille: '' };
  if (type === 'zone') base.points = [[-6, -6], [6, -6], [6, 6], [-6, 6]], base.props = { color: '#c9b089' };
  if (type === 'palmier') base.scale = +(0.9 + Math.random() * 0.25).toFixed(2), base.rotation = +(Math.random() * 6.28).toFixed(2);
  return base;
}

export function defaultProps(type) {
  if (type === 'parcelle') return { culture: 'potager' };
  return { ...(CATALOG[type]?.props || {}) };
}

export function ghostEntity(type) {
  return newEntity(type, [0, 0]);
}
