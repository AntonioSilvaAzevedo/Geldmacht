'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import ReleaseNotesModal from './ReleaseNotesModal';
import { api, type ReleaseNote } from '@/lib/api';

/**
 * Gate de release notes — busca a release note pendente do usuário logado
 * e renderiza o modal apenas quando há uma. Idempotente do ponto de vista
 * do usuário: ao fechar/confirmar marca como visualizado no backend, então
 * não aparece novamente para a mesma versão.
 *
 * Onde usar: dentro da página Dashboard (`/`) — o modal só dispara depois
 * que a sessão Auth.js está autenticada e a página renderizou.
 */
export default function ReleaseNotesGate() {
  const { status } = useSession();
  const [note, setNote] = useState<ReleaseNote | null>(null);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    void api
      .getPendingReleaseNote()
      .then(rn => {
        if (!cancelled) setNote(rn);
      })
      .catch(() => {
        // Falhar silenciosamente — release notes não devem quebrar a Dashboard
        if (!cancelled) setNote(null);
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  async function dismiss() {
    if (!note || closed) return;
    setClosed(true);
    try {
      await api.markReleaseNoteSeen(note.id);
    } catch {
      // Se falhar, não reabre — backend continua sendo a fonte de verdade
      // na próxima sessão. Evita loop visual.
    }
  }

  if (!note || closed) return null;

  return (
    <ReleaseNotesModal
      version={note.version}
      title={note.title}
      description={note.description}
      items={note.items}
      onClose={dismiss}
      onConfirm={dismiss}
    />
  );
}
