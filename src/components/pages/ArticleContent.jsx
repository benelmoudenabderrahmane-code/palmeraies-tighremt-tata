'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, ArrowLeft, Share2 } from 'lucide-react';
import actualites from '@/data/actualites.json';
import { C } from '@/lib/tokens';
import { toast } from '@/hooks/useToast';

export default function ArticleContent({ id }) {
  const article = actualites.find(a => a.id === id);
  if (!article) return <div style={{ padding: '8rem 2rem', textAlign: 'center' }}>Article introuvable.</div>;

  const share = () => {
    if (navigator.share) {
      navigator.share({ title: article.titre, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Lien copié dans le presse-papiers !');
    }
  };

  return (
    <div style={{ paddingTop: '6rem', maxWidth: 800, margin: '0 auto', padding: '7rem 1.5rem 4rem' }}>
      <Link href="/actualites" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: C.inkMuted, textDecoration: 'none', fontSize: '0.85rem', marginBottom: '2rem' }}>
        <ArrowLeft size={14} /> Retour aux actualités
      </Link>
      <div style={{ overflow: 'hidden', borderRadius: 16, marginBottom: '2rem' }}>
        <Image src={article.image} alt={article.titre} width={800} height={360} sizes="(max-width: 768px) 100vw, 800px" style={{ objectFit: 'cover', width: '100%', height: '360px', display: 'block' }} priority />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.75rem', color: C.inkLight, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Calendar size={13} />
          {new Date(article.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          {' · '}{article.auteur}
        </span>
        <button onClick={share} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: `1px solid ${C.sandDark}`, borderRadius: 8, padding: '0.4rem 0.9rem', cursor: 'pointer', fontSize: '0.8rem', color: C.inkMuted }}>
          <Share2 size={13} /> Partager
        </button>
      </div>
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 600, lineHeight: 1.2, color: C.ink, marginBottom: '1.5rem' }}>{article.titre}</h1>
      <div style={{ fontSize: '1rem', lineHeight: 1.85, color: C.inkMuted }}>{article.contenu}</div>

      {actualites.filter(a => a.id !== id).length > 0 && (
        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: `1px solid ${C.sandDark}` }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', fontWeight: 600, color: C.ink, marginBottom: '1.25rem' }}>Autres actualités</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {actualites.filter(a => a.id !== id).slice(0, 3).map(a => (
              <Link key={a.id} href={`/actualites/${a.id}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: C.ochre, textDecoration: 'none', fontWeight: 500 }}>
                <ArrowLeft size={12} style={{ transform: 'rotate(180deg)', flexShrink: 0 }} />
                {a.titre}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
