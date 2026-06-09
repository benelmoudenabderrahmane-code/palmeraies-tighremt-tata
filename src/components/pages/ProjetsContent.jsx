'use client';
import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { C, FONT } from '@/lib/tokens';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import Lightbox from '@/components/ui/Lightbox';
import SectionDivider from '@/components/ui/SectionDivider';
import { TextEffect } from '@/components/ui/TextEffect';
import { ContainerScroll, ContainerScale, BentoGrid, BentoCell } from '@/components/ui/ScrollBentoGrid';

const ImageComparison = dynamic(
  () => import('@/components/ui/ImageComparison'),
  { ssr: false },
);

const VideoThumbnailPlayer = dynamic(
  () => import('@/components/ui/VideoThumbnailPlayer'),
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
    id: 'ain-travaux',
    bg: C.sandMid,
    category: 'Eau & Irrigation',
    categoryColor: C.green,
    title: "Aménagement du point d'eau d'Aïn",
    subtitle: 'Oued de Tighremt · 2016 – 2017',
    desc: "Sur l'oued d'Aïn, l'eau des crues s'écoulait sans jamais être retenue, laissant le lit à sec une grande partie de l'année. L'association a fait édifier un seuil de captage renforcé par des gabions, créant un bassin de rétention qui stocke l'eau saisonnière, recharge la nappe phréatique et sécurise l'irrigation de la palmeraie de Tighremt pendant les mois secs.",
    stats: [
      { value: '2016–17', label: 'période des travaux' },
      { value: '1',       label: 'bassin de rétention' },
      { value: 'Gabions', label: 'seuil de captage' },
    ],
    before: '/images/tighremt/ain-avant.jpg',
    after:  '/images/tighremt/ain-apres.jpg',
    video: {
      src:         '/videos/ain-chantier.mp4',
      thumbnail:   '/images/tighremt/ain-g1.jpg',
      title:       "Chantier d'Aïn — décembre 2016",
      description: "Vue du chantier depuis l'oued · Construction du seuil de captage en gabions",
    },
    gallery: [
      { src: '/images/tighremt/ain-g1.jpg',  alt: "Bassin de rétention rempli — vue après aménagement" },
      { src: '/images/tighremt/ain-g2.jpg',  alt: "Chantier de terrassement sur l'oued d'Aïn" },
      { src: '/images/tighremt/ain-g3.jpg',  alt: "Avancement des travaux de maçonnerie du seuil" },
      { src: '/images/tighremt/ain-g4.jpg',  alt: "Vue panoramique de l'oued et de la palmeraie" },
      { src: '/images/tighremt/ain-g5.jpg',  alt: "Ouvriers sur le chantier de l'oued d'Aïn" },
      { src: '/images/tighremt/ain-g6.jpg',  alt: "Mise en place du seuil de captage en gabions" },
      { src: '/images/tighremt/ain-g7.jpg',  alt: "Détail de la construction du mur de soutènement" },
      { src: '/images/tighremt/ain-g8.jpg',  alt: "Vue rapprochée de la structure en gabions" },
      { src: '/images/tighremt/ain-g9.jpg',  alt: "Lit de l'oued en cours d'aménagement" },
      { src: '/images/tighremt/ain-g10.jpg', alt: "Travaux d'excavation et de préparation du fond" },
      { src: '/images/tighremt/ain-g11.jpg', alt: "Berge consolidée côté palmeraie" },
      { src: '/images/tighremt/ain-g12.jpg', alt: "Chantier — phase de coulage du béton" },
      { src: '/images/tighremt/ain-g13.jpg', alt: "Vue en contre-plongée du seuil finalisé" },
      { src: '/images/tighremt/ain-g14.jpg', alt: "Retenue d'eau naissante derrière le seuil" },
      { src: '/images/tighremt/ain-g15.jpg', alt: "Plan d'eau du bassin de rétention d'Aïn" },
      { src: '/images/tighremt/ain-g16.jpg', alt: "Ouvrage hydraulique — vue aval de l'oued" },
      { src: '/images/tighremt/ain-g17.jpg', alt: "Finalisation des travaux de maçonnerie" },
      { src: '/images/tighremt/ain-g18.jpg', alt: "Panorama du site après achèvement des travaux" },
      { src: '/images/tighremt/ain-g19.jpg', alt: "Visite du site avant travaux — novembre 2016" },
      { src: '/images/tighremt/ain-g20.jpg', alt: "Reconnaissance du terrain — équipe bénévole" },
    ],
  },
  {
    id: 'fournitures-scolaires',
    bg: C.sand,
    category: 'Éducation',
    categoryColor: '#2b7cbf',
    title: 'Distribution de fournitures scolaires',
    subtitle: 'Douar de Tighremt · 2018 – présent',
    desc: "Chaque année à la rentrée scolaire, l'association distribue des kits scolaires complets aux enfants du douar : cartables, cahiers, stylos, trousses, règles et livres. Aucun enfant de Tighremt ne doit manquer de matériel pour accéder à l'éducation. Les bénéficiaires sont identifiés avec les enseignants et les familles les plus vulnérables.",
    stats: [
      { value: '80+',  label: 'enfants bénéficiaires' },
      { value: '6',    label: 'rentrées couvertes' },
      { value: '100%', label: "financé par l'association" },
    ],
    banner: 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=1200&q=82&auto=format&fit=crop',
    gallery: [
      { src: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=900&q=75&auto=format&fit=crop', alt: 'Enfants en classe avec leurs fournitures' },
      { src: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=900&q=75&auto=format&fit=crop', alt: 'Crayons de couleur et fournitures scolaires' },
      { src: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=900&q=75&auto=format&fit=crop', alt: 'Salle de classe — élèves au travail' },
      { src: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=900&q=75&auto=format&fit=crop', alt: 'Distribution de kits scolaires aux enfants' },
      { src: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=900&q=75&auto=format&fit=crop', alt: 'Enfant apprenant à écrire' },
      { src: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=900&q=75&auto=format&fit=crop', alt: 'Cartables et sacs scolaires prêts pour la rentrée' },
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
      { src: '/images/tighremt/vest-g1.jpg',  alt: 'Vestiaire — vue intérieure 1' },
      { src: '/images/tighremt/vest-g2.jpg',  alt: 'Vestiaire — vue intérieure 2' },
      { src: '/images/tighremt/vest-g3.jpg',  alt: 'Vestiaire — vue intérieure 3' },
      { src: '/images/tighremt/vest-g4.jpg',  alt: 'Vestiaire — détail installation 4' },
      { src: '/images/tighremt/vest-g5.jpg',  alt: 'Vestiaire — vue intérieure 5' },
      { src: '/images/tighremt/vest-g6.jpg',  alt: 'Vestiaire — vue intérieure 6' },
      { src: '/images/tighremt/vest-g7.jpg',  alt: 'Vestiaire — détail installation 7' },
      { src: '/images/tighremt/vest-g8.jpg',  alt: 'Vestiaire — vue intérieure 8' },
      { src: '/images/tighremt/vest-g9.jpg',  alt: 'Vestiaire — détail installation 9' },
      { src: '/images/tighremt/vest-g10.jpg', alt: 'Vestiaire — vue intérieure 10' },
      { src: '/images/tighremt/vest-g11.jpg', alt: 'Vestiaire — vue intérieure 11' },
      { src: '/images/tighremt/vest-g12.jpg', alt: 'Vestiaire — vue intérieure 12' },
      { src: '/images/tighremt/vest-g13.jpg', alt: 'Vestiaire — vue intérieure 13' },
      { src: '/images/tighremt/vest-g14.jpg', alt: 'Vestiaire — vue intérieure 14' },
      { src: '/images/tighremt/vest-g15.jpg', alt: 'Vestiaire — vue intérieure 15' },
      { src: '/images/tighremt/vest-g16.jpg', alt: 'Vestiaire — vue intérieure 16' },
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
  {
    id: 'tournoi-foot',
    bg: C.sand,
    category: 'Sport & Culture',
    categoryColor: C.green,
    title: 'Tournoi de Football de Tighremt',
    subtitle: 'Douar Tighremt, Province de Tata',
    desc: "Chaque année, l'association organise le tournoi de football de Tighremt, un événement festif et sportif qui rassemble équipes locales et villages voisins autour d'une compétition amicale. Ce tournoi est bien plus qu'un match : c'est un moment de cohésion, de fierté collective et de lien social pour toute la communauté du douar.",
    stats: [
      { value: '8+',    label: 'équipes participantes' },
      { value: '200+',  label: 'spectateurs par édition' },
      { value: '100%',  label: 'organisé par des bénévoles' },
    ],
    banner: '/images/tighremt/chantiers-modernes-banner.jpg',
    bannerLabel: 'En partenariat avec Chantiers Modernes Construction',
    gallery: [
      { src: '/images/tighremt/tournoi-g1.jpg', alt: 'Tournoi de football de Tighremt — photo 1' },
      { src: '/images/tighremt/tournoi-g2.jpg', alt: 'Tournoi de football de Tighremt — photo 2' },
      { src: '/images/tighremt/tournoi-g3.jpg', alt: 'Tournoi de football de Tighremt — photo 3' },
      { src: '/images/tighremt/tournoi-g4.jpg', alt: 'Tournoi de football de Tighremt — photo 4' },
      { src: '/images/tighremt/tournoi-g5.jpg', alt: 'Tournoi de football de Tighremt — photo 5' },
      { src: '/images/tighremt/tournoi-g6.jpg', alt: 'Tournoi de football de Tighremt — photo 6' },
      { src: '/images/tighremt/tournoi-g7.jpg', alt: 'Tournoi de football de Tighremt — photo 7' },
      { src: '/images/tighremt/tournoi-g8.jpg', alt: 'Tournoi de football de Tighremt — photo 8' },
      { src: '/images/tighremt/tournoi-g9.jpg', alt: 'Tournoi de football de Tighremt — photo 9' },
      { src: '/images/tighremt/tournoi-g10.jpg', alt: 'Tournoi de football de Tighremt — photo 10' },
      { src: '/images/tighremt/tournoi-g11.jpg', alt: 'Tournoi de football de Tighremt — photo 11' },
      { src: '/images/tighremt/tournoi-g12.jpg', alt: 'Tournoi de football de Tighremt — photo 12' },
      { src: '/images/tighremt/tournoi-g13.jpg', alt: 'Tournoi de football de Tighremt — photo 13' },
      { src: '/images/tighremt/tournoi-g14.jpg', alt: 'Tournoi de football de Tighremt — photo 14' },
      { src: '/images/tighremt/tournoi-g15.jpg', alt: 'Tournoi de football de Tighremt — photo 15' },
      { src: '/images/tighremt/tournoi-g16.jpg', alt: 'Tournoi de football de Tighremt — photo 16' },
      { src: '/images/tighremt/tournoi-g17.jpg', alt: 'Tournoi de football de Tighremt — photo 17' },
      { src: '/images/tighremt/tournoi-g18.jpg', alt: 'Tournoi de football de Tighremt — photo 18' },
      { src: '/images/tighremt/tournoi-g19.jpg', alt: 'Tournoi de football de Tighremt — photo 19' },
      { src: '/images/tighremt/tournoi-g20.jpg', alt: 'Tournoi de football de Tighremt — photo 20' },
      { src: '/images/tighremt/tournoi-g21.jpg', alt: 'Tournoi de football de Tighremt — photo 21' },
      { src: '/images/tighremt/tournoi-g22.jpg', alt: 'Tournoi de football de Tighremt — photo 22' },
      { src: '/images/tighremt/tournoi-g23.jpg', alt: 'Tournoi de football de Tighremt — photo 23' },
      { src: '/images/tighremt/tournoi-g24.jpg', alt: 'Tournoi de football de Tighremt — photo 24' },
      { src: '/images/tighremt/tournoi-g25.jpg', alt: 'Tournoi de football de Tighremt — photo 25' },
      { src: '/images/tighremt/tournoi-g26.jpg', alt: 'Tournoi de football de Tighremt — photo 26' },
      { src: '/images/tighremt/tournoi-g27.jpg', alt: 'Tournoi de football de Tighremt — photo 27' },
      { src: '/images/tighremt/tournoi-g28.jpg', alt: 'Tournoi de football de Tighremt — photo 28' },
      { src: '/images/tighremt/tournoi-g29.jpg', alt: 'Tournoi de football de Tighremt — photo 29' },
      { src: '/images/tighremt/tournoi-g30.jpg', alt: 'Tournoi de football de Tighremt — photo 30' },
      { src: '/images/tighremt/tournoi-g31.jpg', alt: 'Tournoi de football de Tighremt — photo 31' },
      { src: '/images/tighremt/tournoi-g32.jpg', alt: 'Tournoi de football de Tighremt — photo 32' },
      { src: '/images/tighremt/tournoi-g33.jpg', alt: 'Tournoi de football de Tighremt — photo 33' },
      { src: '/images/tighremt/tournoi-g34.jpg', alt: 'Tournoi de football de Tighremt — photo 34' },
      { src: '/images/tighremt/tournoi-g35.jpg', alt: 'Tournoi de football de Tighremt — photo 35' },
      { src: '/images/tighremt/tournoi-g36.jpg', alt: 'Tournoi de football de Tighremt — photo 36' },
      { src: '/images/tighremt/tournoi-g37.jpg', alt: 'Tournoi de football de Tighremt — photo 37' },
      { src: '/images/tighremt/tournoi-g38.jpg', alt: 'Tournoi de football de Tighremt — photo 38' },
      { src: '/images/tighremt/tournoi-g39.jpg', alt: 'Tournoi de football de Tighremt — photo 39' },
      { src: '/images/tighremt/tournoi-g40.jpg', alt: 'Tournoi de football de Tighremt — photo 40' },
      { src: '/images/tighremt/tournoi-g41.jpg', alt: 'Tournoi de football de Tighremt — photo 41' },
      { src: '/images/tighremt/tournoi-g42.jpg', alt: 'Tournoi de football de Tighremt — photo 42' },
      { src: '/images/tighremt/tournoi-g43.jpg', alt: 'Tournoi de football de Tighremt — photo 43' },
      { src: '/images/tighremt/tournoi-g44.jpg', alt: 'Tournoi de football de Tighremt — photo 44' },
      { src: '/images/tighremt/tournoi-g45.jpg', alt: 'Tournoi de football de Tighremt — photo 45' },
      { src: '/images/tighremt/tournoi-g46.jpg', alt: 'Tournoi de football de Tighremt — photo 46' },
      { src: '/images/tighremt/tournoi-g47.jpg', alt: 'Tournoi de football de Tighremt — photo 47' },
      { src: '/images/tighremt/tournoi-g48.jpg', alt: 'Tournoi de football de Tighremt — photo 48' },
      { src: '/images/tighremt/tournoi-g49.jpg', alt: 'Tournoi de football de Tighremt — photo 49' },
      { src: '/images/tighremt/tournoi-g50.jpg', alt: 'Tournoi de football de Tighremt — photo 50' },
      { src: '/images/tighremt/tournoi-g51.jpg', alt: 'Tournoi de football de Tighremt — photo 51' },
      { src: '/images/tighremt/tournoi-g52.jpg', alt: 'Tournoi de football de Tighremt — photo 52' },
      { src: '/images/tighremt/tournoi-g53.jpg', alt: 'Tournoi de football de Tighremt — photo 53' },
      { src: '/images/tighremt/tournoi-g54.jpg', alt: 'Tournoi de football de Tighremt — photo 54' },
      { src: '/images/tighremt/tournoi-g55.jpg', alt: 'Tournoi de football de Tighremt — photo 55' },
      { src: '/images/tighremt/tournoi-g56.jpg', alt: 'Tournoi de football de Tighremt — photo 56' },
      { src: '/images/tighremt/tournoi-g57.jpg', alt: 'Tournoi de football de Tighremt — photo 57' },
      { src: '/images/tighremt/tournoi-g58.jpg', alt: 'Tournoi de football de Tighremt — photo 58' },
      { src: '/images/tighremt/tournoi-g59.jpg', alt: 'Tournoi de football de Tighremt — photo 59' },
      { src: '/images/tighremt/tournoi-g60.jpg', alt: 'Tournoi de football de Tighremt — photo 60' },
      { src: '/images/tighremt/tournoi-g61.jpg', alt: 'Tournoi de football de Tighremt — photo 61' },
      { src: '/images/tighremt/tournoi-g62.jpg', alt: 'Tournoi de football de Tighremt — photo 62' },
      { src: '/images/tighremt/tournoi-g63.jpg', alt: 'Tournoi de football de Tighremt — photo 63' },
      { src: '/images/tighremt/tournoi-g64.jpg', alt: 'Tournoi de football de Tighremt — photo 64' },
      { src: '/images/tighremt/tournoi-g65.jpg', alt: 'Tournoi de football de Tighremt — photo 65' },
      { src: '/images/tighremt/tournoi-g66.jpg', alt: 'Tournoi de football de Tighremt — photo 66' },
      { src: '/images/tighremt/tournoi-g67.jpg', alt: 'Tournoi de football de Tighremt — photo 67' },
      { src: '/images/tighremt/tournoi-g68.jpg', alt: 'Tournoi de football de Tighremt — photo 68' },
      { src: '/images/tighremt/tournoi-g69.jpg', alt: 'Tournoi de football de Tighremt — photo 69' },
      { src: '/images/tighremt/tournoi-g70.jpg', alt: 'Tournoi de football de Tighremt — photo 70' },
      { src: '/images/tighremt/tournoi-g71.jpg', alt: 'Tournoi de football de Tighremt — photo 71' },
      { src: '/images/tighremt/tournoi-g72.jpg', alt: 'Tournoi de football de Tighremt — photo 72' },
      { src: '/images/tighremt/tournoi-g73.jpg', alt: 'Tournoi de football de Tighremt — photo 73' },
      { src: '/images/tighremt/tournoi-g74.jpg', alt: 'Tournoi de football de Tighremt — photo 74' },
      { src: '/images/tighremt/tournoi-g75.jpg', alt: 'Tournoi de football de Tighremt — photo 75' },
      { src: '/images/tighremt/tournoi-g76.jpg', alt: 'Tournoi de football de Tighremt — photo 76' },
      { src: '/images/tighremt/tournoi-g77.jpg', alt: 'Tournoi de football de Tighremt — photo 77' },
      { src: '/images/tighremt/tournoi-g78.jpg', alt: 'Tournoi de football de Tighremt — photo 78' },
      { src: '/images/tighremt/tournoi-g79.jpg', alt: 'Tournoi de football de Tighremt — photo 79' },
      { src: '/images/tighremt/tournoi-g80.jpg', alt: 'Tournoi de football de Tighremt — photo 80' },
      { src: '/images/tighremt/tournoi-g81.jpg', alt: 'Tournoi de football de Tighremt — photo 81' },
      { src: '/images/tighremt/tournoi-g82.jpg', alt: 'Tournoi de football de Tighremt — photo 82' },
      { src: '/images/tighremt/tournoi-g83.jpg', alt: 'Tournoi de football de Tighremt — photo 83' },
      { src: '/images/tighremt/tournoi-g84.jpg', alt: 'Tournoi de football de Tighremt — photo 84' },
      { src: '/images/tighremt/tournoi-g85.jpg', alt: 'Tournoi de football de Tighremt — photo 85' },
      { src: '/images/tighremt/tournoi-g86.jpg', alt: 'Tournoi de football de Tighremt — photo 86' },
      { src: '/images/tighremt/tournoi-g87.jpg', alt: 'Tournoi de football de Tighremt — photo 87' },
      { src: '/images/tighremt/tournoi-g88.jpg', alt: 'Tournoi de football de Tighremt — photo 88' },
      { src: '/images/tighremt/tournoi-g89.jpg', alt: 'Tournoi de football de Tighremt — photo 89' },
      { src: '/images/tighremt/tournoi-g90.jpg', alt: 'Tournoi de football de Tighremt — photo 90' },
      { src: '/images/tighremt/tournoi-g91.jpg', alt: 'Tournoi de football de Tighremt — photo 91' },
      { src: '/images/tighremt/tournoi-g92.jpg', alt: 'Tournoi de football de Tighremt — photo 92' },
    ],
  },
  {
    id: 'sidi-oasis-foot',
    bg: C.sandMid,
    category: 'Sport & Infrastructure',
    categoryColor: C.greenDeep,
    title: "Terrain de Football — Sidi Oua'aziz",
    subtitle: "Douar Tighremt, Province de Tata",
    desc: "L'association a réalisé l'aménagement et la réhabilitation du terrain de football de Sidi Oua'aziz : nivellement, marquage et mise en état de la surface de jeu pour offrir aux jeunes du douar un espace sportif digne et fonctionnel. Un investissement direct dans la jeunesse et la cohésion sociale de Tighremt.",
    stats: [
      { value: '1',     label: 'terrain aménagé' },
      { value: '100%',  label: 'main-d\'œuvre locale' },
      { value: '50+',   label: 'jeunes bénéficiaires' },
    ],
    before:  '/images/tighremt/sidi-foot-avant.jpg',
    after:   '/images/tighremt/sidi-foot-apres.jpg',
    gallery: [
      { src: '/images/tighremt/sidi-foot-g1.jpg',  alt: "Terrain de Sidi Oua'aziz — travaux d'aménagement 1" },
      { src: '/images/tighremt/sidi-foot-g2.jpg',  alt: "Terrain de Sidi Oua'aziz — travaux d'aménagement 2" },
      { src: '/images/tighremt/sidi-foot-g3.jpg',  alt: "Terrain de Sidi Oua'aziz — travaux d'aménagement 3" },
      { src: '/images/tighremt/sidi-foot-g4.jpg',  alt: "Terrain de Sidi Oua'aziz — travaux d'aménagement 4" },
      { src: '/images/tighremt/sidi-foot-g5.jpg',  alt: "Terrain de Sidi Oua'aziz — travaux d'aménagement 5" },
      { src: '/images/tighremt/sidi-foot-g6.jpg',  alt: "Terrain de Sidi Oua'aziz — travaux d'aménagement 6" },
      { src: '/images/tighremt/sidi-foot-g7.jpg',  alt: "Terrain de Sidi Oua'aziz — travaux d'aménagement 7" },
      { src: '/images/tighremt/sidi-foot-g8.jpg',  alt: "Terrain de Sidi Oua'aziz — travaux d'aménagement 8" },
      { src: '/images/tighremt/sidi-foot-g9.jpg',  alt: "Terrain de Sidi Oua'aziz — travaux d'aménagement 9" },
      { src: '/images/tighremt/sidi-foot-g10.jpg', alt: "Terrain de Sidi Oua'aziz — travaux d'aménagement 10" },
    ],
  },
];

/* ── Gallery ───────────────────────────────────────────────────────────── */
function MasonryGallery({ images }) {
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [hoveredIdx, setHoveredIdx]   = useState(null);

  return (
    <>
      <style>{`
        @keyframes gallery-shimmer {
          from { transform: translateX(-100%) skewX(-12deg); }
          to   { transform: translateX(220%) skewX(-12deg); }
        }
      `}</style>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 190px), 1fr))',
        gap: '0.875rem',
        marginTop: '2.5rem',
      }}>
        {images.map(({ src, fallback, alt }, i) => {
          const isHovered = hoveredIdx === i;
          return (
            <div
              key={src}
              onClick={() => setLightboxIdx(i)}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                position: 'relative',
                borderRadius: '0.875rem',
                overflow: 'hidden',
                cursor: 'zoom-in',
                aspectRatio: '4 / 3',
                transform: isHovered ? 'scale(1.04) translateY(-4px)' : 'scale(1) translateY(0)',
                transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease',
                boxShadow: isHovered
                  ? '0 20px 48px rgba(19,61,32,0.22), 0 4px 12px rgba(0,0,0,0.12)'
                  : '0 2px 8px rgba(0,0,0,0.08)',
                zIndex: isHovered ? 2 : 1,
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
                  transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1)',
                  transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                }}
              />

              {/* Gradient overlay on hover */}
              <div style={{
                position: 'absolute', inset: 0,
                background: isHovered
                  ? 'linear-gradient(to top, rgba(19,61,32,0.55) 0%, rgba(19,61,32,0.1) 60%, transparent 100%)'
                  : 'linear-gradient(to top, rgba(0,0,0,0.12) 0%, transparent 50%)',
                transition: 'background 0.4s ease',
              }} />

              {/* Shimmer sweep on hover */}
              {isHovered && (
                <div style={{
                  position: 'absolute', inset: 0,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                  borderRadius: '0.875rem',
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0, bottom: 0,
                    width: '40%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
                    animation: 'gallery-shimmer 0.7s ease forwards',
                  }} />
                </div>
              )}

              {/* Zoom icon */}
              <div style={{
                position: 'absolute',
                bottom: 10, right: 10,
                width: 30, height: 30,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.92)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: isHovered ? 1 : 0,
                transform: isHovered ? 'scale(1)' : 'scale(0.6)',
                transition: 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.16,1,0.3,1)',
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="6" cy="6" r="4" stroke="#133d20" strokeWidth="1.5"/>
                  <path d="M9.5 9.5L13 13" stroke="#133d20" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M4 6H8M6 4V8" stroke="#133d20" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
          );
        })}
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
              fontFamily: FONT.alt,
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
                    fontFamily: FONT.alt,
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

          {/* Slider column (optional — only when before+after are defined) */}
          {(project.before && project.after) && (
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
          )}

          {/* Single banner image (when no before/after slider) */}
          {project.banner && !(project.before && project.after) && (
            <div
              className="reveal reveal-delay-2"
              style={{ order: isEven ? 1 : 0 }}
            >
              <div style={{
                borderRadius: '1rem',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(19,61,32,0.12)',
                border: `1px solid ${C.sandDark}`,
              }}>
                <img
                  src={project.banner}
                  alt={project.bannerLabel || project.title}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </div>
              {project.bannerLabel && (
                <div style={{
                  marginTop: '0.75rem',
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  padding: '0.6rem 1rem',
                  background: `${C.ochre}14`,
                  border: `1px solid ${C.ochre}30`,
                  borderRadius: '0.5rem',
                }}>
                  <span style={{ color: C.ochre, fontSize: '1rem' }}>🤝</span>
                  <span style={{
                    fontSize: '0.78rem', letterSpacing: '0.06em',
                    color: C.inkMuted, fontWeight: 500,
                  }}>
                    {project.bannerLabel}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Masonry gallery ── */}
        <MasonryGallery images={project.gallery} />

        {/* ── Video section (optional) ── */}
        {project.video && (
          <div className="reveal" style={{ marginTop: 'clamp(2.5rem,5vw,4rem)' }}>
            {/* Label */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
              fontSize: '0.65rem', letterSpacing: '0.22em', textTransform: 'uppercase',
              fontWeight: 700, color: project.categoryColor, marginBottom: '1.25rem',
            }}>
              <span style={{ width: 22, height: 1.5, background: project.categoryColor, display: 'block', borderRadius: 1 }} />
              Vidéo du chantier
            </div>

            <div style={{ maxWidth: 860, margin: '0 auto' }}>
              <VideoThumbnailPlayer
                thumbnailSrc={project.video.thumbnail}
                videoSrc={project.video.src}
                title={project.video.title}
                description={project.video.description}
                isExternal={false}
                aspectRatio="16/9"
              />
            </div>
          </div>
        )}

      </div>
    </section>
  );
}

/* ── Projects Index (animated overview between hero and blocks) ─────────── */
function ProjectRow({ project, index, isActive, onEnter, onLeave }) {
  const rowRef = useRef(null);
  const inView = useInView(rowRef, { once: true, margin: '-60px' });

  const imgSrc = project.after || project.afterFallback || project.banner || project.gallery?.[0]?.src;
  const fallback = project.afterFallback || project.gallery?.[0]?.src;

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
          fontFamily: FONT.alt,
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
            fontFamily: FONT.alt,
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
          boxShadow: isActive
            ? '0 10px 28px rgba(19,61,32,0.22)'
            : '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'box-shadow 0.4s ease, transform 0.4s cubic-bezier(0.16,1,0.3,1)',
          transform: isActive ? 'scale(1.06)' : 'scale(1)',
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
              transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1)',
              transform: isActive ? 'scale(1.12)' : 'scale(1)',
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
        fontFamily: FONT.alt,
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
              fontFamily: FONT.alt,
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

/* ── Bento image card ─────────────────────────────────────────────────────── */
function BentoCard({ project, fill = false }) {
  const imgSrc = project.after || project.afterFallback || project.banner || project.gallery?.[0]?.src;
  const fallback = project.afterFallback || project.banner || project.gallery?.[0]?.fallback;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: C.greenDeep }}>
      <img
        src={imgSrc}
        alt={project.title}
        width="900"
        height="600"
        loading="lazy"
        onError={fallback ? (e) => { e.target.onerror = null; e.target.src = fallback; } : undefined}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          display: 'block',
          opacity: 0.85,
        }}
      />
      {/* Dark gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(19,61,32,0.82) 0%, rgba(19,61,32,0.2) 55%, transparent 100%)',
      }} />
      {/* Text */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: fill ? '1.5rem 1.75rem' : '0.85rem 1rem',
      }}>
        <span style={{
          fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase',
          fontWeight: 700, color: C.gold, display: 'block', marginBottom: '0.25rem',
        }}>
          {project.category}
        </span>
        <div style={{
          fontFamily: FONT.alt,
          fontSize: fill ? 'clamp(1.1rem,2vw,1.45rem)' : '0.92rem',
          fontWeight: 500, color: '#fff', lineHeight: 1.2,
        }}>
          {project.title}
        </div>
      </div>
    </div>
  );
}

/* ── Scroll Bento Hero (replaces PageHero + ProjectsIndex) ───────────────── */
function ScrollBentoHero() {
  // Projects layout: [0]=big, [1][2]=tall right, [3][4]=wide bottom-left/right
  const top5 = PROJECTS.slice(0, 5);

  return (
    <div style={{ marginBottom: '-1px' }}>

      {/* ── Hero image plein écran (100vh) + titre centré par-dessus ── */}
      <div style={{ position: 'relative', width: '100%', height: '100vh', minHeight: 520, overflow: 'hidden' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden="true"
          src="/projet-hero.png"
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
        />
        {/* Overlay sombre léger pour lisibilité du texte */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.18) 50%, rgba(0,0,0,0.55) 100%)',
          pointerEvents: 'none',
        }} />
        {/* Titre centré sur l'image */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '6rem 1.5rem 2rem',
        }}>
          <p style={{
            fontSize: '0.66rem', letterSpacing: '0.3em', textTransform: 'uppercase',
            color: 'rgba(196,169,107,0.9)', marginBottom: '1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
          }}>
            <span style={{ display: 'block', width: 28, height: 1, background: 'rgba(196,169,107,0.5)' }} />
            Nos projets
            <span style={{ display: 'block', width: 28, height: 1, background: 'rgba(196,169,107,0.5)' }} />
          </p>
          <h1 style={{
            fontFamily: FONT.alt,
            fontSize: 'clamp(2.4rem,6vw,4.5rem)',
            fontWeight: 300, lineHeight: 1.15, color: '#fff',
            margin: '0 0 1rem', textShadow: '0 2px 30px rgba(0,0,0,0.5)',
          }}>
            {PROJECTS.length} projets pour<br />
            <RotatingText texts={PROJETS_TEXTS} interval={2600} />
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.93rem', lineHeight: 1.7, fontWeight: 300 }}>
            Environnement · Infrastructure · Éducation · Solidarité · Mémoire
          </p>
        </div>
      </div>

      {/* ── Bento grid statique — fond vert explicite, aucune transparence ── */}
      <div style={{
        background: C.greenDeep,
        padding: '1.5rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gridTemplateRows: 'repeat(5, 14vw)',
        gap: '0.75rem',
        minHeight: '70vh',
      }}>
        {/* Big dominant — col 1-6, row 1-3 */}
        <a href={`#${top5[0].id}`} style={{ gridColumn: '1 / 7', gridRow: '1 / 4', display: 'block', textDecoration: 'none', borderRadius: '0.75rem', overflow: 'hidden' }}>
          <BentoCard project={top5[0]} fill />
        </a>
        {/* Tall right top — col 7-8, row 1-2 */}
        <a href={`#${top5[1].id}`} style={{ gridColumn: '7 / 9', gridRow: '1 / 3', display: 'block', textDecoration: 'none', borderRadius: '0.75rem', overflow: 'hidden' }}>
          <BentoCard project={top5[1]} />
        </a>
        {/* Tall right bottom — col 7-8, row 3 */}
        <a href={`#${top5[2].id}`} style={{ gridColumn: '7 / 9', gridRow: '3 / 4', display: 'block', textDecoration: 'none', borderRadius: '0.75rem', overflow: 'hidden' }}>
          <BentoCard project={top5[2]} />
        </a>
        {/* Bottom wide left — col 1-4, row 4-5 */}
        <a href={`#${top5[3].id}`} style={{ gridColumn: '1 / 5', gridRow: '4 / 6', display: 'block', textDecoration: 'none', borderRadius: '0.75rem', overflow: 'hidden' }}>
          <BentoCard project={top5[3]} />
        </a>
        {/* Bottom wide right — col 5-8, row 4-5 */}
        <a href={`#${top5[4].id}`} style={{ gridColumn: '5 / 9', gridRow: '4 / 6', display: 'block', textDecoration: 'none', borderRadius: '0.75rem', overflow: 'hidden' }}>
          <BentoCard project={top5[4]} />
        </a>
      </div>
    </div>
  );
}

/* ── RotatingText (même animation que Don) ─────────────────────────────── */
const PROJETS_TEXTS = [
  'Tighremt & la région',
  'la palmeraie',
  'les familles',
  'l\'eau & l\'irrigation',
  'le patrimoine',
  'les enfants',
];

function RotatingText({ texts, interval = 2600 }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIndex(i => (i + 1) % texts.length), interval);
    return () => clearInterval(id);
  }, [texts.length, interval]);
  return (
    <span style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', minWidth: '14ch' }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.em
          key={index}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-110%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          style={{ display: 'block', fontWeight: 400, fontStyle: 'italic', color: 'rgba(255,220,100,1)' }}
        >
          {texts[index]}
        </motion.em>
      </AnimatePresence>
    </span>
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

      <ScrollBentoHero />

      <SectionDivider />

      <ProjectsIndex />

      <SectionDivider />

      {PROJECTS.map((project, i) => (
        <ProjectBlock key={project.id} project={project} index={i} />
      ))}

      <SectionDivider />

      {/* Bottom CTA */}
      <section style={{
        background: C.greenDeep,
        padding: 'clamp(4rem,8vw,6rem) clamp(1.25rem,4vw,2rem)',
        textAlign: 'center',
      }}>
        <div className="reveal" style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{
            fontFamily: FONT.alt,
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
