'use client';

/**
 * AuthRefreshGuard
 *
 * Componente invisível incluído no AppLayout. Observa session.error:
 * se o refresh silencioso do access_token falhar (token completamente
 * inválido / backend indisponível), faz logout e redireciona para /login
 * com um query param que exibe uma mensagem amigável.
 */

import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';

export default function AuthRefreshGuard() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.error === 'RefreshAccessTokenError') {
      void signOut({ callbackUrl: '/login?reason=expired' });
    }
  }, [session?.error]);

  return null;
}
