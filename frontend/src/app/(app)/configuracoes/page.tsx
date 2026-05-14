'use client';

import { Settings } from 'lucide-react';
import ComingSoonState from '@/components/ComingSoonState';

export default function ConfiguracoesPage() {
  return (
    <>
<ComingSoonState
        icon={<Settings size={20} color="var(--purple)" />}
        title="Configurações em desenvolvimento"
        description="Em breve você poderá personalizar preferências, notificações e ajustes gerais por aqui."
      />
    </>
  );
}
