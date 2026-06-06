'use client';
import { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import { C, FONT } from '@/lib/tokens';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import dynamic from 'next/dynamic';
import Turnstile from '@/components/ui/Turnstile';
const MapLeaflet = dynamic(() => import('@/components/ui/MapLeaflet'), { ssr: false });

export default function ContactContent() {
  useScrollReveal();

  const [form, setForm]       = useState({ prenom: '', nom: '', email: '', sujet: '', message: '' });
  const [sent, setSent]       = useState(false);
  const [sending, setSending] = useState(false);
  const [token, setToken]     = useState(null);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.email || !form.message) return;
    if (!token) { return; }
    setSending(true);

    const body = encodeURIComponent(
      `Bonjour,\n\nNom : ${form.prenom} ${form.nom}\nEmail : ${form.email}\n\nMessage :\n${form.message}`
    );
    const subject = encodeURIComponent(form.sujet || 'Message depuis le site Palmeraies Tighremt');
    window.location.href = `mailto:palmeraies.tighremt.tata@gmail.com?subject=${subject}&body=${body}`;

    setTimeout(() => {
      setSending(false);
      setSent(true);
      setForm({ prenom: '', nom: '', email: '', sujet: '', message: '' });
    }, 1200);
  };

  return (
    <section style={{ background: C.sand, padding: 'clamp(7rem,12vw,10rem) 1.5rem clamp(5rem,10vw,8rem)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: 'clamp(3rem,6vw,5rem)' }}>
          <div className="reveal" style={{ fontSize: '0.68rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: C.ochre, fontWeight: 500, marginBottom: '1rem' }}>
            Nous contacter
          </div>
          <h1 className="reveal reveal-delay-1" style={{ fontFamily: FONT.alt, fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', fontWeight: 400, color: C.greenDeep, lineHeight: 1.15 }}>
            Écrivez-nous
          </h1>
          <p className="reveal reveal-delay-2" style={{ color: C.inkMuted, fontSize: '0.95rem', marginTop: '1rem', maxWidth: 520, margin: '1rem auto 0', lineHeight: 1.7, fontWeight: 300 }}>
            Vous souhaitez nous rejoindre, nous soutenir ou simplement en savoir plus ? Nous répondons à tous les messages.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,440px),1fr))', gap: 'clamp(3rem,6vw,5rem)', alignItems: 'start' }}>

          {/* Contact info */}
          <div className="reveal-left">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {[
                { Icon: MapPin, label: 'Adresse',   text: 'rue Nobel\n62410 Hulluch, France' },
                { Icon: Phone,  label: 'Téléphone', text: '06 35 99 63 89\n06 70 06 05 45' },
                { Icon: Mail,   label: 'E-mail',    text: 'palmeraies.tighremt.tata@gmail.com' },
              ].map(({ Icon, label, text }) => (
                <div key={label} style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '0.875rem', background: C.sandMid, border: `1px solid ${C.sandDark}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s, transform 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = C.sandDark; e.currentTarget.style.transform = 'scale(1.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = C.sandMid;  e.currentTarget.style.transform = ''; }}
                  >
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
              <div style={{ fontFamily: FONT.alt, fontSize: '1.1rem', fontStyle: 'italic', color: C.green, lineHeight: 1.6 }}>
                &quot;Chaque compétence compte. Rejoignez notre réseau de bénévoles engagés pour Tighremt.&quot;
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div className="reveal-right reveal-delay-2">
            {sent ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: '1.5rem', padding: '3rem 2rem',
                background: C.sandMid, borderRadius: '1.5rem',
                border: `1px solid ${C.sandDark}`, textAlign: 'center',
                minHeight: 360,
              }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: `${C.green}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle size={32} color={C.green} strokeWidth={1.5} />
                </div>
                <div>
                  <div style={{ fontFamily: FONT.alt, fontSize: '1.5rem', fontWeight: 500, color: C.greenDeep, marginBottom: '0.5rem' }}>
                    Message envoyé !
                  </div>
                  <p style={{ color: C.inkMuted, fontSize: '0.9rem', lineHeight: 1.7, fontWeight: 300 }}>
                    Votre client mail va s&apos;ouvrir. Nous répondons à tous les messages dans les meilleurs délais.
                  </p>
                </div>
                <button
                  onClick={() => setSent(false)}
                  style={{ fontSize: '0.82rem', color: C.ochre, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}
                >
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {[['Prénom', 'prenom', 'text', 'Votre prénom'], ['Nom', 'nom', 'text', 'Votre nom']].map(([label, name, type, placeholder]) => (
                    <div key={name}>
                      <label htmlFor={`contact-${name}`} style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: C.inkMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>{label}</label>
                      <input
                        id={`contact-${name}`}
                        type={type}
                        name={name}
                        value={form[name]}
                        onChange={handleChange}
                        placeholder={placeholder}
                        className="contact-input"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label htmlFor="contact-email" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: C.inkMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>E-mail *</label>
                  <input
                    id="contact-email"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="votre@email.com"
                    required
                    className="contact-input"
                  />
                </div>

                <div>
                  <label htmlFor="contact-sujet" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: C.inkMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Sujet</label>
                  <input
                    id="contact-sujet"
                    type="text"
                    name="sujet"
                    value={form.sujet}
                    onChange={handleChange}
                    placeholder="Comment pouvons-nous vous aider ?"
                    className="contact-input"
                  />
                </div>

                <div>
                  <label htmlFor="contact-message" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: C.inkMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Message *</label>
                  <textarea
                    id="contact-message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Votre message..."
                    rows={5}
                    required
                    className="contact-input"
                  />
                </div>

                <Turnstile onVerify={setToken} onExpire={() => setToken(null)} />
                <button
                  type="submit"
                  disabled={sending || !form.email || !form.message || !token}
                  className="btn-micro"
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                    padding: '1rem 2rem',
                    background: (sending || !form.email || !form.message || !token) ? C.sandDark : C.greenDeep,
                    color: (sending || !form.email || !form.message || !token) ? C.inkMuted : '#fff',
                    border: 'none', borderRadius: 999, fontWeight: 600, fontSize: '0.95rem',
                    cursor: (sending || !form.email || !form.message || !token) ? 'not-allowed' : 'pointer',
                    boxShadow: (sending || !form.email || !form.message || !token) ? 'none' : `0 8px 24px ${C.greenDeep}40`,
                    marginTop: '0.5rem',
                    transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => { if (!sending && form.email && form.message && token) e.currentTarget.style.background = C.green; }}
                  onMouseLeave={e => { if (!sending && form.email && form.message && token) e.currentTarget.style.background = C.greenDeep; }}
                >
                  {sending ? (
                    <>
                      <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Envoyer le message
                    </>
                  )}
                </button>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </form>
            )}
          </div>
        </div>

        {/* ── Pourquoi nous contacter ── */}
        <div className="reveal" style={{ maxWidth: 1000, margin: '3rem auto 0', padding: '0 1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            {[
              { titre: 'Faire un don', desc: 'Contribuer financièrement à nos projets de restauration de la palmeraie, d\'infrastructure et d\'aide humanitaire.' },
              { titre: 'Devenir bénévole', desc: 'Rejoindre notre équipe de bénévoles passionnés, quelle que soit votre spécialité : médecin, enseignant, artisan, ingénieur.' },
              { titre: 'Partenariat', desc: 'Établir un partenariat institutionnel ou associatif pour soutenir le développement durable de la région de Tata.' },
              { titre: 'Renseignements', desc: 'Poser vos questions sur l\'association, nos actions sur le terrain, ou la situation de la commune de Tighremt.' },
            ].map(({ titre, desc }) => (
              <div key={titre} style={{ background: '#fff', borderRadius: '1rem', padding: '1.4rem', border: '1px solid #e0d8c8' }}>
                <h3 style={{ fontFamily: FONT.alt, fontSize: '1.1rem', fontWeight: 600, color: '#133d20', marginBottom: '0.5rem' }}>{titre}</h3>
                <p style={{ fontSize: '0.86rem', color: '#6b6b6b', lineHeight: 1.7, fontWeight: 300 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <section style={{ maxWidth: 1000, margin: '0 auto', padding: '3rem 1.5rem 0' }}>
          <h2 style={{ fontFamily: FONT.alt, fontSize: '1.8rem', fontWeight: 600, color: '#133d20', marginBottom: '1.5rem' }}>
            Tighremt sur la carte
          </h2>
          <MapLeaflet />
        </section>
      </div>
    </section>
  );
}
