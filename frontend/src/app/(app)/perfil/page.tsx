'use client';

import { User } from 'lucide-react';
import Header from '@/components/Layout/Header';
import ComingSoonState from '@/components/ComingSoonState';

export default function PerfilPage() {
  return (
    <>
      <Header title="Perfil" subtitle="Suas informações de conta" />
      <ComingSoonState
        icon={<User size={20} color="var(--blue-400)" />}
        title="Perfil em desenvolvimento"
        description="Em breve você poderá visualizar e editar suas informações de conta nesta área."
      />
    </>
  );
}
