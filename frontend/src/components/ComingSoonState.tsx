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
        padding: 'var(--space-10) var(--space-6)',
      }}
    >
      <div
        className="animate-in delay-1"
        style={{
          width: '100%',
          maxWidth: 480,
          textAlign: 'center',
          background: 'var(--surface-card)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--inset-card)',
          boxShadow: 'var(--shadow-card)',
          display: 'grid',
          gap: 'var(--space-3)',
          justifyItems: 'center',
        }}
      >
        <span
          style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-md)',
            background:
              'linear-gradient(135deg, rgba(191,90,242,0.22) 0%, rgba(90,200,250,0.18) 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {icon ?? <Sparkles size={20} color="var(--purple)" />}
        </span>

        <div className="t-section-label" style={{ letterSpacing: '0.08em', marginTop: 2 }}>
          Em desenvolvimento
        </div>

        <h2 className="t-title3" style={{ margin: 0 }}>
          {title}
        </h2>

        {description && (
          <p className="t-footnote" style={{ margin: 0, maxWidth: 360 }}>
            {description}
          </p>
        )}

        {action && (
          <div style={{ marginTop: 'var(--space-2)' }}>{action}</div>
        )}
      </div>
    </div>
  );
}
