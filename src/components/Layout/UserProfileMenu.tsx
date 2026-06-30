'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { LogOut, Settings, User } from 'lucide-react';
import Link from 'next/link';
import { clearStoredAuthVersion } from '@/lib/authVersion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/**
 * Avatar do usuário com popover contendo: Perfil, Configurações e Sair.
 *
 * - Avatar mostra iniciais derivadas do nome/e-mail real da sessão.
 * - Quando não há sessão, exibe um avatar genérico (sem nome/e-mail fake).
 * - Sair chama o fluxo real de logout do Auth.js.
 * - Perfil/Configurações apontam para rotas em desenvolvimento — clicáveis,
 *   mas a página de destino mostra ComingSoonState.
 * - Fecha por clique fora, Esc ou seleção de uma ação.
 */
export default function UserProfileMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Fecha por clique fora e Esc
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const name = session?.user?.name ?? null;
  const email = session?.user?.email ?? null;
  const display = name || email || '';
  const initials = display
    ? display.trim().charAt(0).toUpperCase()
    : '';

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Abrir menu do perfil"
        title={display || 'Perfil'}
        size="icon"
        className={cn(
          'size-8 min-h-8 min-w-8 shrink-0 rounded-full border-none bg-[var(--primary-gradient)] p-0 text-[13px] font-bold text-white',
          'shadow-none hover:!bg-[var(--primary-gradient)] hover:!opacity-[0.88]',
          open && 'ring-2 ring-[var(--blue-400)] ring-offset-0',
        )}
      >
        {initials || <User size={15} />}
      </Button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            minWidth: 200,
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 10,
            boxShadow: '0 14px 40px rgba(0,0,0,0.45)',
            padding: 6,
            zIndex: 60,
            animation: 'profileMenuIn 0.14s ease-out',
          }}
        >
          {(name || email) && (
            <div style={{
              padding: '8px 10px 10px',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: 4,
            }}>
              {name && (
                <div style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {name}
                </div>
              )}
              {email && (
                <div style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginTop: name ? 2 : 0,
                }}>
                  {email}
                </div>
              )}
            </div>
          )}

          <MenuLink href="/home/perfil" icon={<User size={14} />} onClick={() => setOpen(false)}>
            Perfil
          </MenuLink>
          <MenuLink href="/home/configuracoes" icon={<Settings size={14} />} onClick={() => setOpen(false)}>
            Configurações
          </MenuLink>

          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />

          <Button
            type="button"
            role="menuitem"
            variant="ghost"
            className="h-auto min-h-9 w-full justify-start gap-2.5 rounded-[7px] px-2.5 py-2 text-[12.5px] font-normal text-[var(--red)] hover:bg-[rgba(252,129,129,0.10)] hover:!text-[var(--red)]"
            onClick={() => {
              setOpen(false);
              clearStoredAuthVersion();
              void signOut({ callbackUrl: '/login' });
            }}
          >
            <LogOut size={14} />
            Sair
          </Button>
        </div>
      )}

      <style>{`
        @keyframes profileMenuIn {
          from { opacity: 0; transform: translateY(-4px) scale(0.98) }
          to   { opacity: 1; transform: translateY(0) scale(1) }
        }
      `}</style>
    </div>
  );
}

function MenuLink({
  href,
  icon,
  onClick,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      style={{
        ...menuButtonStyle,
        textDecoration: 'none',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
        e.currentTarget.style.color = 'var(--text-primary)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'var(--text-secondary)';
      }}
    >
      {icon}
      {children}
    </Link>
  );
}

const menuButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  width: '100%',
  padding: '8px 10px',
  borderRadius: 7,
  border: 'none',
  background: 'transparent',
  color: 'var(--text-secondary)',
  fontSize: 12.5,
  cursor: 'pointer',
  textAlign: 'left',
};
