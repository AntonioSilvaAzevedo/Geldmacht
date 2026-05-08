'use client';

import { Coins } from 'lucide-react';
import Header from '@/components/Layout/Header';
import ComingSoonState from '@/components/ComingSoonState';

export default function ProventosPage() {
  return (
    <>
      <Header title="Proventos" subtitle="Dividendos e rendimentos" />
      <ComingSoonState
        icon={<Coins size={20} color="var(--blue-400)" />}
        title="Proventos em desenvolvimento"
        description="Em breve você poderá acompanhar dividendos, rendimentos e proventos recebidos por aqui."
      />
    </>
  );
}
