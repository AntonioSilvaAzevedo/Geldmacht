'use client';

import Link from 'next/link';
import { Upload, Database } from 'lucide-react';

interface Props {
  title?: string;
  message?: string;
  actionHref?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export default function EmptyState({
  title = 'Nenhum dado importado ainda',
  message = 'Importe um extrato para começar a ver seus dados no Dashboard.',
  actionHref,
  actionLabel = 'Importar extrato',
  onAction,
  icon,
}: Props) {
  const hasAction = actionHref != null || onAction != null;

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
        {icon ?? <Database size={22} color="var(--blue-400)" />}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
          {title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: hasAction ? 16 : 0 }}>
          {message}
        </div>
        {hasAction && (
          <>
            {onAction ? (
              <button
                onClick={onAction}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'linear-gradient(135deg, #3182ce 0%, #2c7a7b 100%)',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {actionLabel}
              </button>
            ) : (
              <Link
                href={actionHref!}
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
                {actionLabel}
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}
