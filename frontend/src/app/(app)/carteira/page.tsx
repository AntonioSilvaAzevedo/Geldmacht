'use client';

import { Briefcase } from 'lucide-react';
import Header from '@/components/Layout/Header';
import ComingSoonState from '@/components/ComingSoonState';

export default function CarteiraPage() {
  return (
    <>
      <Header title="Carteira" subtitle="Visão geral de investimentos e ativos" />
      <ComingSoonState
        icon={<Briefcase size={20} color="var(--blue-400)" />}
        title="Carteira em desenvolvimento"
        description="Em breve você poderá organizar contas, saldo, investimentos e outros ativos financeiros nesta área."
      />
    </>
  );
}
