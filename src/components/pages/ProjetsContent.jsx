'use client';
import { TreePine, Shield, Heart, BookOpen } from 'lucide-react';
import AnimatedButton from '@/components/ui/animated-button';
import { C } from '@/lib/tokens';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const ACTIONS = [
  { icon: TreePine, title: 'Sauvegarde de la Palmeraie',        desc: "Protection et restauration du patrimoine végétal ancestral de la région de Tata, symbole vivant d'identité et d'espoir pour les générations futures.", color: C.green,    bgImage: 'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?w=600&q=70' },
  { icon: Shield,   title: 'Lutte contre la désertification',    desc: "Actions concrètes pour préserver les terres agricoles, contenir l'avancée du désert et maintenir la biodiversité des oasis.",                            color: C.ochre,    bgImage: 'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=600&q=70' },
  { icon: Heart,    title: 'Missions Humanitaires',              desc: "Aide directe aux populations vulnérables, distribution de produits essentiels et accompagnement solidaire au cœur de la communauté.",                    color: C.accent,   bgImage: 'https://images.unsplash.com/photo-1526976668912-1a811878dd37?w=600&q=70' },
  { icon: BookOpen, title: 'Formation & Information locale',     desc: "Sensibilisation, éducation et transfert de savoir-faire pour permettre à chacun de construire son avenir avec dignité.",                                color: C.greenMid, bgImage: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=70' },
];

export default function ProjetsContent() {
  useScrollReveal();
  return (
    <section id="actions" style={{ background: C.sand, padding: 'clamp(7rem,12vw,10rem) 1.5rem clamp(5rem,10vw,8rem)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: 'clamp(3rem,6vw,5rem)', maxWidth: 560 }}>
          <div className="reveal" style={{ fontSize: '0.68rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: C.ochre, fontWeight: 500, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ width: 28, height: 1, background: C.ochre, display: 'block' }} />
            Nos projets
          </div>
          <h1 className="reveal reveal-delay-1" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', fontWeight: 400, lineHeight: 1.15, color: C.greenDeep }}>
            Nos projets pour<br /><em>Tighremt &amp; la région</em>
          </h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {ACTIONS.map(({ icon: Icon, title, desc, color, bgImage }, i) => (
            <div key={title} className={`action-card reveal reveal-delay-${i + 1}`} style={{ background: C.sandMid, borderRadius: '1.75rem', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: 140, overflow: 'hidden', position: 'relative' }}>
                <img src={bgImage} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, transparent 40%, ${C.sandMid}cc)` }} />
                <div style={{ position: 'absolute', bottom: '-20px', left: '1.5rem', width: 48, height: 48, borderRadius: '0.875rem', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px ${color}50` }}>
                  <Icon size={20} color="#fff" />
                </div>
              </div>
              <div style={{ padding: '2.5rem 1.5rem 1.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: C.greenDeep, lineHeight: 1.3 }}>{title}</h3>
                <p style={{ fontSize: '0.88rem', color: C.inkMuted, lineHeight: 1.75, fontWeight: 300, flex: 1 }}>{desc}</p>
                <div style={{ marginTop: '0.75rem' }}>
                  <AnimatedButton
                    as="a"
                    href="/contact"
                    className="!text-sm !px-4 !py-3 !rounded-lg !border-neutral-200 !bg-white/80 !text-neutral-700 w-full justify-center"
                  >
                    En savoir plus →
                  </AnimatedButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
