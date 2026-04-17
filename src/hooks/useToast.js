'use client';
import { useState, useCallback } from 'react';

let _addToast = null;
export function useToastEmitter() {
  const [toasts, setToasts] = useState([]);
  _addToast = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  return { toasts, remove: id => setToasts(p => p.filter(t => t.id !== id)) };
}

export const toast = {
  success: msg => _addToast?.(msg, 'success'),
  error:   msg => _addToast?.(msg, 'error'),
  info:    msg => _addToast?.(msg, 'info'),
};
