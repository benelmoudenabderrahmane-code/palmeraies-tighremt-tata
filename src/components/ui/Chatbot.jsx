'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Leaf, ChevronDown } from 'lucide-react';

/* ─── Brand tokens ─────────────────────────────────────── */
const GD = '#133d20';
const G  = '#1e5c30';
const O  = '#c4703f';
const S  = '#faf7f0';
const SM = '#f0ead8';
const SD = '#e6ddc8';
const IM = '#5c5848';

/* ─── Knowledge base ───────────────────────────────────── */
const KB = {
  /* Quick-reply suggestions shown on open */
  suggestions: [
    { label: '🌴 Notre mission',      key: 'mission' },
    { label: '💚 Faire un don',       key: 'don' },
    { label: '👥 L\'équipe',          key: 'equipe' },
    { label: '📞 Contact',            key: 'contact' },
  ],

  /* Responses keyed by topic */
  responses: {
    bonjour: {
      text: `Salam ! Bienvenue sur le site de l'**Association Palmeraies Tighremt** 🌴\n\nJe suis là pour répondre à toutes vos questions sur notre association, nos projets et comment nous soutenir.\n\nComment puis-je vous aider ?`,
      suggestions: ['mission', 'don', 'projets', 'contact'],
    },
    mission: {
      text: `Notre **mission** est de sauvegarder et développer la palmeraie ancestrale de **Tighremt**, village de la province de Tata au Maroc 🌿\n\nNous sommes une **association loi 1901** à but non lucratif, fondée en **mars 2010** par des bénévoles originaires de la région.\n\n**Nos axes d'action :**\n• Préservation de la palmeraie et des foggaras\n• Missions humanitaires annuelles\n• Soutien scolaire aux enfants\n• Aide aux familles vulnérables`,
      suggestions: ['projets', 'histoire', 'don', 'equipe'],
    },
    projets: {
      text: `**Nos projets réalisés ✅**\n\n🌴 **1 200+ palmiers** préservés à ce jour\n👨‍👩‍👧 **18 familles** directement soutenues\n💧 **Réhabilitation des foggaras** — canaux d'irrigation ancestraux\n📚 **Soutien scolaire** pour les enfants du village\n🏥 **Aide médicale** lors de nos missions annuelles\n🛖 **6 projets** de terrain complétés en 14 ans d'action\n\nChaque euro donné va directement au terrain !`,
      suggestions: ['don', 'mission', 'contact'],
    },
    histoire: {
      text: `**Notre histoire 📖**\n\nL'association a été fondée en **mars 2010** par des bénévoles de la diaspora marocaine, tous originaires de la province de Tata.\n\nFace à la désertification qui menace la palmeraie ancestrale de Tighremt, ils ont décidé d'agir. En 14 ans d'existence, l'association a mené des dizaines de missions humanitaires et de terrain.\n\n*"La palmeraie est notre héritage, notre identité, notre futur."*`,
      suggestions: ['mission', 'equipe', 'projets'],
    },
    equipe: {
      text: `**Notre équipe de bénévoles 👥**\n\n🟢 **Mohamed TAHAR** — Président\n🟢 **Lahoucine AÏT EL JAMAR** — Vice-Président\n🟢 **Abderrahmane BEN MANSOUR** — Trésorier\n🟢 **Lahoucine BEN MANSOUR** — Vice-Trésorier\n🟢 **Omar BOUBKER** — Secrétaire\n🟢 **Lahoucine BEN LMOUDEN** — Vice-secrétaire\n\nTous sont bénévoles, engagés pour Tighremt et sa palmeraie 💚`,
      suggestions: ['contact', 'benevole', 'mission'],
    },
    don: {
      text: `**Faire un don 💚**\n\nVotre contribution, quelle que soit sa taille, fait une vraie différence !\n\n🌐 **En ligne (recommandé)**\nVia HelloAsso — 100% sécurisé, **0% de commission**\n→ [helloasso.com/associations/palmeraies-tighremt-tata](https://www.helloasso.com/associations/palmeraies-tighremt-tata)\n\n💳 **Par virement ou chèque**\nContactez-nous pour les coordonnées bancaires\n\n📊 **Transparence :** 75% projets terrain · 15% fonctionnement · 10% communication`,
      suggestions: ['contact', 'projets', 'benevole'],
    },
    benevole: {
      text: `**Devenir bénévole 🙌**\n\nNous accueillons toutes les compétences !\n\n👨‍⚕️ Médecins et soignants\n👨‍🏫 Enseignants\n👷 Ingénieurs et techniciens\n🎨 Artistes et communicants\n💼 Gestionnaires et juristes\n\n*Chaque compétence compte pour Tighremt.*\n\nContactez-nous à **palmeraies.tighremt.tata@gmail.com** pour rejoindre l'équipe !`,
      suggestions: ['contact', 'equipe', 'mission'],
    },
    contact: {
      text: `**Nous contacter 📞**\n\n📍 **Adresse**\nrue Nobel, 62410 Hulluch, France\n\n📱 **Téléphone**\n06 35 99 63 89 · 06 70 06 05 45\n\n✉️ **Email**\npalmeraies.tighremt.tata@gmail.com\n\nNous répondons à tous les messages dans les plus brefs délais 🌿`,
      suggestions: ['don', 'benevole', 'mission'],
    },
    foggara: {
      text: `**Les foggaras 💧**\n\nLes foggaras sont des **canaux d'irrigation souterrains** ancestraux, typiques de l'agriculture saharienne. Véritables trésors hydrauliques, elles permettent d'irriguer les palmeraies sans pompe ni électricité.\n\nL'une de nos missions prioritaires est la **réhabilitation de ces foggaras** à Tighremt, pour garantir l'irrigation durable de la palmeraie.`,
      suggestions: ['projets', 'mission', 'don'],
    },
    tata: {
      text: `**Province de Tata, Maroc 🗺️**\n\nTata est une ville du sud du Maroc, aux portes du Sahara. La province est connue pour ses **ksours** (villages fortifiés), ses **oasis** et ses **palmeraies**.\n\nTighremt est un village de cette province dont la palmeraie ancestrale est au cœur de notre mission de préservation.`,
      suggestions: ['mission', 'projets', 'histoire'],
    },
    // Arabic responses
    arabic_bonjour: {
      text: `السلام عليكم! مرحباً بكم في موقع **جمعية واحة تيغرمت** 🌴\n\nأنا هنا للإجابة على جميع أسئلتكم حول جمعيتنا ومشاريعنا.\n\nكيف يمكنني مساعدتكم؟`,
      suggestions: ['mission', 'don', 'contact'],
    },
    arabic_mission: {
      text: `**مهمتنا** هي الحفاظ على واحة النخيل الأثرية في **تيغرمت**، قرية في إقليم طاطا بالمغرب 🌿\n\nجمعيتنا تأسست عام **2010** وتعمل على:\n• الحفاظ على النخيل والفقارات\n• البعثات الإنسانية السنوية\n• دعم الأطفال في تعليمهم\n• مساعدة الأسر الضعيفة`,
      suggestions: ['projets', 'don', 'contact'],
    },
    arabic_don: {
      text: `**التبرع 💚**\n\nمساهمتكم، مهما كان حجمها، تحدث فرقاً حقيقياً!\n\n🌐 **عبر الإنترنت**\nعبر HelloAsso — آمن 100%، بدون عمولة\n\n📧 **للاستفسار**\npalmeraies.tighremt.tata@gmail.com`,
      suggestions: ['contact', 'projets'],
    },
    fallback: {
      text: `Je ne suis pas sûr de bien comprendre votre question 🤔\n\nVoici ce sur quoi je peux vous renseigner :`,
      suggestions: ['mission', 'don', 'projets', 'equipe', 'contact'],
    },
  },

  /* Suggestion labels */
  labels: {
    mission:   '🌴 Notre mission',
    projets:   '🏗️ Nos projets',
    histoire:  '📖 Notre histoire',
    equipe:    '👥 L\'équipe',
    don:       '💚 Faire un don',
    benevole:  '🙌 Être bénévole',
    contact:   '📞 Contact',
    foggara:   '💧 Les foggaras',
    tata:      '🗺️ Province de Tata',
  },
};

/* ─── NLP: detect intent from user input ──────────────── */
function detectIntent(text) {
  const t = text.toLowerCase().trim();
  const isArabic = /[\u0600-\u06FF]/.test(text);

  if (isArabic) {
    if (/مرحب|سلام|أهلا|هلا/.test(text)) return 'arabic_bonjour';
    if (/مهم|هدف|رسال/.test(text)) return 'arabic_mission';
    if (/تبر|دونا|دعم/.test(text)) return 'arabic_don';
    return 'arabic_bonjour';
  }

  if (/bonjour|salut|salam|bonsoir|allô|allo|hello|hi\b/.test(t)) return 'bonjour';
  if (/mission|but|objectif|pourquoi|quoi|qu.est/.test(t)) return 'mission';
  if (/projet|réalis|action|accompli|terrain|résultat/.test(t)) return 'projets';
  if (/histoire|fondé|fondation|création|créé|depuis|quand/.test(t)) return 'histoire';
  if (/équipe|membre|président|trésorier|secrétaire|bénévol|qui/.test(t)) return 'equipe';
  if (/don|donner|contribu|aide|financer|financement|argent|payer|montant/.test(t)) return 'don';
  if (/bénévol|volontair|rejoindre|participer|contribuer|aider|compétence/.test(t)) return 'benevole';
  if (/contact|téléphone|email|adresse|appeler|écrire|joindre/.test(t)) return 'contact';
  if (/foggara|irrigation|canal|eau|hydraul/.test(t)) return 'foggara';
  if (/tata|maroc|village|province|région|sahara|désert/.test(t)) return 'tata';
  if (/palmier|palmeraie|oasis|datte/.test(t)) return 'mission';
  if (/merci|super|parfait|génial|excellent|cool|ok/.test(t)) return 'merci';

  return 'fallback';
}

/* ─── Format message text (bold, newlines) ────────────── */
function FormattedText({ text }) {
  const lines = text.split('\n');
  return (
    <span>
      {lines.map((line, li) => {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <span key={li}>
            {parts.map((part, pi) =>
              pi % 2 === 1
                ? <strong key={pi} style={{ fontWeight: 700, color: 'inherit' }}>{part}</strong>
                : <span key={pi}>{part}</span>
            )}
            {li < lines.length - 1 && <br />}
          </span>
        );
      })}
    </span>
  );
}

/* ─── Typing indicator ─────────────────────────────────── */
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '12px 16px' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 7, height: 7, borderRadius: '50%', background: O,
          display: 'block',
          animation: 'chatDot 1.2s infinite',
          animationDelay: `${i * 0.18}s`,
        }} />
      ))}
    </div>
  );
}

/* ─── Main Chatbot component ───────────────────────────── */
export default function Chatbot() {
  const [open, setOpen]         = useState(false);
  const [msgs, setMsgs]         = useState([]);
  const [input, setInput]       = useState('');
  const [typing, setTyping]     = useState(false);
  const [pulsing, setPulsing]   = useState(true);
  const [unread, setUnread]     = useState(1);
  const bottomRef               = useRef(null);
  const inputRef                = useRef(null);
  const hasOpened               = useRef(false);

  /* Welcome message on first open */
  useEffect(() => {
    if (open && !hasOpened.current) {
      hasOpened.current = true;
      setUnread(0);
      setPulsing(false);
      setTimeout(() => {
        setMsgs([{
          id: 1, role: 'bot',
          text: `Salam ! Bienvenue 🌴\n\nJe suis l'assistant de l'**Association Palmeraies Tighremt**.\nComment puis-je vous aider ?`,
          suggestions: ['mission', 'don', 'projets', 'equipe', 'contact'],
        }]);
      }, 320);
    }
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [open]);

  /* Auto-scroll to bottom */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, typing]);

  const addMsg = useCallback((role, text, suggestions = []) => {
    setMsgs(prev => [...prev, { id: Date.now() + Math.random(), role, text, suggestions }]);
  }, []);

  const handleSend = useCallback((text) => {
    const trimmed = (text || input).trim();
    if (!trimmed) return;
    setInput('');
    addMsg('user', trimmed);
    setTyping(true);

    const intent = detectIntent(trimmed);
    const delay = 600 + Math.random() * 700;

    setTimeout(() => {
      setTyping(false);
      if (intent === 'merci') {
        addMsg('bot', 'Avec plaisir ! 😊 N\'hésitez pas si vous avez d\'autres questions.', ['mission', 'don', 'contact']);
      } else {
        const resp = KB.responses[intent] || KB.responses.fallback;
        addMsg('bot', resp.text, resp.suggestions || []);
      }
    }, delay);
  }, [input, addMsg]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <>
      <style>{`
        @keyframes chatDot {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40%            { transform: scale(1);   opacity: 1; }
        }
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes chatPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(196,112,63,0.5); }
          50%       { box-shadow: 0 0 0 14px rgba(196,112,63,0); }
        }
        @keyframes chatBadgePop {
          0%   { transform: scale(0); }
          70%  { transform: scale(1.25); }
          100% { transform: scale(1); }
        }
        .chat-window {
          animation: chatSlideUp 0.38s cubic-bezier(0.16,1,0.3,1) both;
        }
        .chat-fab {
          animation: ${pulsing ? 'chatPulse 2.4s ease-in-out infinite' : 'none'};
        }
        .chat-msg-bot  { animation: chatSlideUp 0.3s cubic-bezier(0.16,1,0.3,1) both; }
        .chat-msg-user { animation: chatSlideUp 0.22s cubic-bezier(0.16,1,0.3,1) both; }
        .chat-suggestion {
          display: inline-flex; align-items: center;
          padding: 6px 12px; border-radius: 999px;
          border: 1.5px solid ${SD}; background: ${S};
          color: ${GD}; font-size: 0.78rem; font-weight: 500;
          cursor: pointer; white-space: nowrap;
          transition: background 0.18s, border-color 0.18s, transform 0.18s;
          font-family: inherit;
        }
        .chat-suggestion:hover {
          background: ${SD}; border-color: ${O};
          transform: translateY(-1px);
        }
        .chat-input-box:focus {
          outline: none;
          border-color: ${O};
          box-shadow: 0 0 0 3px rgba(196,112,63,0.14);
        }
        .chat-send-btn:hover { background: ${G}; transform: scale(1.07); }
        .chat-send-btn:active { transform: scale(0.95); }
        @media (max-width: 480px) {
          .chat-window-wrap {
            right: 0 !important; left: 0 !important; bottom: 0 !important;
            width: 100% !important; border-radius: 1.5rem 1.5rem 0 0 !important;
            max-height: 80svh !important;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .chat-window, .chat-msg-bot, .chat-msg-user { animation: none; }
          .chat-fab { animation: none; }
        }
      `}</style>

      {/* ── FAB button ─────────────────────────────────── */}
      <button
        className="chat-fab"
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Fermer le chat' : 'Ouvrir le chat'}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9000,
          width: 58, height: 58, borderRadius: '50%',
          background: open ? GD : `linear-gradient(135deg, ${G}, ${GD})`,
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 28px rgba(19,61,32,0.38), 0 2px 8px rgba(0,0,0,0.18)',
          transition: 'background 0.25s, transform 0.25s, box-shadow 0.25s',
          color: '#fff',
        }}
      >
        {open
          ? <ChevronDown size={22} strokeWidth={2.5} />
          : <MessageCircle size={24} strokeWidth={1.8} />
        }
        {/* Unread badge */}
        {!open && unread > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            width: 20, height: 20, borderRadius: '50%',
            background: O, color: '#fff', fontSize: '0.65rem',
            fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #fff',
            animation: 'chatBadgePop 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            {unread}
          </span>
        )}
      </button>

      {/* ── Chat window ─────────────────────────────────── */}
      {open && (
        <div
          className="chat-window chat-window-wrap"
          style={{
            position: 'fixed', bottom: 96, right: 24, zIndex: 8999,
            width: 360, maxHeight: '72vh',
            background: S, borderRadius: '1.5rem',
            border: `1px solid ${SD}`,
            boxShadow: '0 20px 60px rgba(19,61,32,0.2), 0 4px 16px rgba(0,0,0,0.1)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            background: `linear-gradient(135deg, ${GD} 0%, ${G} 100%)`,
            padding: '1rem 1.25rem',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            flexShrink: 0,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              border: '2px solid rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Leaf size={18} color="#fff" strokeWidth={1.8} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff', lineHeight: 1.2 }}>
                Assistant Tighremt
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7ded9d', display: 'inline-block' }} />
                En ligne · Répond en français &amp; arabe
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Fermer"
              style={{
                background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
                width: 32, height: 32, cursor: 'pointer', color: 'rgba(255,255,255,0.8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>

          {/* Messages area */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '1rem',
            display: 'flex', flexDirection: 'column', gap: '0.75rem',
            scrollbarWidth: 'thin', scrollbarColor: `${SD} transparent`,
          }}>
            {msgs.map((msg) => (
              <div
                key={msg.id}
                className={msg.role === 'bot' ? 'chat-msg-bot' : 'chat-msg-user'}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'bot' ? 'flex-start' : 'flex-end',
                  gap: '0.5rem',
                }}
              >
                {/* Bubble */}
                <div style={{
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'bot'
                    ? '4px 16px 16px 16px'
                    : '16px 4px 16px 16px',
                  background: msg.role === 'bot' ? '#fff' : GD,
                  color: msg.role === 'bot' ? IM : '#fff',
                  fontSize: '0.84rem', lineHeight: 1.65,
                  border: msg.role === 'bot' ? `1px solid ${SD}` : 'none',
                  boxShadow: msg.role === 'bot'
                    ? '0 2px 8px rgba(0,0,0,0.06)'
                    : '0 4px 14px rgba(19,61,32,0.25)',
                  whiteSpace: 'pre-line',
                }}>
                  <FormattedText text={msg.text} />
                </div>

                {/* Suggestions */}
                {msg.role === 'bot' && msg.suggestions?.length > 0 && (
                  <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: '0.4rem',
                    maxWidth: '90%',
                  }}>
                    {msg.suggestions.map(key => (
                      KB.labels[key] && (
                        <button
                          key={key}
                          className="chat-suggestion"
                          onClick={() => handleSend(KB.labels[key].replace(/^[^\w\s]*\s/, ''))}
                        >
                          {KB.labels[key]}
                        </button>
                      )
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {typing && (
              <div className="chat-msg-bot" style={{ alignSelf: 'flex-start' }}>
                <div style={{
                  background: '#fff', border: `1px solid ${SD}`,
                  borderRadius: '4px 16px 16px 16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  display: 'inline-block',
                }}>
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div style={{
            padding: '0.75rem 1rem',
            borderTop: `1px solid ${SD}`,
            background: '#fff',
            display: 'flex', gap: '0.5rem', alignItems: 'flex-end',
            flexShrink: 0,
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Écrivez votre message..."
              rows={1}
              className="chat-input-box"
              style={{
                flex: 1, resize: 'none', border: `1.5px solid ${SD}`,
                borderRadius: '0.75rem', padding: '9px 12px',
                fontSize: '0.84rem', fontFamily: 'inherit',
                background: S, color: '#1c1c18', lineHeight: 1.5,
                transition: 'border-color 0.2s, box-shadow 0.2s',
                maxHeight: 100, overflowY: 'auto',
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="chat-send-btn"
              aria-label="Envoyer"
              style={{
                width: 40, height: 40, borderRadius: '50%', border: 'none',
                background: input.trim() ? GD : SD,
                color: input.trim() ? '#fff' : IM,
                cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'background 0.2s, transform 0.18s',
              }}
            >
              <Send size={16} strokeWidth={2} />
            </button>
          </div>

          {/* Footer */}
          <div style={{
            padding: '0.4rem 1rem 0.65rem',
            textAlign: 'center', fontSize: '0.62rem',
            color: IM, opacity: 0.5, background: '#fff',
            letterSpacing: '0.04em',
            flexShrink: 0,
          }}>
            Association Palmeraies Tighremt · Tata, Maroc 🌴
          </div>
        </div>
      )}
    </>
  );
}
