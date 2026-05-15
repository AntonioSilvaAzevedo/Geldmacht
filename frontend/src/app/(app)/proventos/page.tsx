'use client';

import { Coins } from 'lucide-react';
import PageHeader from '@/components/Layout/PageHeader';
import ComingSoonState from '@/components/ComingSoonState';

export default function ProventosPage() {
  return (
    <>
      <PageHeader title="Proventos" subtitle="Dividendos e rendimentos" />
      <ComingSoonState
        icon={<Coins size={20} color="var(--blue-400)" />}
        title="Proventos em desenvolvimento"
        description="Em breve você poderá acompanhar dividendos, rendimentos e proventos recebidos por aqui."
      />
    </>
  );
}
