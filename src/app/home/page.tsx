'use client';

import { LayoutDashboard } from 'lucide-react';
import ComingSoonState from '@/components/ComingSoonState';

export default function HomePage() {
  return (
    <>
      <ComingSoonState
        icon={<LayoutDashboard size={20} color="var(--blue-400)" />}
        title="Dashboard em desenvolvimento"
        description="Em breve você poderá acompanhar entradas, gastos, investimentos e saldo consolidado por aqui."
      />
    </>
  );
}
