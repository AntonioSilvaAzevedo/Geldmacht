'use client';

import { useEffect, type ReactNode } from 'react';

export interface ModalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  width?: number;
  rightActions?: ReactNode;
  children: ReactNode;
}

const GM_MODAL_STYLES = `
  @keyframes gm-fadeIn  { from { opacity: 0 }                to { opacity: 1 } }
  @keyframes gm-slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
`;

let _stylesInjected = false;
function ensureStyles() {
  if (_stylesInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.id = 'gm-modal-overlay-styles';
  el.textContent = GM_MODAL_STYLES;
  document.head.appendChild(el);
  _stylesInjected = true;
}

export function ModalOverlay({
  isOpen,
  onClose,
  title,
  subtitle,
  width = 490,
  rightActions,
  children,
}: ModalOverlayProps) {
  ensureStyles();

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'gm-fadeIn .15s ease both',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.52)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
        }}
      />

      {/* Painel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: width,
          background: '#000',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 1,
          animation: 'gm-slideIn .24s cubic-bezier(.25,.46,.45,.94) both',
        }}
      >
        {/* Header (opcional) */}
        {title !== undefined && (
          <div
            style={{
              flexShrink: 0,
              padding: '18px 22px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: '-0.015em',
                  color: '#fff',
                  lineHeight: 1.2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {title}
              </div>
              {subtitle && (
                <div
                  style={{
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.38)',
                    marginTop: 3,
                  }}
                >
                  {subtitle}
                </div>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              {rightActions}
              <CloseButton onClick={onClose} />
            </div>
          </div>
        )}

        {/* Body scrollável */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Fechar painel"
      style={{
        width: 30,
        height: 30,
        borderRadius: 8,
        background: 'rgba(255,255,255,0.06)',
        border: 'none',
        color: 'rgba(255,255,255,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flexShrink: 0,
        padding: 0,
        transition: 'background .12s',
        fontFamily: 'inherit',
      }}
      onMouseEnter={e =>
        ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)')
      }
      onMouseLeave={e =>
        ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)')
      }
    >
      <svg
        width={14} height={14}
        viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={2.5}
        strokeLinecap="round" strokeLinejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  );
}

export default ModalOverlay;
