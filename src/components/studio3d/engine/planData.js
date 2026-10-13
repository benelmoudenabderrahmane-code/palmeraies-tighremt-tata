/**
 * Données du plan d'aménagement de Sidi Ouaziz (échelle 1:500).
 *
 * Les coordonnées ont été relevées en pixels sur le plan d'implantation
 * (public/studio-3d/plan-sidi-ouaziz.png, 1100 × 1709 px) puis converties
 * en mètres. Calibrage : le rond central (Ø 18,30 m réglementaire) mesure
 * ≈ 107 px sur le plan → 5,85 px par mètre. Le terrain obtient alors
 * ≈ 99,5 × 49,6 m, cohérent avec un terrain de football de village.
 *
 * Repère monde : origine au centre du terrain, X vers l'est, Z vers le sud
 * (haut du plan = nord), Y vers le haut.
 */

export const PLAN_IMAGE = {
  src: '/studio-3d/plan-sidi-ouaziz.png',
  widthPx: 1100,
  heightPx: 1709,
};

export const PX_PER_M = 5.85;
export const ORIGIN_PX = [600.5, 1144.5]; // centre du terrain sur le plan

export const SITE = {
  name: "Site de Sidi Ouaziz",
  lat: 29.77295,
  lon: -7.97299,
};

/** pixel du plan → [x, z] en mètres */
export function px([u, v]) {
  return [(u - ORIGIN_PX[0]) / PX_PER_M, (v - ORIGIN_PX[1]) / PX_PER_M];
}

// Axe long du terrain : (101, 573) px → angle par rapport au nord.
// Rotation Y (sens trigonométrique vu du dessus, Z vers le sud).
export const PITCH_ROT = Math.atan2(101, 573); // ≈ 10°

export const PLAN_BOUNDS_PX = { min: [35, 33], max: [1068, 1675] };

/* ------------------------------------------------------------------ */
/*  Polygones relevés sur le plan (en pixels)                          */
/* ------------------------------------------------------------------ */

const NORTH_GARDEN = [
  [[53, 748], [125, 718], [158, 790], [85, 820]],
  [[158, 708], [240, 672], [272, 742], [187, 776]],
  [[258, 665], [395, 605], [428, 690], [287, 733]],
  [[412, 598], [500, 562], [528, 668], [440, 690]],
  [[523, 553], [660, 553], [665, 620], [548, 667]],
  [[686, 553], [800, 553], [806, 628], [692, 638]],
  [[697, 660], [808, 650], [820, 758], [717, 770]],
  [[447, 702], [543, 682], [573, 797], [476, 812]],
  [[562, 680], [675, 662], [692, 773], [580, 795]],
  [[295, 745], [440, 705], [466, 815], [317, 840]],
  [[195, 792], [280, 758], [300, 843], [255, 846], [215, 822]],
];

const WEST_GARDEN = [
  [[85, 822], [160, 792], [178, 830], [100, 858]],
  [[102, 862], [180, 834], [198, 872], [118, 903]],
  [[120, 907], [200, 876], [222, 915], [138, 948]],
  [[140, 953], [225, 919], [245, 962], [160, 994]],
  [[162, 998], [247, 965], [268, 1008], [180, 1040]],
  [[183, 1044], [268, 1014], [280, 1040], [264, 1070], [206, 1106]],
];

const SOUTH_GARDEN = [
  [[152, 1370], [208, 1342], [230, 1385], [172, 1417]],
  [[212, 1340], [265, 1310], [292, 1362], [237, 1387]],
  [[270, 1300], [390, 1298], [296, 1360]],
  [[176, 1425], [232, 1395], [255, 1450], [200, 1488]],
  [[240, 1392], [295, 1368], [320, 1420], [262, 1448]],
  [[300, 1366], [404, 1310], [410, 1372], [325, 1418]],
  [[205, 1497], [262, 1460], [290, 1508], [225, 1545]],
  [[268, 1455], [325, 1428], [352, 1478], [295, 1505]],
  [[330, 1425], [412, 1385], [420, 1445], [357, 1475]],
  [[228, 1560], [295, 1520], [330, 1610], [262, 1645]],
  [[302, 1515], [360, 1485], [410, 1580], [338, 1612]],
  [[365, 1482], [423, 1455], [485, 1552], [415, 1585]],
  [[545, 1508], [838, 1460], [870, 1502], [560, 1543]],
];

const HATCH_ZONE = [[93, 1175], [207, 1112], [283, 1293], [150, 1368], [95, 1335]];
const CEMETERY_WALL = [[1030, 548], [850, 582], [958, 1250], [965, 1475], [1048, 1650]];
const CITY_STADE = [[315, 205], [568, 55], [707, 262], [452, 412]];

/* ------------------------------------------------------------------ */

function centroid(pts) {
  let x = 0, z = 0;
  for (const p of pts) { x += p[0]; z += p[1]; }
  return [x / pts.length, z / pts.length];
}

/** Convertit un polygone pixels → { position, points relatifs en mètres } */
function polyEntity(pxPts) {
  const m = pxPts.map(px);
  const c = centroid(m);
  return {
    position: [+c[0].toFixed(2), +c[1].toFixed(2)],
    points: m.map(([x, z]) => [+(x - c[0]).toFixed(2), +(z - c[1]).toFixed(2)]),
  };
}

export function polygonArea(points) {
  let a = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, z1] = points[i];
    const [x2, z2] = points[(i + 1) % points.length];
    a += x1 * z2 - x2 * z1;
  }
  return Math.abs(a) / 2;
}

function rectFromPx(pxPts) {
  // dimensions et orientation d'un quadrilatère quasi rectangulaire
  const m = pxPts.map(px);
  const c = centroid(m);
  const w = Math.hypot(m[1][0] - m[0][0], m[1][1] - m[0][1]);
  const d = Math.hypot(m[3][0] - m[0][0], m[3][1] - m[0][1]);
  const rot = -Math.atan2(m[1][1] - m[0][1], m[1][0] - m[0][0]);
  return { position: [+c[0].toFixed(2), +c[1].toFixed(2)], w: +w.toFixed(2), d: +d.toFixed(2), rot: +rot.toFixed(4) };
}

let _n = 0;
const uid = (p) => `${p}-${(++_n).toString(36)}`;

/** Palmiers plantés en quinconce à l'intérieur d'une parcelle */
function palmsInPolygon(entity, spacing, gardenName) {
  const pts = entity.points;
  const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minZ = Math.min(...zs), maxZ = Math.max(...zs);
  const inside = (x, z) => {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, zi] = pts[i], [xj, zj] = pts[j];
      if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
    }
    return c;
  };
  // distance minimale au bord pour ne pas planter sur la bordure
  const edgeDist = (x, z) => {
    let best = Infinity;
    for (let i = 0; i < pts.length; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[(i + 1) % pts.length];
      const dx = bx - ax, dz = bz - az;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
      best = Math.min(best, Math.hypot(x - (ax + t * dx), z - (az + t * dz)));
    }
    return best;
  };
  const out = [];
  let row = 0;
  for (let z = minZ + spacing / 2; z < maxZ; z += spacing * 0.87, row++) {
    for (let x = minX + (row % 2 ? spacing / 2 : 0) + spacing / 2; x < maxX; x += spacing) {
      if (inside(x, z) && edgeDist(x, z) > 1.6) {
        const seed = Math.sin((x + entity.position[0]) * 12.9898 + (z + entity.position[1]) * 78.233) * 43758.5453;
        const r = seed - Math.floor(seed);
        out.push({
          id: uid('palm'),
          type: 'palmier',
          name: 'Palmier dattier',
          status: 'projet',
          layer: 'vegetation',
          position: [+(entity.position[0] + x).toFixed(2), +(entity.position[1] + z).toFixed(2)],
          rotation: +(r * Math.PI * 2).toFixed(3),
          scale: +(0.85 + r * 0.35).toFixed(2),
          props: { group: gardenName },
        });
      }
    }
  }
  return out;
}

/** Construit la liste initiale d'entités à partir du plan */
export function buildInitialEntities() {
  _n = 0;
  const entities = [];

  // --- Allée périphérique + terrain -----------------------------------
  entities.push({
    id: 'allee',
    type: 'allee',
    name: 'Allée périphérique',
    status: 'projet',
    layer: 'projet',
    locked: true,
    position: [0, 0],
    rotation: PITCH_ROT,
    scale: 1,
    props: { length: 119, width: 84, radius: 9, color: '#d9c7a6' },
    notes: "Allée pour les spectateurs autour de l'aire de jeu.",
  });
  entities.push({
    id: 'terrain',
    type: 'terrain',
    name: 'Terrain de football de Sidi Ouaziz',
    status: 'projet',
    layer: 'projet',
    locked: true,
    position: [0, 0],
    rotation: PITCH_ROT,
    scale: 1,
    props: { length: 99.5, width: 49.6, surface: 'terre' },
    notes: 'Nivellement et compactage, marquage, buts neufs. Repère 1 du plan.',
  });

  // --- Vestiaire (existant) -------------------------------------------
  const vest = rectFromPx([[286, 1118], [326, 1116], [331, 1168], [291, 1172]]);
  entities.push({
    id: 'vestiaire',
    type: 'vestiaire',
    name: 'Vestiaire (2018–2019)',
    status: 'existant',
    layer: 'existant',
    locked: true,
    position: vest.position,
    // façade aux trois portes tournée vers le terrain (est)
    rotation: +(vest.rot + Math.PI / 2).toFixed(4),
    scale: 1,
    props: { width: vest.d, depth: vest.w },
    notes: "Construit par l'association en 2018–2019 (17 000 DH, dont 8 400 DH de l'État). Repère 5 du plan.",
  });

  // --- Bassin de rétention + puits -----------------------------------
  const hz = polyEntity(HATCH_ZONE);
  entities.push({
    id: 'zone-hydraulique',
    type: 'zone',
    name: 'Zone hydraulique',
    status: 'projet',
    layer: 'projet',
    locked: true,
    ...hz,
    rotation: 0,
    scale: 1,
    props: { color: '#c9b089' },
    notes: 'Emprise réservée au bassin et au puits (zone hachurée du plan).',
  });
  const bassin = rectFromPx([[167, 1222], [232, 1214], [240, 1285], [176, 1293]]);
  entities.push({
    id: 'bassin',
    type: 'bassin',
    name: 'Bassin de rétention',
    status: 'projet',
    layer: 'projet',
    locked: true,
    position: bassin.position,
    rotation: bassin.rot,
    scale: 1,
    props: { width: bassin.w, depth: bassin.d, height: 1.6 },
    notes: "Stockage de l'eau pour l'irrigation des jardins (goutte-à-goutte). Repère 3 du plan.",
  });
  [[[117, 1297], [140, 1295], [141, 1322], [118, 1324]], [[136, 1290], [162, 1288], [163, 1312], [137, 1314]]].forEach((p, i) => {
    const r = rectFromPx(p);
    entities.push({
      id: `puits-${i + 1}`,
      type: i === 0 ? 'puits' : 'local-pompe',
      name: i === 0 ? 'Puits' : 'Local technique (pompe)',
      status: 'projet',
      layer: 'projet',
      locked: true,
      position: r.position,
      rotation: r.rot,
      scale: 1,
      props: { width: r.w, depth: r.d },
      notes: 'Alimentation en eau du bassin. Repère 4 du plan.',
    });
  });

  // --- City stade (existant, État) -------------------------------------
  const cs = rectFromPx(CITY_STADE);
  entities.push({
    id: 'city-stade',
    type: 'citystade',
    name: 'City stade (terrain de proximité)',
    status: 'existant',
    layer: 'existant',
    locked: true,
    position: cs.position,
    rotation: cs.rot,
    scale: 1,
    props: { width: cs.w, depth: cs.d },
    notes: "Terrain de proximité de Tighremt, réalisé par l'État. Repère 6 du plan.",
  });

  // --- Mur du cimetière (existant) -------------------------------------
  const cw = polyEntity(CEMETERY_WALL);
  entities.push({
    id: 'cimetiere',
    type: 'mur',
    name: 'Limite du cimetière',
    status: 'existant',
    layer: 'existant',
    locked: true,
    ...cw,
    rotation: 0,
    scale: 1,
    props: { height: 1.8, closed: false, color: '#c08a63' },
    notes: 'Cimetière à l’est : ses limites sont préservées. Repère 7 du plan.',
  });

  // --- Jardins collaboratifs + palmiers --------------------------------
  const gardens = [
    ['Jardin collaboratif nord', NORTH_GARDEN],
    ['Jardin collaboratif ouest', WEST_GARDEN],
    ['Jardin collaboratif sud-ouest', SOUTH_GARDEN],
  ];
  const palms = [];
  gardens.forEach(([gname, list]) => {
    list.forEach((poly, i) => {
      const e = polyEntity(poly);
      const ent = {
        id: uid('parcelle'),
        type: 'parcelle',
        name: `${gname} — parcelle ${i + 1}`,
        status: 'projet',
        layer: 'projet',
        locked: true,
        ...e,
        rotation: 0,
        scale: 1,
        props: { group: gname, culture: 'gazon', famille: '' },
        notes: '',
      };
      entities.push(ent);
      palms.push(...palmsInPolygon(ent, 7.5, gname));
    });
  });
  entities.push(...palms);

  // --- Buts du terrain --------------------------------------------------
  const c = Math.cos(PITCH_ROT), s = Math.sin(PITCH_ROT);
  [-1, 1].forEach((side) => {
    const lz = side * (99.5 / 2);
    entities.push({
      id: `but-${side > 0 ? 'sud' : 'nord'}`,
      type: 'but',
      name: `But ${side > 0 ? 'sud' : 'nord'}`,
      status: 'projet',
      layer: 'mobilier',
      position: [+(lz * s).toFixed(2), +(lz * c).toFixed(2)],
      rotation: +(PITCH_ROT + (side > 0 ? Math.PI : 0)).toFixed(4),
      scale: 1,
      props: {},
    });
  });

  // --- Bancs le long de l'allée -----------------------------------------
  [-30, -10, 10, 30].forEach((lz) => {
    [-1, 1].forEach((side) => {
      const lx = side * 32;
      entities.push({
        id: uid('banc'),
        type: 'banc',
        name: 'Banc',
        status: 'projet',
        layer: 'mobilier',
        position: [+(lx * c + lz * s).toFixed(2), +(-lx * s + lz * c).toFixed(2)],
        rotation: +(PITCH_ROT + (side > 0 ? -Math.PI / 2 : Math.PI / 2)).toFixed(4),
        scale: 1,
        props: {},
      });
    });
  });

  return entities;
}

/** Bornes du site en mètres (pour la caméra, l'ombre et le sol) */
export function siteBounds() {
  const a = px(PLAN_BOUNDS_PX.min), b = px(PLAN_BOUNDS_PX.max);
  return { minX: a[0], minZ: a[1], maxX: b[0], maxZ: b[1] };
}
