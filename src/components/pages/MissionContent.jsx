'use client';
import { Leaf } from 'lucide-react';
import { MaskedAvatars } from '@/components/ui/masked-avatars';
import { C } from '@/lib/tokens';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const TEAM_AVATARS = [
  { avatar: 'https://i.pravatar.cc/150?u=palmeraies1', name: 'Bénévole' },
  { avatar: 'https://i.pravatar.cc/150?u=palmeraies2', name: 'Membre' },
  { avatar: 'https://i.pravatar.cc/150?u=palmeraies3', name: 'Fondateur' },
  { avatar: 'https://i.pravatar.cc/150?u=palmeraies4', name: 'Volontaire' },
  { avatar: 'https://i.pravatar.cc/150?u=palmeraies5', name: 'Partenaire' },
];

export default function MissionContent() {
  useScrollReveal();
  return (
    <section id="mission" style={{ background: C.sand, padding: 'clamp(7rem,12vw,10rem) 1.5rem clamp(5rem,10vw,8rem)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,480px),1fr))', gap: 'clamp(3rem,6vw,6rem)', alignItems: 'center' }}>

        <div>
          <div className="reveal" style={{ fontSize: '0.68rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: C.ochre, fontWeight: 500, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ width: 28, height: 1, background: C.ochre, display: 'block' }} />
            Notre Histoire
          </div>

          <h2 className="reveal reveal-delay-1" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem, 4.5vw, 3.4rem)', fontWeight: 400, lineHeight: 1.12, color: C.greenDeep, marginBottom: '1.5rem' }}>
            Une mission née<br />de <em>l&apos;amour de la terre</em>
          </h2>

          <div className="reveal reveal-delay-1" style={{ width: 56, height: 2, background: `linear-gradient(to right, ${C.ochre}, transparent)`, marginBottom: '2rem' }} />

          <p className="reveal reveal-delay-2" style={{ color: C.inkMuted, lineHeight: 1.9, fontSize: '1.02rem', fontWeight: 300, marginBottom: '1.25rem' }}>
            Notre association a été créée pour aider par différentes actions, le village de Tighremt dans la province de Tata au Maroc. C&apos;est une association à but non lucratif créée selon la loi 1901 en mars 2010.
          </p>
          <p className="reveal reveal-delay-3" style={{ color: C.inkMuted, lineHeight: 1.9, fontSize: '1.02rem', fontWeight: 300 }}>
            La ville de Tata reste majestueuse et accueillante — ses habitants se contentent du peu que leur procure la nature, sachant que tout reste à faire pour s&apos;atteler au train du développement.
          </p>

          <div className="reveal reveal-delay-4" style={{ marginTop: '2.5rem', padding: '1.5rem 1.75rem', background: C.sandMid, borderLeft: `4px solid ${C.ochre}`, borderRadius: '0 1rem 1rem 0' }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.15rem', fontStyle: 'italic', color: C.green, lineHeight: 1.5 }}>
              &quot;Association loi 1901 à but non lucratif<br />fondée en mars 2010&quot;
            </div>
            <div style={{ fontSize: '0.78rem', color: C.ochre, fontWeight: 600, letterSpacing: '0.08em', marginTop: '0.75rem', textTransform: 'uppercase' }}>
              Humanitaire · Échanges culturels · Maroc
            </div>
          </div>

          <div className="reveal reveal-delay-4" style={{ marginTop: '2.5rem' }}>
            <div style={{ fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: C.inkLight, fontWeight: 500, marginBottom: '1rem' }}>
              Notre équipe de bénévoles
            </div>
            <MaskedAvatars avatars={TEAM_AVATARS} size={56} border={6} column={32} />
          </div>
        </div>

        <div className="reveal reveal-delay-2" style={{ position: 'relative' }}>
          <div style={{ position: 'relative', borderRadius: '2rem', overflow: 'hidden', aspectRatio: '4/5' }}>
            <img src="https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=800&q=80" alt="Palmeraie de Tata, Maroc" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${C.greenDeep}60 0%, transparent 55%)` }} />
          </div>
          <div style={{ position: 'absolute', bottom: '-1.5rem', left: '-1.5rem', background: C.ochre, color: '#fff', borderRadius: '1.25rem', padding: '1.25rem 1.5rem', boxShadow: '0 12px 32px rgba(164,84,40,0.35)' }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.25rem', fontWeight: 600, lineHeight: 1 }}>2010</div>
            <div style={{ fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.8, marginTop: '0.3rem' }}>Fondée en</div>
          </div>
          <div style={{ position: 'absolute', top: '-1.25rem', right: '-1.25rem', width: 64, height: 64, borderRadius: '50%', background: C.sandDark, border: `4px solid ${C.sand}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Leaf size={22} color={C.green} />
          </div>
        </div>
      </div>
    </section>
  );
}
