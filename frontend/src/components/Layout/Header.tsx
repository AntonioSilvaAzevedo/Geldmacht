'use client';

import { Bell } from 'lucide-react';
import UserProfileMenu from './UserProfileMenu';
import MobileSidebarDrawer from './MobileSidebarDrawer';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <MobileSidebarDrawer />
        <div style={{ minWidth: 0 }}>
          <h1 style={{
            fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {title}
          </h1>
          {subtitle && (
            <div style={{
              fontSize: 11, color: 'var(--text-muted)', marginTop: 1,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{subtitle}</div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          className="is-desktop-only"
          style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}
        >
          {dateStr}
        </div>

        <button
          className="is-desktop-only"
          style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'transparent', border: '1px solid var(--border-default)',
            color: 'var(--text-secondary)', cursor: 'pointer',
            alignItems: 'center', justifyContent: 'center',
          }}
          title="Notificações"
        >
          <Bell size={14} />
        </button>

        <UserProfileMenu />
      </div>
    </header>
  );
}
