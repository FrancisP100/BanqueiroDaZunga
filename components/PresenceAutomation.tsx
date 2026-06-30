'use client';

import { useEffect, useRef } from 'react';

export function PresenceAutomation() {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const controller = new AbortController();

    // Delay ligeiro para não bloquear o carregamento inicial da página
    const timer = setTimeout(() => {
      fetch('/api/check-presences', { signal: controller.signal })
        .then(res => res.json())
        .then(data => {
          if (process.env.NODE_ENV === 'development') {
            console.log('Automação de Faltas:', data);
          }
        })
        .catch(err => {
          // Ignorar erros de abort (HMR/navegação) e apenas logar os outros
          if (err.name !== 'AbortError') {
            console.warn('Automação de faltas indisponível:', err.message);
          }
        });
    }, 2000);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  return null;
}

