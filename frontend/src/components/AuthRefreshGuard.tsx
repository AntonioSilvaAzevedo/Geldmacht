'use client';

/**
 * AuthRefreshGuard
 *
 * Componente invisível montado no AppLayout. Faz duas coisas:
 *
 * 1. Proactive refresh — chama update() a cada 4 minutos para manter
 *    o jwt callback ativo. Como o backend token dura 60 min e o callback
 *    renova com 5 min de antecedência, esse timer garante que o refresh
 *    acontece antes de expirar mesmo com a aba inativa.
 *
 * 2. Error fallback — se o refresh falhar (backend offline, token já
 *    expirado sem ser renovado), detecta session.error e faz logout
 *    redirecionando para /login?reason=expired com mensagem amigável.
 */

import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';

const REFRESH_INTERVAL_MS = 4 * 60 * 1000; // 4 minutos

export default function AuthRefreshGuard() {
  const { data: session, update } = useSession();

  // Fallback: se o refresh falhar, faz logout limpo
  useEffect(() => {
    if (session?.error === 'RefreshAccessTokenError') {
      void signOut({ callbackUrl: '/login?reason=expired' });
    }
  }, [session?.error]);

  // Timer proativo: força o jwt callback a cada 4 min
  // O callback renova o token quando faltam ≤5 min → overlap intencional
  useEffect(() => {
    const id = setInterval(() => {
      void update();
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(id);
  }, [update]);

  return null;
}
