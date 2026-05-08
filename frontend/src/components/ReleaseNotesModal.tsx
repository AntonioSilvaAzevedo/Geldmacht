'use client';

import { useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';

interface ReleaseNotesModalProps {
  version: string;
  title: string;
  description: string | null;
  items: string[];
  /**
   * Chamado quando o usuário fecha o modal (botão X ou clique no overlay).
   * Deve registrar como visualizado no backend.
   */
  onClose: () => void;
  /**
   * Chamado quando o usuário clica em "Entendi".
   * Pode ser igual ao onClose — separados para permitir telemetria.
   */
  onConfirm: () => void;
}

/**
 * Modal de novidades exibido após login na Dashboard.
 *
 * Características:
 * - Fechar (X, overlay, "Entendi" ou tecla Esc) marca como visualizado.
 * - Não bloqueia permanentemente; sempre tem caminho de saída claro.
 * - Conteúdo curto e amigável; renderiza items como lista.
 */
export default function ReleaseNotesModal({
  version,
  title,
  description,
  items,
  onClose,
  onConfirm,
}: ReleaseNotesModalProps) {
  // Esc fecha
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="release-notes-title"
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: 20,
        animation: 'rnFadeIn 0.18s ease-out',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 16,
          padding: '0',
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 32px 80px rgba(0,0,0,0.55)',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'rnSlideIn 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        {/* Header com gradiente discreto */}
        <div style={{
          padding: '20px 22px 16px',
          background: 'linear-gradient(135deg, rgba(49,130,206,0.18) 0%, rgba(44,122,123,0.12) 100%)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', minWidth: 0 }}>
            <span style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #3182ce 0%, #2c7a7b 100%)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 14px rgba(49,130,206,0.35)',
            }}>
              <Sparkles size={18} color="#fff" />
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 10.5, color: 'var(--text-muted)',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                fontFamily: 'var(--font-mono)',
              }}>
                Novidades · v{version}
              </div>
              <h2
                id="release-notes-title"
                style={{
                  margin: '4px 0 0',
                  fontSize: 17,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                {title}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            style={{
              width: 30, height: 30, borderRadius: 7,
              border: '1px solid var(--border-subtle)',
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Conteúdo */}
        <div style={{
          padding: '18px 22px 6px',
          overflowY: 'auto',
          flex: 1,
        }}>
          {description && (
            <p style={{
              margin: '0 0 14px',
              fontSize: 13.5,
              color: 'var(--text-secondary)',
              lineHeight: 1.55,
            }}>
              {description}
            </p>
          )}

          {items.length > 0 && (
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'grid',
              gap: 8,
            }}>
              {items.map((item, i) => (
                <li
                  key={i}
                  style={{
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    lineHeight: 1.5,
                  }}
                >
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: 'var(--blue-400)',
                    marginTop: 7, flexShrink: 0,
                  }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 22px 18px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          borderTop: '1px solid var(--border-subtle)',
        }}>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '9px 20px',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #3182ce 0%, #2c7a7b 100%)',
              color: '#fff',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              letterSpacing: '0.01em',
            }}
          >
            Entendi
          </button>
        </div>
      </div>

      <style>{`
        @keyframes rnFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes rnSlideIn {
          from { opacity: 0; transform: translateY(8px) scale(0.98) }
          to   { opacity: 1; transform: translateY(0) scale(1) }
        }
      `}</style>
    </div>
  );
}
