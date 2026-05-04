'use client';

import { AlertTriangle } from 'lucide-react';

interface Props {
  message?: string;
}

export default function ErrorState({ message }: Props) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      padding: 48,
      textAlign: 'center',
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        background: 'rgba(229,62,62,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <AlertTriangle size={22} color="var(--red-400)" />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
          Erro ao carregar dados
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 320 }}>
          {message ?? 'Verifique se o backend está rodando em localhost:8000'}
        </div>
      </div>
    </div>
  );
}
