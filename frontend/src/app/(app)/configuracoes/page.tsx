'use client';

import { Settings } from 'lucide-react';
import Header from '@/components/Layout/Header';
import ComingSoonState from '@/components/ComingSoonState';

export default function ConfiguracoesPage() {
  return (
    <>
      <Header title="Configurações" subtitle="Preferências e ajustes do app" />
      <ComingSoonState
        icon={<Settings size={20} color="var(--blue-400)" />}
        title="Configurações em desenvolvimento"
        description="Em breve você poderá personalizar preferências, notificações e ajustes gerais por aqui."
      />
    </>
  );
}
