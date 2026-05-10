'use client';
import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, useInView } from 'framer-motion';
import { C } from '@/lib/tokens';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import Lightbox from '@/components/ui/Lightbox';
import { TextEffect } from '@/components/ui/TextEffect';

const ImageComparison = dynamic(
  () => import('@/components/ui/ImageComparison'),
  { ssr: false },
);


/* ── Project data ──────────────────────────────────────────────────────── */
// Unsplash fallbacks used until real photos are in public/images/tighremt/
const UNS = {
  desert:    'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=900&q=75&auto=format&fit=crop',
  palms:     'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?w=900&q=75&auto=format&fit=crop',
  oasis:     'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=900&q=75&auto=format&fit=crop',
  water:     'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=900&q=75&auto=format&fit=crop',
  ruins:     'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=900&q=75&auto=format&fit=crop',
  mosque:    'https://images.unsplash.com/photo-1548783300-b68b0e0a2c98?w=900&q=75&auto=format&fit=crop',
  road:      'https://images.unsplash.com/photo-1473580464609-7b29c7b6f1ff?w=480&q=70&auto=format&fit=crop',
  palmSm:    'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?w=480&q=70&auto=format&fit=crop',
  oasisSm:   'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=480&q=70&auto=format&fit=crop',
  ruinsSm:   'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=480&q=70&auto=format&fit=crop',
  corridor:  'https://images.unsplash.com/photo-1606166325683-e6debb023e3b?w=480&q=70&auto=format&fit=crop',
  panorama:  'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=480&q=70&auto=format&fit=crop',
};

const PROJECTS = [
  {
    id: 'palmeraie',
    bg: C.sand,
    category: 'Environnement',
    categoryColor: C.green,
    title: 'Restauration de la Palmeraie',
    subtitle: 'Tata · 2022 – présent',
    desc: "La palmeraie de Tighremt, symbole vivant d'identité et de résilience, comptait autrefois des milliers de dattiers. Menacée par la sécheresse et l'exode rural, elle fait aujourd'hui l'objet d'un programme intensif : replantation de jeunes palmiers, remise en état des canaux d'irrigation et sensibilisation des familles locales.",
    stats: [
      { value: '1 200', label: 'palmiers replantés' },
      { value: '18',    label: 'familles impliquées' },
      { value: '4 ha',  label: 'surface restaurée' },
    ],
    before:         '/images/tighremt/oued-sec.jpg',
    beforeFallback: UNS.desert,
    after:          '/images/tighremt/palmeraie-sol.jpg',
    afterFallback:  UNS.palms,
    gallery: [
      { src: '/images/tighremt/palmeraie-panorama.jpg', fallback: UNS.oasisSm,  alt: 'Vue panoramique de la palmeraie de Tighremt' },
      { src: '/images/tighremt/dattes.jpg',             fallback: UNS.palmSm,   alt: 'Régimes de dattes sur les palmiers' },
      { src: '/images/tighremt/palmeraie-chemin.jpg',   fallback: UNS.road,     alt: 'Chemin dans la palmeraie' },
      { src: '/images/tighremt/palmeraie-ciel.jpg',     fallback: UNS.palmSm,   alt: 'Palmiers de Tighremt' },
    ],
  },
  {
    id: 'pont',
    bg: C.sandMid,
    category: 'Infrastructure',
    categoryColor: C.ochre,
    title: 'Consolidation du pont de Tighremt',
    subtitle: 'Douar Tighremt, Province de Tata · 2010',
    desc: "Le pont de Tighremt, seul axe de liaison entre le douar et la route principale, présentait des piliers fortement dégradés par les crues successives de l'oued. L'association a financé et coordonné les travaux de consolidation des piles en béton, assurant la sécurité des habitants et le maintien de l'accès au village tout au long de l'année.",
    stats: [
      { value: '4',     label: 'piliers consolidés' },
      { value: '2010',  label: 'année des travaux' },
      { value: '100%',  label: 'accès rétabli' },
    ],
    before:         '/images/tighremt/pont-avant.jpg',
    after:          '/images/tighremt/pont-apres.jpg',
    gallery: [
      { src: '/images/tighremt/pont-g1.jpg', alt: 'Pilier dégradé avant consolidation' },
      { src: '/images/tighremt/pont-g2.jpg', alt: 'Vue sous le pont — passage de l\'oued' },
      { src: '/images/tighremt/pont-g3.jpg', alt: 'Structure du pont sur l\'oued' },
      { src: '/images/tighremt/pont-g4.jpg', alt: 'Pilier renforcé avec vue sur la palmeraie' },
      { src: '/images/tighremt/pont-g5.jpg', alt: 'Vue d\'ensemble du pont de Tighremt' },
    ],
  },
  {
    id: 'ecole',
    bg: C.sand,
    category: 'Éducation',
    categoryColor: C.greenMid,
    title: "Rénovation des crèches de Tighremt",
    subtitle: 'Douar Tighremt, Province de Tata',
    desc: "Ce projet consiste à rénover deux écoles maternelles privées du douar et à les équiper d'espaces de jeux, d'une bibliothèque, de sanitaires adaptés, d'une salle informatique et polyvalente. L'association Palmeraies Tighremt Tata récolte des dons en France pour financer ces travaux. Une fois achevée, la structure fonctionnera de manière autonome, accompagnée par l'association et les responsables locaux — offrant aux enfants les plus démunis un enseignement de qualité, directement là où les besoins sont les plus forts.",
    stats: [
      { value: '2',     label: 'crèches rénovées' },
      { value: '80+',   label: 'enfants bénéficiaires' },
      { value: '100%',  label: 'autonomie visée' },
    ],
    before:         '/images/tighremt/ecole-avant.jpg',
    after:          '/images/tighremt/ecole-apres.jpg',
    gallery: [
      { src: '/images/tighremt/ecole-g1.jpg', alt: 'Salle de classe avant rénovation — tableau et mobilier vétuste' },
      { src: '/images/tighremt/ecole-g2.jpg', alt: 'Murs dégradés avant travaux' },
      { src: '/images/tighremt/ecole-g3.jpg', alt: 'Intérieur de la crèche avant rénovation' },
      { src: '/images/tighremt/ecole-g4.jpg', alt: 'État initial des locaux' },
      { src: '/images/tighremt/ecole-g5.jpg', alt: 'Cour extérieure de la crèche' },
      { src: '/images/tighremt/ecole-g6.jpg', alt: 'Visite du chantier de rénovation' },
      { src: '/images/tighremt/ecole-g7.jpg', alt: 'Plafond refait après travaux' },
      { src: '/images/tighremt/ecole-g8.jpg', alt: 'Salle rénovée et équipée' },
    ],
  },
  {
    id: 'desertification',
    bg: C.sandMid,
    category: 'Environnement',
    categoryColor: C.ochreDark,
    title: 'Lutte contre la désertification',
    subtitle: 'Région de Tata · 2023 – présent',
    desc: "L'avancée du désert menace directement les terres cultivables autour de Tighremt. Notre programme de protection combine plantation de haies brise-vent en euphorbes et tamaris, fixation des dunes par des fascines de palmes et suivi scientifique des indicateurs de végétation sur quatre parcelles pilotes.",
    stats: [
      { value: '800 m', label: 'de haies brise-vent' },
      { value: '4',     label: 'parcelles pilotes' },
      { value: '2 500', label: 'plants de tamaris' },
    ],
    before:         '/images/tighremt/oued-sec.jpg',
    beforeFallback: UNS.desert,
    after:          '/images/tighremt/palmeraie-sol.jpg',
    afterFallback:  UNS.palms,
    gallery: [
      { src: '/images/tighremt/route-tighremt.jpg',     fallback: UNS.road,    alt: 'Piste longeant la palmeraie aride' },
      { src: '/images/tighremt/palmeraie-panorama.jpg', fallback: UNS.oasisSm, alt: 'Oasis de Tighremt vue de loin' },
      { src: '/images/tighremt/palmeraie-ksar.jpg',     fallback: UNS.palmSm,  alt: 'Palmiers résistants au bord du ksar' },
    ],
  },
  {
    id: 'humanitaire',
    bg: C.sand,
    category: 'Humanitaire',
    categoryColor: C.accent,
    title: 'Distribution alimentaire',
    subtitle: 'Douar de Tighremt · 2020 – présent',
    desc: "Chaque année, notamment avant le mois de Ramadan et en hiver, l'association organise des distributions de produits alimentaires essentiels (farine, huile, sucre, légumineuses) et de couvertures aux foyers les plus vulnérables du douar. Les bénéficiaires sont identifiés en lien direct avec les élus locaux.",
    stats: [
      { value: '120',   label: 'foyers aidés / an' },
      { value: '5',     label: 'distributions annuelles' },
      { value: '3 t',   label: 'de denrées livrées' },
    ],
    before: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=900&q=75&auto=format&fit=crop',
    after:  'https://images.unsplash.com/photo-1526976668912-1a811878dd37?w=900&q=75&auto=format&fit=crop',
    gallery: [
      { src: 'https://images.unsplash.com/photo-1594708767771-a5e2d5e55a5e?w=480&q=70&auto=format&fit=crop', alt: 'Colis alimentaires' },
      { src: 'https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=480&q=70&auto=format&fit=crop', alt: 'Distribution de vivres' },
      { src: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=480&q=70&auto=format&fit=crop', alt: 'Équipe bénévole' },
      { src: 'https://images.unsplash.com/photo-1562699058-5d35c8e29ac3?w=480&q=70&auto=format&fit=crop', alt: 'Familles bénéficiaires' },
    ],
  },
  {
    id: 'patrimoine',
    bg: C.sandMid,
    category: 'Patrimoine',
    categoryColor: C.greenDeep,
    title: 'Patrimoine culturel & Mémoire',
    subtitle: 'Région Tata · 2024 – présent',
    desc: "Tighremt possède un riche patrimoine architectural (ksour, greniers collectifs, gravures rupestres) et immatériel (chants amazighs, savoir-faire artisanaux). Notre programme de sauvegarde inclut un inventaire numérique, des ateliers intergénérationnels de transmission du savoir-faire et la restauration d'un grenier collectif.",
    stats: [
      { value: '40+',   label: 'sites inventoriés' },
      { value: '1',     label: 'grenier restauré' },
      { value: '200 h', label: 'de témoignages enregistrés' },
    ],
    before:         '/images/tighremt/ksar-ruines.jpg',
    beforeFallback: UNS.ruins,
    after:          '/images/tighremt/minaret.jpg',
    afterFallback:  UNS.mosque,
    gallery: [
      { src: '/images/tighremt/ksar-silhouette.jpg',    fallback: UNS.ruinsSm,  alt: 'Silhouette dans les ruelles du vieux ksar' },
      { src: '/images/tighremt/ksar-poutres.jpg',       fallback: UNS.corridor, alt: 'Couloir avec poutres en bois de palmier' },
      { src: '/images/tighremt/ksar-couloir.jpg',       fallback: UNS.corridor, alt: 'Architecture en terre du ksar de Tighremt' },
      { src: '/images/tighremt/tighremt-panorama.jpg',  fallback: UNS.panorama, alt: 'Panorama de Tighremt — minaret et montagne' },
    ],
  },
  {
    id: 'sidi-brahim',
    bg: C.sand,
    category: 'Infrastructure',
    categoryColor: C.green,
    title: 'Vestiaire du terrain de football — Sidi Brahim',
    subtitle: 'Douar Tighremt, Province de Tata · 2018 – 2019',
    desc: "Notre association a réalisé la construction d'un nouveau vestiaire avec sanitaires sur le terrain de football du village, améliorant ainsi le confort et les conditions de jeu des joueurs locaux. Un pas en avant concret pour les infrastructures sportives de Tighremt, entièrement porté par la mobilisation de nos bénévoles et de la communauté.",
    stats: [
      { value: '2018',  label: 'début des travaux' },
      { value: '100%',  label: 'main-d\'œuvre locale' },
      { value: '1',     label: 'bâtiment livré' },
    ],
    before: '/images/tighremt/sidi-avant.jpg',
    after:  '/images/tighremt/sidi-apres.jpg',
    gallery: [
      { src: '/images/tighremt/sidi-g1.jpg', alt: 'Structure en construction — façade principale' },
      { src: '/images/tighremt/sidi-g2.jpg', alt: 'Chantier en cours — vue extérieure' },
      { src: '/images/tighremt/sidi-g3.jpg', alt: 'Coulage du plancher intérieur' },
      { src: '/images/tighremt/sidi-g4.jpg', alt: 'Travaux de nuit — finitions extérieures' },
      { src: '/images/tighremt/sidi-g5.jpg', alt: 'Bâtiment livré — portes vertes et façade peinte' },
    ],
  },
  {
    id: 'cimetiere',
    bg: C.sandMid,
    category: 'Mémoire & Dignité',
    categoryColor: C.greenDeep,
    title: 'Clôture du cimetière — Aslda',
    subtitle: 'Douar Tighremt, Province de Tata · 2017 – 2018',
    desc: "Notre association a érigé une clôture autour d'un premier cimetière pour protéger les tombes des parasites, préservant ainsi le lieu de repos des défunts et assurant le respect de leur mémoire. Ce projet, porté avec beaucoup de soin et de considération, témoigne de l'engagement de l'association pour la dignité et le patrimoine mémoriel du douar de Tighremt.",
    stats: [
      { value: '1',     label: 'cimetière clôturé' },
      { value: '2018',  label: 'année de livraison' },
      { value: '100%',  label: 'financé par l\'association' },
    ],
    before: '/images/tighremt/cimetiere-avant.jpg',
    after:  '/images/tighremt/cimetiere-apres.jpg',
    gallery: [
      { src: '/images/tighremt/cimetiere-g1.jpg', alt: 'Début des travaux de fondation' },
      { src: '/images/tighremt/cimetiere-g2.jpg', alt: 'Construction du mur de clôture' },
      { src: '/images/tighremt/cimetiere-g3.jpg', alt: 'Élévation des murs en parpaings' },
      { src: '/images/tighremt/cimetiere-g4.jpg', alt: 'Avancement du chantier' },
      { src: '/images/tighremt/cimetiere-g5.jpg', alt: 'Pose du portail d\'entrée' },
      { src: '/images/tighremt/cimetiere-g6.jpg', alt: 'Finitions du mur d\'enceinte' },
      { src: '/images/tighremt/cimetiere-g7.jpg', alt: 'Vue d\'ensemble de la clôture achevée' },
      { src: '/images/tighremt/cimetiere-g8.jpg', alt: 'Cimetière protégé et aménagé' },
    ],
  },
];

/* ── Gallery ───────────────────────────────────────────────────────────── */
function MasonryGallery({ images }) {
  const [lightboxIdx, setLightboxIdx] = useState(null);

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 190px), 1fr))',
        gap: '0.875rem',
        marginTop: '2.5rem',
      }}>
        {images.map(({ src, fallback, alt }, i) => (
          <div
            key={src}
            onClick={() => setLightboxIdx(i)}
            style={{
              position: 'relative',
              borderRadius: '0.875rem',
              overflow: 'hidden',
              cursor: 'zoom-in',
              aspectRatio: '4 / 3',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <img
              src={src}
              alt={alt}
              width="900"
              height="600"
              loading={i < 3 ? 'eager' : 'lazy'}
              onError={fallback ? (e) => { e.target.onerror = null; e.target.src = fallback; } : undefined}
              style={{
                display: 'block',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>
        ))}
      </div>

      {lightboxIdx !== null && (
        <Lightbox
          images={images}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </>
  );
}

/* ── Single project block ──────────────────────────────────────────────── */
function ProjectBlock({ project, index }) {
  const isEven = index % 2 === 0;

  return (
    <section
      id={project.id}
      style={{
        background: project.bg,
        padding: 'clamp(4rem,8vw,6rem) clamp(1.25rem,4vw,2rem)',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div className="reveal" style={{ marginBottom: 'clamp(2rem,4vw,3rem)' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.65rem',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            fontWeight: 700,
            color: project.categoryColor,
            marginBottom: '0.9rem',
          }}>
            <span style={{ width: 22, height: 1.5, background: project.categoryColor, display: 'block', borderRadius: 1 }} />
            {project.category}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '0.75rem 1.5rem' }}>
            <h2 style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 'clamp(1.7rem, 3.5vw, 2.75rem)',
              fontWeight: 400,
              lineHeight: 1.15,
              color: C.greenDeep,
              margin: 0,
            }}>
              {project.title}
            </h2>
            <span style={{
              fontSize: '0.78rem',
              color: C.inkLight,
              fontWeight: 400,
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
            }}>
              {project.subtitle}
            </span>
          </div>
        </div>

        {/* ── Two-column: text + slider ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
          gap: 'clamp(1.5rem, 4vw, 3.5rem)',
          alignItems: 'start',
        }}>

          {/* Text column */}
          <div
            className="reveal reveal-delay-1"
            style={{ order: isEven ? 0 : 1 }}
          >
            <p style={{
              fontSize: 'clamp(0.88rem, 1.2vw, 0.97rem)',
              color: C.inkMuted,
              lineHeight: 1.85,
              fontWeight: 300,
              marginBottom: '2rem',
            }}>
              {project.desc}
            </p>

            {/* Stats */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem 2rem',
              paddingTop: '1.5rem',
              borderTop: `1px solid ${project.bg === C.sand ? '#e0d8c8' : '#d8ceb8'}`,
            }}>
              {project.stats.map(({ value, label }) => (
                <div key={label}>
                  <div style={{
                    fontFamily: 'Cormorant Garamond, serif',
                    fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
                    fontWeight: 600,
                    color: project.categoryColor,
                    lineHeight: 1,
                    marginBottom: '0.2rem',
                  }}>
                    {value}
                  </div>
                  <div style={{ fontSize: '0.73rem', color: C.inkLight, fontWeight: 400, letterSpacing: '0.02em' }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Slider column */}
          <div
            className="reveal reveal-delay-2"
            style={{ order: isEven ? 1 : 0 }}
          >
            <ImageComparison
              beforeImage={project.before}
              afterImage={project.after}
              beforeFallback={project.beforeFallback}
              afterFallback={project.afterFallback}
              height={380}
            />
          </div>
        </div>

        {/* ── Masonry gallery ── */}
        <MasonryGallery images={project.gallery} />

      </div>
    </section>
  );
}

/* ── Projects Index (animated overview between hero and blocks) ─────────── */
function ProjectRow({ project, index, isActive, onEnter, onLeave }) {
  const rowRef = useRef(null);
  const inView = useInView(rowRef, { once: true, margin: '-60px' });

  const imgSrc = project.after || project.afterFallback;
  const fallback = project.afterFallback;

  return (
    <motion.div
      ref={rowRef}
      initial={{ opacity: 0, x: -44 }}
      animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -44 }}
      transition={{ duration: 0.7, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => onEnter(index)}
      onMouseLeave={onLeave}
      style={{ position: 'relative' }}
    >
      <a
        href={`#${project.id}`}
        style={{
          display: 'grid',
          gridTemplateColumns: '3.5rem 1fr auto',
          alignItems: 'center',
          gap: '1.5rem',
          padding: 'clamp(1.1rem,2.5vw,1.6rem) clamp(1rem,2vw,1.5rem)',
          borderBottom: `1px solid ${isActive ? C.green + '40' : C.sandDark}`,
          background: isActive
            ? `linear-gradient(90deg, ${C.green}08 0%, transparent 80%)`
            : 'transparent',
          textDecoration: 'none',
          transition: 'background 0.35s ease, border-color 0.35s ease',
          cursor: 'pointer',
          borderRadius: isActive ? '0.75rem' : '0',
        }}
      >
        {/* ── Number ── */}
        <span style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: 'clamp(1.4rem,2.5vw,1.9rem)',
          fontWeight: 700,
          color: isActive ? project.categoryColor : C.sandDark,
          lineHeight: 1,
          transition: 'color 0.35s ease',
          userSelect: 'none',
        }}>
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* ── Title + meta ── */}
        <div>
          <div style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 'clamp(1.1rem,2.2vw,1.55rem)',
            fontWeight: isActive ? 600 : 400,
            color: isActive ? C.greenDeep : C.ink,
            lineHeight: 1.2,
            marginBottom: '0.25rem',
            transition: 'color 0.3s ease, font-weight 0.1s',
          }}>
            {project.title}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            flexWrap: 'wrap',
          }}>
            <span style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: project.categoryColor,
              background: project.categoryColor + '14',
              padding: '2px 8px',
              borderRadius: 999,
            }}>
              {project.category}
            </span>
            <span style={{ fontSize: '0.75rem', color: C.inkLight, fontWeight: 300 }}>
              {project.subtitle}
            </span>
          </div>
        </div>

        {/* ── Thumbnail ── */}
        <div style={{
          width: 'clamp(64px,10vw,110px)',
          height: 'clamp(44px,6.5vw,74px)',
          borderRadius: '0.6rem',
          overflow: 'hidden',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <img
            src={imgSrc}
            alt={project.title}
            width="900"
            height="600"
            loading={index < 2 ? 'eager' : 'lazy'}
            onError={fallback ? (e) => { e.target.onerror = null; e.target.src = fallback; } : undefined}
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </div>
      </a>

      {/* Active indicator bar */}
      <motion.div
        animate={{ scaleX: isActive ? 1 : 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute',
          left: 0, top: '15%', bottom: '15%',
          width: 3, borderRadius: 3,
          background: project.categoryColor,
          transformOrigin: 'top',
        }}
      />
    </motion.div>
  );
}

function ProjectsIndex() {
  const [activeIdx, setActiveIdx] = useState(null);
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, margin: '-40px' });

  return (
    <section style={{
      background: C.sand,
      padding: 'clamp(4rem,8vw,6rem) clamp(1.25rem,4vw,2rem)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle decorative bg text */}
      <div style={{
        position: 'absolute',
        right: '-2rem',
        top: '50%',
        transform: 'translateY(-50%)',
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: 'clamp(6rem,14vw,12rem)',
        fontWeight: 700,
        color: C.sandDark,
        opacity: 0.35,
        lineHeight: 1,
        userSelect: 'none',
        pointerEvents: 'none',
        letterSpacing: '-0.04em',
      }}>
        08
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>

        {/* Header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 28 }}
          animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginBottom: 'clamp(2rem,4vw,3.5rem)' }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
            fontSize: '0.63rem', letterSpacing: '0.26em',
            textTransform: 'uppercase', fontWeight: 600,
            color: C.ochre, marginBottom: '0.85rem',
          }}>
            <span style={{ width: 24, height: 1.5, background: C.ochre, display: 'block' }} />
            Vue d&apos;ensemble
          </div>
          <TextEffect
            as="h2"
            preset="slide"
            per="word"
            delay={0.15}
            className=""
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 'clamp(1.8rem,3.5vw,2.8rem)',
              fontWeight: 400, lineHeight: 1.12,
              color: C.greenDeep, margin: 0,
            }}
          >
            {`${PROJECTS.length} projets, un seul objectif`}
          </TextEffect>
        </motion.div>

        {/* Project rows */}
        <div style={{ borderTop: `1px solid ${C.sandDark}` }}>
          {PROJECTS.map((p, i) => (
            <ProjectRow
              key={p.id}
              project={p}
              index={i}
              isActive={activeIdx === i}
              onEnter={setActiveIdx}
              onLeave={() => setActiveIdx(null)}
            />
          ))}
        </div>

        {/* Footer hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={headerInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: PROJECTS.length * 0.07 + 0.3 }}
          style={{
            marginTop: '2rem',
            fontSize: '0.72rem',
            color: C.inkLight,
            fontWeight: 400,
            letterSpacing: '0.04em',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}
        >
          <span style={{ width: 16, height: 1, background: C.inkLight, display: 'block' }} />
          Survolez un projet pour l&apos;apercevoir — cliquez pour y accéder
        </motion.div>
      </div>
    </section>
  );
}

/* ── Page hero ─────────────────────────────────────────────────────────── */
function PageHero() {
  return (
    <section style={{
      background: C.greenDeep,
      color: '#fff',
      padding: '4rem 1.5rem 3rem',
      textAlign: 'center',
      paddingTop: '8rem',
    }}>
      <div className="reveal" style={{ maxWidth: 700, margin: '0 auto' }}>
        <p style={{
          fontSize: '0.68rem', letterSpacing: '0.28em', textTransform: 'uppercase',
          color: 'rgba(196,169,107,0.9)', marginBottom: '0.75rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
        }}>
          <span style={{ display: 'block', width: 24, height: 1, background: 'rgba(196,169,107,0.6)' }} />
          Nos projets
          <span style={{ display: 'block', width: 24, height: 1, background: 'rgba(196,169,107,0.6)' }} />
        </p>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: 'clamp(2rem,5vw,3.5rem)',
          fontWeight: 300, lineHeight: 1.1,
        }}>
          {PROJECTS.length} projets pour<br />
          <em style={{ fontStyle: 'italic', fontWeight: 400 }}>Tighremt &amp; la région</em>
        </h1>
        <p style={{ marginTop: '0.75rem', opacity: 0.6, fontSize: '0.92rem', lineHeight: 1.7 }}>
          Environnement, infrastructure, éducation, solidarité et mémoire du territoire.
        </p>
      </div>
    </section>
  );
}

/* ── Main export ───────────────────────────────────────────────────────── */
export default function ProjetsContent() {
  useScrollReveal();

  return (
    <>
      <style>{`
        @media (max-width: 440px) {
          .proj-gallery-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      <PageHero />

      <ProjectsIndex />

      {PROJECTS.map((project, i) => (
        <ProjectBlock key={project.id} project={project} index={i} />
      ))}

      {/* Bottom CTA */}
      <section style={{
        background: C.greenDeep,
        padding: 'clamp(4rem,8vw,6rem) clamp(1.25rem,4vw,2rem)',
        textAlign: 'center',
      }}>
        <div className="reveal" style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 'clamp(1.8rem,3.5vw,2.6rem)',
            fontWeight: 400,
            color: '#fff',
            marginBottom: '1rem',
          }}>
            Soutenir ces projets
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.68)',
            fontSize: '0.95rem',
            lineHeight: 1.75,
            fontWeight: 300,
            marginBottom: '2rem',
          }}>
            Chaque don, aussi modeste soit-il, contribue directement à ces actions sur le terrain.
          </p>
          <a
            href="/don"
            style={{
              display: 'inline-block',
              background: C.ochre,
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.88rem',
              letterSpacing: '0.04em',
              padding: '0.875rem 2.5rem',
              borderRadius: '2rem',
              textDecoration: 'none',
              transition: 'background 0.2s, transform 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = C.ochreDark;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = C.ochre;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Faire un don →
          </a>
        </div>
      </section>
    </>
  );
}
