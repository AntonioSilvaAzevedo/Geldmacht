'use client';

import Link from 'next/link';
import { Upload, Database } from 'lucide-react';

export default function EmptyState() {
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
        background: 'rgba(49,130,206,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Database size={22} color="var(--blue-400)" />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
          Nenhum dado importado ainda
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
          Importe um extrato para começar a ver seus dados no Dashboard.
        </div>
        <Link
          href="/upload"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            borderRadius: 8,
            background: 'linear-gradient(135deg, #3182ce 0%, #2c7a7b 100%)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <Upload size={14} />
          Importar extrato
        </Link>
      </div>
    </div>
  );
}
