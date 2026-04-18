import ArticleContent from '@/components/pages/ArticleContent';
import actualites from '@/data/actualites.json';
export function generateStaticParams() {
  return actualites.map(a => ({ id: a.id }));
}
export function generateMetadata({ params }) {
  const article = actualites.find(a => a.id === params.id);
  return { title: `${article?.titre} | Tighremt`, description: article?.extrait };
}
export default function ArticlePage({ params }) { return <ArticleContent id={params.id} />; }
