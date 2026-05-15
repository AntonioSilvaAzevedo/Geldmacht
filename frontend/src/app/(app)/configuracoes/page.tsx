'use client';

import { Settings } from 'lucide-react';
import PageHeader from '@/components/Layout/PageHeader';
import ComingSoonState from '@/components/ComingSoonState';

export default function ConfiguracoesPage() {
  return (
    <>
      <PageHeader title="Configurações" subtitle="Preferências e ajustes do app" />
      <ComingSoonState
        icon={<Settings size={20} color="var(--purple)" />}
        title="Configurações em desenvolvimento"
        description="Em breve você poderá personalizar preferências, notificações e ajustes gerais por aqui."
      />
    </>
  );
}
