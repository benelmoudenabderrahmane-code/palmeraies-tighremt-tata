'use client';
import { useState } from 'react';
import { MapPin, Send } from 'lucide-react';
import missions from '@/data/missions-benevoles.json';
import { C } from '@/lib/tokens';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { toast } from '@/hooks/useToast';

const TYPE_LABELS = { permanent: 'Permanent', mission: 'Mission', ponctuel: 'Ponctuel' };
const TYPE_COLORS = { permanent: C.greenDeep, mission: C.ochre, ponctuel: C.accent };

export default function BenevolesContent() {
  useScrollReveal();
  const [form, setForm] = useState({ nom: '', email: '', mission: '', message: '' });
  const [sending, setSending] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!EMAIL_RE.test(form.email)) { toast.error('Email invalide'); return; }
    setSending(true);

    const missionLabel = missions.find(m => m.id === form.mission)?.titre || form.mission || 'Non précisée';
    const subject = encodeURIComponent(`Candidature bénévole — ${form.nom} — ${missionLabel}`);
    const body = encodeURIComponent(
      `Nom complet : ${form.nom}\nEmail : ${form.email}\nMission souhaitée : ${missionLabel}\n\nMessage :\n${form.message || '(Aucun message)'}`
    );
    window.open(`mailto:palmeraies.tighremt.tata@gmail.com?subject=${subject}&body=${body}`);

    setSending(false);
    toast.success('Votre candidature a été préparée — envoyez l\'email qui vient de s\'ouvrir.');
    setForm({ nom: '', email: '', mission: '', message: '' });
  };

  return (
    <div style={{ paddingTop: '6rem', minHeight: '100vh' }}>
      <section style={{ background: C.greenDeep, color: '#fff', padding: '4rem 1.5rem 3rem', textAlign: 'center' }}>
        <div className="reveal" style={{ maxWidth: 700, margin: '0 auto' }}>
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: C.accent, marginBottom: '0.75rem' }}>Rejoignez-nous</p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 600 }}>Devenir bénévole</h1>
          <p style={{ marginTop: '1rem', opacity: 0.75 }}>Vos compétences peuvent changer des vies à Tighremt.</p>
        </div>
      </section>
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', color: C.greenDeep, marginBottom: '1.5rem' }}>Missions disponibles</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
          {missions.map((m, i) => (
            <div key={m.id} className={`reveal reveal-delay-${(i % 3) + 1}`}
              style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 20px rgba(0,0,0,0.07)', borderTop: `3px solid ${TYPE_COLORS[m.type]}` }}>
              <span style={{ fontSize: '0.7rem', background: C.sandMid, color: TYPE_COLORS[m.type], padding: '0.15rem 0.6rem', borderRadius: 999, fontWeight: 700, textTransform: 'uppercase', display: 'inline-block', marginBottom: '0.75rem' }}>
                {TYPE_LABELS[m.type]}
              </span>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', fontWeight: 600, color: C.ink, marginBottom: '0.5rem' }}>{m.titre}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: C.inkMuted, marginBottom: '0.4rem' }}>
                <MapPin size={12} color={C.ochre} />{m.lieu}
              </div>
              <p style={{ fontSize: '0.86rem', color: C.inkMuted, lineHeight: 1.65, marginBottom: '0.75rem' }}>{m.description}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                {m.competences.map(c => (
                  <span key={c} style={{ fontSize: '0.72rem', background: C.sandMid, color: C.inkMuted, padding: '0.15rem 0.5rem', borderRadius: 4 }}>{c}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', color: C.greenDeep, marginBottom: '1.5rem', textAlign: 'center' }}>Postuler</h2>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { name: 'nom', label: 'Nom complet', type: 'text', placeholder: 'Votre nom' },
              { name: 'email', label: 'Email', type: 'email', placeholder: 'votre@email.com' },
            ].map(({ name, label, type, placeholder }) => (
              <div key={name}>
                <label htmlFor={`benevole-${name}`} style={{ fontSize: '0.82rem', fontWeight: 600, color: C.ink, display: 'block', marginBottom: '0.4rem' }}>{label}</label>
                <input id={`benevole-${name}`} type={type} placeholder={placeholder} value={form[name]}
                  onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 10, border: `1px solid ${C.sandDark}`, fontSize: '0.93rem', outline: 'none', background: '#fff' }} />
              </div>
            ))}
            <div>
              <label htmlFor="benevole-mission" style={{ fontSize: '0.82rem', fontWeight: 600, color: C.ink, display: 'block', marginBottom: '0.4rem' }}>Mission souhaitée</label>
              <select id="benevole-mission" value={form.mission} onChange={e => setForm(p => ({ ...p, mission: e.target.value }))} required
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 10, border: `1px solid ${C.sandDark}`, fontSize: '0.93rem', background: '#fff', outline: 'none' }}>
                <option value="">Choisir une mission...</option>
                {missions.map(m => <option key={m.id} value={m.id}>{m.titre}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="benevole-message" style={{ fontSize: '0.82rem', fontWeight: 600, color: C.ink, display: 'block', marginBottom: '0.4rem' }}>Message (optionnel)</label>
              <textarea id="benevole-message" value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                placeholder="Présentez-vous et expliquez votre motivation..."
                rows={4} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 10, border: `1px solid ${C.sandDark}`, fontSize: '0.93rem', resize: 'vertical', outline: 'none', background: '#fff' }} />
            </div>
            <button type="submit" disabled={sending} className="btn-accent"
              style={{ padding: '0.85rem', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 600, opacity: sending ? 0.7 : 1 }}>
              <Send size={16} />{sending ? 'Envoi...' : 'Envoyer ma candidature'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
