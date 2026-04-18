import actualites from '@/data/actualites.json';
import faqData from '@/data/faq.json';

const INDEX = [
  { label: 'Accueil',     href: '/',           text: 'accueil association palmeraies tighremt' },
  { label: 'Mission',     href: '/mission',    text: 'mission objectifs environnement education' },
  { label: 'Projets',     href: '/projets',    text: 'projets irrigation plantation eau' },
  { label: 'Don',         href: '/don',        text: 'don faire un don soutenir financer' },
  { label: 'Actualités',  href: '/actualites', text: 'actualites news nouvelles' },
  { label: 'Galerie',     href: '/galerie',    text: 'galerie photos images' },
  { label: 'Événements',  href: '/evenements', text: 'evenements agenda calendrier' },
  { label: 'FAQ',         href: '/faq',        text: 'faq questions reponses' },
  { label: 'Bénévoles',   href: '/benevoles',  text: 'benevoles missions rejoindre' },
  { label: 'Contact',     href: '/contact',    text: 'contact adresse telephone email' },
  ...actualites.map(a => ({ label: a.titre, href: `/actualites/${a.id}`, text: a.titre + ' ' + a.extrait })),
  ...faqData.flatMap(s => s.questions.map(q => ({ label: q.q, href: '/faq', text: q.q + ' ' + q.r }))),
];

export function search(query) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return INDEX.filter(item =>
    item.text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q)
  ).slice(0, 8);
}
