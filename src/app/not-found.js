import Link from 'next/link';
import { C } from '@/lib/tokens';

export const metadata = { title: '404 — Page introuvable | Tighremt' };

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', background: C.sand }}>
      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(5rem,15vw,10rem)', fontWeight: 600, color: C.sandDark, lineHeight: 1 }}>404</p>
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(1.5rem,4vw,2.5rem)', color: C.greenDeep, margin: '0.5rem 0 1rem' }}>Page introuvable</h1>
      <p style={{ color: C.inkMuted, marginBottom: '2rem', maxWidth: 400 }}>La page que vous cherchez n&apos;existe pas ou a été déplacée.</p>
      <Link href="/" style={{ background: C.greenDeep, color: '#fff', padding: '0.8rem 2rem', borderRadius: 999, textDecoration: 'none', fontWeight: 600, fontSize: '0.92rem' }}>
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
