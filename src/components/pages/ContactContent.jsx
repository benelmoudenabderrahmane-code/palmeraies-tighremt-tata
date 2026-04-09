'use client';
import { Mail, Phone, MapPin, Send, ArrowRight } from 'lucide-react';
import { C } from '@/lib/tokens';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export default function ContactContent() {
  useScrollReveal();
  return (
    <section style={{ background: C.sand, padding: 'clamp(7rem,12vw,10rem) 1.5rem clamp(5rem,10vw,8rem)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: 'clamp(3rem,6vw,5rem)' }}>
          <div className="reveal" style={{ fontSize: '0.68rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: C.ochre, fontWeight: 500, marginBottom: '1rem' }}>
            Nous contacter
          </div>
          <h1 className="reveal reveal-delay-1" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', fontWeight: 400, color: C.greenDeep, lineHeight: 1.15 }}>
            Écrivez-nous
          </h1>
          <p className="reveal reveal-delay-2" style={{ color: C.inkMuted, fontSize: '0.95rem', marginTop: '1rem', maxWidth: 520, margin: '1rem auto 0', lineHeight: 1.7, fontWeight: 300 }}>
            Vous souhaitez nous rejoindre, nous soutenir ou simplement en savoir plus ? Nous répondons à tous les messages.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,440px),1fr))', gap: 'clamp(3rem,6vw,5rem)', alignItems: 'start' }}>

          {/* Contact info */}
          <div className="reveal">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {[
                { Icon: MapPin, label: 'Adresse',   text: 'rue Nobel\n62410 Hulluch, France' },
                { Icon: Phone,  label: 'Téléphone', text: '06 35 99 63 89\n06 70 06 05 45' },
                { Icon: Mail,   label: 'E-mail',    text: 'palmeraies.tighremt.tata@gmail.com' },
              ].map(({ Icon, label, text }) => (
                <div key={label} style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '0.875rem', background: C.sandMid, border: `1px solid ${C.sandDark}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} color={C.ochre} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: C.ochre, fontWeight: 600, marginBottom: '0.3rem' }}>{label}</div>
                    <div style={{ fontSize: '0.92rem', color: C.inkMuted, lineHeight: 1.7, whiteSpace: 'pre-line', fontWeight: 300 }}>{text}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '2.5rem', padding: '1.5rem', background: C.sandMid, borderRadius: '1.25rem', border: `1px solid ${C.sandDark}` }}>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontStyle: 'italic', color: C.green, lineHeight: 1.6 }}>
                &quot;Chaque compétence compte. Rejoignez notre réseau de bénévoles engagés pour Tighremt.&quot;
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div className="reveal reveal-delay-2">
            <form
              onSubmit={e => { e.preventDefault(); }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {[['Prénom', 'text', 'Votre prénom'], ['Nom', 'text', 'Votre nom']].map(([label, type, placeholder]) => (
                  <div key={label}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: C.inkMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>{label}</label>
                    <input type={type} placeholder={placeholder}
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: `1px solid ${C.sandDark}`, background: '#fff', fontSize: '0.9rem', color: C.ink, outline: 'none', transition: 'border-color 0.2s' }}
                      onFocus={e => (e.target.style.borderColor = C.ochre)}
                      onBlur={e  => (e.target.style.borderColor = C.sandDark)}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: C.inkMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>E-mail</label>
                <input type="email" placeholder="votre@email.com"
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: `1px solid ${C.sandDark}`, background: '#fff', fontSize: '0.9rem', color: C.ink, outline: 'none', transition: 'border-color 0.2s' }}
                  onFocus={e => (e.target.style.borderColor = C.ochre)}
                  onBlur={e  => (e.target.style.borderColor = C.sandDark)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: C.inkMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Sujet</label>
                <input type="text" placeholder="Comment pouvons-nous vous aider ?"
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: `1px solid ${C.sandDark}`, background: '#fff', fontSize: '0.9rem', color: C.ink, outline: 'none', transition: 'border-color 0.2s' }}
                  onFocus={e => (e.target.style.borderColor = C.ochre)}
                  onBlur={e  => (e.target.style.borderColor = C.sandDark)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: C.inkMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Message</label>
                <textarea placeholder="Votre message..." rows={5}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: `1px solid ${C.sandDark}`, background: '#fff', fontSize: '0.9rem', color: C.ink, outline: 'none', transition: 'border-color 0.2s', resize: 'vertical', fontFamily: 'inherit' }}
                  onFocus={e => (e.target.style.borderColor = C.ochre)}
                  onBlur={e  => (e.target.style.borderColor = C.sandDark)}
                />
              </div>

              <button type="submit"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '1rem 2rem', background: C.greenDeep, color: '#fff', border: 'none', borderRadius: 999, fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', transition: 'background 0.2s, transform 0.2s', boxShadow: `0 8px 24px ${C.greenDeep}40` }}
                onMouseOver={e => (e.currentTarget.style.background = C.green)}
                onMouseOut={e  => (e.currentTarget.style.background = C.greenDeep)}
              >
                <Send size={16} />
                Envoyer le message
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
