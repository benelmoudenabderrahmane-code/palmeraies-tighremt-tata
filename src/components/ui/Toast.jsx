'use client';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useToastEmitter } from '@/hooks/useToast';

const icons = { success: CheckCircle, error: AlertCircle, info: Info };
const colors = { success: '#1e5c30', error: '#c0392b', info: '#c4703f' };

export default function ToastContainer() {
  const { toasts, remove } = useToastEmitter();
  return (
    <div style={{ position: 'fixed', top: '5rem', right: '1rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.5rem', pointerEvents: 'none' }} aria-live="polite">
      {toasts.map(({ id, msg, type }) => {
        const Icon = icons[type];
        return (
          <div key={id} style={{
            pointerEvents: 'all', background: '#fff', borderLeft: `4px solid ${colors[type]}`,
            borderRadius: 8, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)', minWidth: 260, maxWidth: 360,
            animation: 'slideIn 0.3s ease',
          }}>
            <Icon size={16} color={colors[type]} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.88rem', flex: 1, color: '#1c1c18' }}>{msg}</span>
            <button onClick={() => remove(id)} aria-label="Fermer" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
              <X size={14} color="#8a8270" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
