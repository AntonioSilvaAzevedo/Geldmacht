'use client';

import { Bell, RefreshCw, LogOut } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { data: session } = useSession();

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const userName  = session?.user?.name  ?? session?.user?.email ?? 'Usuário';
  const initials  = userName.slice(0, 1).toUpperCase();

  return (
    <header
      style={{
        height: 60,
        background: 'var(--navy-800)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <div>
        <h1 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
          {title}
        </h1>
        {subtitle && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{subtitle}</div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
          {dateStr}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'transparent', border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title="Atualizar dados"
          >
            <RefreshCw size={14} />
          </button>

          <button
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'transparent', border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title="Notificações"
          >
            <Bell size={14} />
          </button>

          {/* Avatar + nome */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, #3182ce 0%, #2c7a7b 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#fff',
              }}
              title={userName}
            >
              {initials}
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {session?.user?.name ?? session?.user?.email}
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'transparent', border: '1px solid var(--border-default)',
              color: 'var(--text-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'color 0.15s, border-color 0.15s',
            }}
            title="Sair"
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--red-400)'; e.currentTarget.style.borderColor = 'rgba(252,129,129,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-default)'; }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
