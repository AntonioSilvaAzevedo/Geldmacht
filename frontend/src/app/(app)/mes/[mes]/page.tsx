'use client';

import { CalendarDays } from 'lucide-react';
import PageHeader from '@/components/Layout/PageHeader';
import ComingSoonState from '@/components/ComingSoonState';

export default function MesPage() {
  return (
    <>
      <PageHeader title="Detalhe Mensal" subtitle="Entradas, gastos e categorias do mês" />
      <ComingSoonState
        icon={<CalendarDays size={20} color="var(--blue-400)" />}
        title="Página mensal em desenvolvimento"
        description="Em breve você poderá acompanhar gastos, entradas, categorias e evolução mensal em um só lugar."
      />
    </>
  );
}
