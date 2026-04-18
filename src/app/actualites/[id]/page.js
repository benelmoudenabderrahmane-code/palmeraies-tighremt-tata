import ArticleContent from '@/components/pages/ArticleContent';
import actualites from '@/data/actualites.json';
export function generateStaticParams() {
  return actualites.map(a => ({ id: a.id }));
}
export function generateMetadata({ params }) {
  const article = actualites.find(a => a.id === params.id);
  const shortTitle = article?.titre?.length > 45 ? article.titre.slice(0, 42) + '…' : article?.titre;
  return {
    title: `${shortTitle} | Tighremt`,
    description: article?.extrait?.slice(0, 155),
    alternates: { canonical: `https://palmeries-tighremt.org/actualites/${article?.id}` },
  };
}
export default function ArticlePage({ params }) { return <ArticleContent id={params.id} />; }
