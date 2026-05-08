'use client';

import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
  clearStoredAuthVersion,
  getStoredAuthVersion,
  markAuthVersionCurrent,
  shouldForceRelogin,
} from '@/lib/authVersion';

/**
 * Verifica, após a sessão ficar autenticada, se a versão local da sessão
 * está abaixo do mínimo exigido pelo build atual. Se sim, força logout.
 *
 * Inserido no layout `(app)` para rodar em qualquer página autenticada.
 * Não renderiza nada visualmente.
 *
 * Comportamento:
 *   - status !== 'authenticated': não faz nada (login/registro tratam).
 *   - localStorage vazio + sessão ativa: marca versão atual (post-login).
 *   - localStorage < minAuthVersion: signOut + clear + redireciona /login.
 *   - localStorage ≥ minAuthVersion: nada a fazer.
 */
export default function AuthVersionGate() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== 'authenticated') return;

    if (shouldForceRelogin()) {
      clearStoredAuthVersion();
      void signOut({ callbackUrl: '/login', redirect: true });
      return;
    }

    // Sessão válida na versão atual. Garante que o storage reflita isso.
    if (!getStoredAuthVersion()) {
      markAuthVersionCurrent();
    }
  }, [status]);

  return null;
}
