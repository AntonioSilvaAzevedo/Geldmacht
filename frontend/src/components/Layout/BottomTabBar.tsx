/**
 * Geldmacht — Bottom Tab Bar (Mobile Navigation) — Apple Direction
 * Mobile: fixed no rodapé, 49px + safe-area-inset-bottom
 */

'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ── Tabs config ───────────────────────────────────────────────────────────────
const TABS = [
  { href: '/home',        label: 'Início'      },
  { href: '/home/carteira',    label: 'Carteira'    },
  { href: '/home/lancamentos/novo', label: 'Lançamentos' },
  { href: '/home/categorias',  label: 'Categorias'  },
  { href: '/home/mais',        label: 'Mais'        },
];

// ── Icons ─────────────────────────────────────────────────────────────────────
function TabIcon({ href, active }: { href: string; active: boolean }) {
  const c = active ? '#0A84FF' : 'rgba(255,255,255,0.4)';
  const props = {
    width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none',
    stroke: c, strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  const icons: Record<string, React.ReactNode> = {
    '/home': (
      <svg {...props}>
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
        <path d="M9 21V12h6v9"/>
      </svg>
    ),
    '/home/carteira': (
      <svg {...props}>
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
        <line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
    '/home/lancamentos/novo': (
      <svg {...props}>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    ),
    '/home/categorias': (
      <svg {...props}>
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
    '/home/mais': (
      <svg {...props}>
        <circle cx="5" cy="12" r="1.5"/>
        <circle cx="12" cy="12" r="1.5"/>
        <circle cx="19" cy="12" r="1.5"/>
      </svg>
    ),
  };
  return <>{icons[href] ?? null}</>;
}

// ── Bottom Tab Bar ────────────────────────────────────────────────────────────
export default function BottomTabBar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/home') return pathname === '/home';
    if (href === '/home/lancamentos/novo') return pathname.startsWith('/home/lancamentos');
    if (href === '/home/carteira') return (
      pathname.startsWith('/home/carteira') ||
      pathname.startsWith('/home/cartao')
    );
    return pathname.startsWith(href);
  }

  return (
    <nav className="is-mobile-only" style={{
      position:             'fixed',
      bottom:               0,
      left:                 0,
      right:                0,
      zIndex:               50,
      display:              'flex',
      alignItems:           'stretch',
      background:           'rgba(28,28,30,0.92)',
      backdropFilter:       'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop:            '1px solid rgba(255,255,255,0.08)',
      paddingBottom:        'env(safe-area-inset-bottom)',
    }}>
      {TABS.map(tab => {
        const active = isActive(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              flex:           1,
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            3,
              padding:        '8px 4px 10px',
              color:          active ? '#0A84FF' : 'rgba(255,255,255,0.4)',
              textDecoration: 'none',
              transition:     'color 0.12s',
            }}
          >
            <TabIcon href={tab.href} active={active}/>
            <span style={{ fontSize:10, fontWeight:500, lineHeight:1 }}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
