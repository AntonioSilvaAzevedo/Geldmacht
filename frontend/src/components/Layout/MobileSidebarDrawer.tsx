'use client';

import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';

/**
 * Drawer/menu lateral exibido APENAS em viewport mobile (≤ 768px).
 *
 * - Botão hamburger compacto que abre uma sidebar overlay deslizando da
 *   esquerda. Fecha por X, clique no fundo escuro, Esc ou navegação (links).
 * - Reusa o componente `Sidebar` original — sem duplicar a lista de itens.
 * - Não afeta desktop: a classe `is-mobile-only` (definida em `globals.css`)
 *   esconde o botão em telas > 768px.
 */
export default function MobileSidebarDrawer() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handler);
    // Trava scroll do body enquanto o drawer está aberto.
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = original;
    };
  }, [open]);

  // Fecha ao clicar em qualquer link da sidebar (delegação no container).
  function handleSidebarClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement | null;
    if (target?.closest('a')) setOpen(false);
  }

  return (
    <>
      {/* Hamburger — só em mobile */}
      <button
        type="button"
        aria-label="Abrir menu"
        onClick={() => setOpen(true)}
        className="is-mobile-only"
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          border: '1px solid var(--border-default)',
          background: 'transparent',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Menu size={16} />
      </button>

      {/* Overlay + drawer */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            zIndex: 300,
            animation: 'drawerFadeIn 0.18s ease-out',
          }}
        >
          <div
            onClick={e => { e.stopPropagation(); handleSidebarClick(e); }}
            style={{
              position: 'absolute',
              top: 0, left: 0, bottom: 0,
              width: 'min(82vw, 280px)',
              animation: 'drawerSlideIn 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
          >
            <Sidebar />
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setOpen(false)}
              style={{
                position: 'absolute',
                top: 12,
                right: -42,
                width: 34,
                height: 34,
                borderRadius: 8,
                border: '1px solid var(--border-default)',
                background: 'var(--surface-card)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes drawerFadeIn {
          from { opacity: 0 } to { opacity: 1 }
        }
        @keyframes drawerSlideIn {
          from { transform: translateX(-12px); opacity: 0.6 }
          to   { transform: translateX(0); opacity: 1 }
        }
      `}</style>
    </>
  );
}
