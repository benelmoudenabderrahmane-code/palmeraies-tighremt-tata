import actualites from '@/data/actualites.json';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default function sitemap() {
  const now = new Date().toISOString();

  const pages = [
    { url: '/',               priority: 1.0, changeFrequency: 'weekly' },
    { url: '/mission',        priority: 0.9, changeFrequency: 'monthly' },
    { url: '/projets',        priority: 0.9, changeFrequency: 'monthly' },
    { url: '/don',            priority: 0.9, changeFrequency: 'monthly' },
    { url: '/actualites',     priority: 0.8, changeFrequency: 'weekly' },
    { url: '/galerie',        priority: 0.7, changeFrequency: 'monthly' },
    { url: '/evenements',     priority: 0.8, changeFrequency: 'weekly' },
    { url: '/faq',            priority: 0.7, changeFrequency: 'monthly' },
    { url: '/benevoles',      priority: 0.8, changeFrequency: 'monthly' },
    { url: '/equipe',         priority: 0.7, changeFrequency: 'monthly' },
    { url: '/histoire',       priority: 0.7, changeFrequency: 'monthly' },
    { url: '/partenaires',    priority: 0.6, changeFrequency: 'monthly' },
    { url: '/contact',        priority: 0.8, changeFrequency: 'monthly' },
    { url: '/mentions-legales', priority: 0.3, changeFrequency: 'yearly' },
  ];

  const articlePages = actualites.map(article => ({
    url: `/actualites/${article.id}`,
    priority: 0.6,
    changeFrequency: 'monthly',
    lastModified: article.date ? new Date(article.date).toISOString() : now,
  }));

  const allPages = [...pages.map(p => ({ ...p, lastModified: now })), ...articlePages];

  return allPages.map(({ url, priority, changeFrequency, lastModified }) => ({
    url: `${BASE_URL}${url}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
