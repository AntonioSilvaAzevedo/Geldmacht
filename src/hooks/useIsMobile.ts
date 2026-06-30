'use client';

import { useEffect, useState } from 'react';

/**
 * Detecta se a viewport está em largura mobile.
 *
 * Breakpoints do projeto:
 *   - mobile  : até 768px       (sidebar oculta por padrão)
 *   - tablet  : 769–1024px
 *   - desktop : > 1024px
 *
 * O hook usa `window.matchMedia` e atualiza no resize. Durante SSR, o
 * primeiro render assume `false` (desktop) — componentes que precisam de
 * comportamento exclusivamente mobile devem aguardar o efeito de mount.
 */
const MOBILE_QUERY = '(max-width: 768px)';

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);

  return isMobile;
}
