'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import faqData from '@/data/faq.json';
import { C } from '@/lib/tokens';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const LABELS = { association: "L'Association", dons: 'Les Dons', benevoles: 'Bénévolat', projets: 'Nos Projets' };

function AccordionItem({ q, r }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${C.sandDark}` }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '1.25rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '1rem', fontWeight: 500, color: C.ink, lineHeight: 1.4 }}>{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }} style={{ flexShrink: 0 }}>
          <ChevronDown size={18} color={C.ochre} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} style={{ overflow: 'hidden' }}>
            <p style={{ paddingBottom: '1.25rem', fontSize: '0.93rem', color: C.inkMuted, lineHeight: 1.75 }}>{r}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FaqContent() {
  useScrollReveal();
  return (
    <div style={{ paddingTop: '6rem', minHeight: '100vh' }}>
      <section style={{ background: C.greenDeep, color: '#fff', padding: '4rem 1.5rem 3rem', textAlign: 'center' }}>
        <div className="reveal" style={{ maxWidth: 700, margin: '0 auto' }}>
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: C.accent, marginBottom: '0.75rem' }}>FAQ</p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 600 }}>Questions fréquentes</h1>
          <p style={{ marginTop: '1rem', opacity: 0.75 }}>Tout ce que vous souhaitez savoir sur l&apos;association.</p>
        </div>
      </section>
      <section style={{ maxWidth: 780, margin: '0 auto', padding: '4rem 1.5rem' }}>
        {faqData.map((section, i) => (
          <div key={section.categorie} className={`reveal reveal-delay-${i + 1}`} style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem', fontWeight: 600, color: C.greenDeep, marginBottom: '1.25rem', paddingBottom: '0.5rem', borderBottom: `2px solid ${C.accent}`, display: 'inline-block' }}>
              {LABELS[section.categorie] || section.categorie}
            </h2>
            {section.questions.map(({ q, r }) => <AccordionItem key={q} q={q} r={r} />)}
          </div>
        ))}
      </section>
    </div>
  );
}
