'use client';

import { Sparkles } from 'lucide-react';

/**
 * Estado visual para áreas/páginas ainda em desenvolvimento.
 *
 * Use sempre que a página estiver acessível pela navegação mas ainda não
 * tiver dados reais ou implementação concluída — evita exibir mocks
 * ou layouts vazios sem explicação ao usuário.
 *
 * Não criar dados simulados. Não inventar números/gráficos.
 */
interface ComingSoonStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export default function ComingSoonState({
  title,
  description,
  icon,
  action,
}: ComingSoonStateProps) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          textAlign: 'center',
          background: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 14,
          padding: '32px 28px',
          display: 'grid',
          gap: 12,
          justifyItems: 'center',
        }}
      >
        <span
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background:
              'linear-gradient(135deg, rgba(49,130,206,0.15) 0%, rgba(44,122,123,0.15) 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {icon ?? <Sparkles size={20} color="var(--blue-400)" />}
        </span>

        <div style={{
          fontSize: 10.5,
          color: 'var(--text-muted)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-mono)',
        }}>
          Em desenvolvimento
        </div>

        <h2 style={{
          margin: 0,
          fontSize: 17,
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
        }}>
          {title}
        </h2>

        {description && (
          <p style={{
            margin: 0,
            fontSize: 13,
            color: 'var(--text-secondary)',
            lineHeight: 1.55,
          }}>
            {description}
          </p>
        )}

        {action && <div style={{ marginTop: 6 }}>{action}</div>}
      </div>
    </div>
  );
}
