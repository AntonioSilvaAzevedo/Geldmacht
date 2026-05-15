'use client';

/**
 * AuthRefreshGuard
 *
 * Token dura 7 dias. O jwt callback renova quando falta ≤1 dia.
 * O timer aqui verifica uma vez por dia — suficiente para garantir
 * que o refresh acontece antes de expirar.
 *
 * Se o refresh falhar (backend offline, token corrompido), faz logout
 * limpo com mensagem amigável em /login?reason=expired.
 */

import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';

const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 1 dia

export default function AuthRefreshGuard() {
  const { data: session, update } = useSession();

  useEffect(() => {
    if (session?.error === 'RefreshAccessTokenError') {
      void signOut({ callbackUrl: '/login?reason=expired' });
    }
  }, [session?.error]);

  useEffect(() => {
    const id = setInterval(() => { void update(); }, CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [update]);

  return null;
}
