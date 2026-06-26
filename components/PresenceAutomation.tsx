'use client';

import { useEffect, useRef } from 'react';

export function PresenceAutomation() {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    // Call the API route in the background
    fetch('/api/check-presences')
      .then(res => res.json())
      .then(data => {
        console.log('Automação de Faltas:', data);
      })
      .catch(err => {
        console.error('Erro na automação de faltas:', err);
      });
  }, []);

  return null;
}
