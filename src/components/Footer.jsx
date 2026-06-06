'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Share2, Globe, Send, Mail, Phone, MapPin, ArrowRight, Heart } from 'lucide-react';
import Logo from './ui/Logo';
import Turnstile from './ui/Turnstile';
import { C, FONT } from '@/lib/tokens';
import { toast } from '@/hooks/useToast';

function NewsletterForm() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken]     = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!email.includes('@')) { toast.error('Email invalide'); return; }
    if (!token) { toast.error('Veuillez compléter la vérification'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, turnstileToken: token }),
      });
      const data = await res.json();
      if (res.ok) { toast.success('Inscription confirmée ! Merci.'); setEmail(''); setToken(null); }
      else toast.error(data.error || 'Erreur');
    } catch { toast.error('Erreur réseau'); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit}>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <label htmlFor="newsletter-email" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>
          Adresse e-mail pour la newsletter
        </label>
        <input
          id="newsletter-email"
          type="email" placeholder="Votre e-mail" value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email" inputMode="email" required
          style={{ flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '0.65rem 0.9rem', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
        />
        <button type="submit" className="btn-accent" aria-label="S'abonner à la newsletter"
          disabled={loading || !token} style={{ padding: '0.65rem 1rem', borderRadius: 8, flexShrink: 0, opacity: (!token || loading) ? 0.6 : 1 }}>
          <ArrowRight size={16} />
        </button>
      </div>
      <Turnstile theme="dark" onVerify={setToken} onExpire={() => setToken(null)} />
    </form>
  );
}

const quickLinks = [
  { label: 'Accueil',      href: '/' },
  { label: 'Mission',      href: '/mission' },
  { label: 'Notre histoire',    href: '/histoire' },
  { label: 'À propos',          href: '/about' },
  { label: 'Nos projets',  href: '/projets' },
  { label: 'Actualités',   href: '/actualites' },
  { label: 'Galerie',      href: '/galerie' },
  { label: 'Événements',   href: '/evenements' },
  { label: 'Bénévoles',    href: '/benevoles' },
  { label: 'Nos partenaires',   href: '/partenaires' },
  { label: 'FAQ',          href: '/faq' },
  { label: 'Faire un don',     href: '/don' },
  { label: 'Contact',          href: '/contact' },
  { label: 'Mentions légales', href: '/mentions-legales' },
  { label: 'Privacy Policy',    href: '/privacy-policy' },
];

export default function Footer() {
  return (
    <footer id="contact" style={{ background: C.greenDeep, color: 'rgba(255,255,255,0.65)', padding: '5rem 1.5rem 2rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', paddingBottom: '3rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <Logo size={100} lazy={true} />
              <div>
                <div style={{ fontFamily: FONT.alt, fontWeight: 600, fontSize: '1rem', color: '#fff', lineHeight: 1.1 }}>Association Palmeraies Tighremt</div>
                <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: C.accent }}>TATA · Maroc</div>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.85, fontWeight: 300, marginBottom: '1.5rem' }}>
              Association à but non lucratif<br />Loi 1901 · Fondée en mars 2010<br />Humanitaire & Échanges culturels
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {[{ Icon: Share2, label: 'Facebook' }, { Icon: Globe, label: 'Instagram' }, { Icon: Send, label: 'Twitter/X' }].map(({ Icon, label }) => (
                <button key={label} aria-label={label}
                  style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                  onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.16)')}
                  onMouseOut={e  => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}>
                  <Icon size={15} color="rgba(255,255,255,0.7)" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.65rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: C.accent, fontWeight: 600, marginBottom: '1.25rem' }}>Liens rapides</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {quickLinks.map(({ label, href }) => (
                <Link key={label} href={href}
                  rel={href === '/mentions-legales' || href === '/privacy-policy' ? 'privacy-policy' : undefined}
                  style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.55)', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseOver={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
                  onMouseOut={e  => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}>
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.65rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: C.accent, fontWeight: 600, marginBottom: '1.25rem' }}>NOUS CONTACTER</div>
            {[
              { Icon: MapPin, text: 'rue Nobel\n62410 Hulluch, France' },
              { Icon: Phone,  text: '06 35 99 63 89\n06 70 06 05 45' },
              { Icon: Mail,   text: 'palmeraies.tighremt.tata@gmail.com' },
            ].map(({ Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
                <Icon size={15} color={C.accent} style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: '0.87rem', lineHeight: 1.65, whiteSpace: 'pre-line', fontWeight: 300 }}>{text}</span>
              </div>
            ))}
          </div>

          <div>
            <div style={{ fontSize: '0.65rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: C.accent, fontWeight: 600, marginBottom: '1.25rem' }}>Restez informé</div>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.7, fontWeight: 300, marginBottom: '1rem' }}>
              Recevez nos actualités et suivez l&apos;avancement de nos projets.
            </p>
            <NewsletterForm />
          </div>
        </div>

        <div style={{ paddingTop: '2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>
          <span>© 2025 Association Palmeraies Tighremt TATA · Tous droits réservés</span>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span>Association loi 1901 à but non lucratif</span>
            <Link href="/mentions-legales" rel="privacy-policy" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}
              onMouseOver={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
              onMouseOut={e  => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}>
              Mentions légales &amp; Confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
