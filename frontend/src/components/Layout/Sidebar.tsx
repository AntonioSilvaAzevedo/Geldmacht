'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  CreditCard,
  Briefcase,
  TrendingUp,
  Upload,
  Tags,
} from 'lucide-react';

const navItems = [
  { href: '/',          label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/mes/2026-04', label: 'Mensal',   icon: CalendarDays },
  { href: '/cartao', label: 'Cartão', icon: CreditCard },
  { href: '/carteira',  label: 'Carteira',   icon: Briefcase },
  { href: '/proventos', label: 'Proventos',  icon: TrendingUp },
  { href: '/categorias', label: 'Categorias', icon: Tags },
];

const toolItems = [
  { href: '/upload', label: 'Importar', icon: Upload },
];

export default function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href.split('/').slice(0, 2).join('/'));
  }

  return (
    <aside
      style={{
        width: 220,
        minWidth: 220,
        background: 'var(--navy-950)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #3182ce 0%, #2c7a7b 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 700,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            G
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Geldmacht
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Finanças 2026
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px 10px', flex: 1 }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 10px 8px' }}>
          Menu
        </div>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 8,
                marginBottom: 2,
                textDecoration: 'none',
                color: active ? '#fff' : 'var(--text-secondary)',
                background: active
                  ? 'linear-gradient(90deg, rgba(49,130,206,0.25) 0%, rgba(49,130,206,0.08) 100%)'
                  : 'transparent',
                borderLeft: active ? '2px solid var(--blue-500)' : '2px solid transparent',
                fontSize: 13.5,
                fontWeight: active ? 600 : 400,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.04)';
                  (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                  (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-secondary)';
                }
              }}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}

        {/* Ferramentas */}
        <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '16px 10px 8px', marginTop: 4 }}>
          Ferramentas
        </div>
        {toolItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 8,
                marginBottom: 2,
                textDecoration: 'none',
                color: active ? '#fff' : 'var(--text-secondary)',
                background: active
                  ? 'linear-gradient(90deg, rgba(49,130,206,0.25) 0%, rgba(49,130,206,0.08) 100%)'
                  : 'transparent',
                borderLeft: active ? '2px solid var(--blue-500)' : '2px solid transparent',
                fontSize: 13.5,
                fontWeight: active ? 600 : 400,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.04)';
                  (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                  (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-secondary)';
                }
              }}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: 11,
          color: 'var(--text-muted)',
        }}
      >
        <div>Antonio Carlos</div>
        <div style={{ marginTop: 2 }}>antonie.dev@gmail.com</div>
      </div>
    </aside>
  );
}
