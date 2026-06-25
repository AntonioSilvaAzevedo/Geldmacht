'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';
import { useLancamentoModal } from '@/components/Lancamento/lancamento-modal-context';

type IconName = 'wallet' | 'plus' | 'grid';

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/home/carteira', label: 'Carteira', icon: 'wallet' },
  { href: 'lancamento', label: 'Adicionar', icon: 'plus' },
  { href: '/home/categorias', label: 'Categorias', icon: 'grid' },
];

function TabIcon({ icon, active }: { icon: Exclude<IconName, 'plus'>; active: boolean }) {
  const props = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: cn('transition-colors duration-200', active ? 'text-[var(--blue,#0A84FF)]' : 'text-white/40'),
  };
  switch (icon) {
    case 'wallet':
      return (
        <svg {...props}>
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      );
    case 'grid':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
  }
}

export default function BottomTabBar() {
  const pathname = usePathname();
  const { open: openLancamento } = useLancamentoModal();

  function isActive(href: string) {
    if (href === '/home/carteira') {
      return pathname.startsWith('/home/carteira') || pathname.startsWith('/home/cartao');
    }
    return pathname.startsWith(href);
  }

  const activeIndex = NAV_ITEMS.findIndex((item) => isActive(item.href));

  return (
    <nav
      className="is-mobile-only fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.08] bg-[rgba(28,28,30,0.92)] pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
      aria-label="Navegação"
    >
      <div className="relative flex h-[56px] w-full items-stretch">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-1/3 p-1 transition-[transform,opacity] duration-300 ease-out"
          style={{ transform: `translateX(${Math.max(activeIndex, 0) * 100}%)`, opacity: activeIndex < 0 ? 0 : 1 }}
        >
          <span className="block h-full w-full rounded-2xl bg-white/[0.07]" />
        </span>

        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const slotClass = 'relative z-10 flex flex-1 flex-col items-center justify-center gap-1';
          const content = (
            <>
              {item.icon === 'plus' ? (
                <span
                  className={cn(
                    'flex size-7 items-center justify-center rounded-full transition-colors duration-200',
                    active ? 'bg-[rgba(10,132,255,0.18)]' : 'bg-white/[0.08]',
                  )}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    className={cn('transition-colors duration-200', active ? 'text-[var(--blue,#0A84FF)]' : 'text-white/65')}
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </span>
              ) : (
                <TabIcon icon={item.icon} active={active} />
              )}
              <span
                className={cn(
                  'text-[10px] font-medium leading-none transition-colors duration-200',
                  active ? 'text-[var(--blue,#0A84FF)]' : 'text-white/40',
                )}
              >
                {item.label}
              </span>
            </>
          );

          if (item.icon === 'plus') {
            return (
              <button
                key={item.href}
                type="button"
                onClick={openLancamento}
                aria-label="Adicionar lançamento"
                className={slotClass}
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={slotClass}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
