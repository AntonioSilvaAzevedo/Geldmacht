'use client';

import { useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';
import type { ReleaseNote } from '@/lib/api';

interface ReleaseNotesModalProps {
  /** Lista cronológica de releases não visualizadas (mais antigas primeiro). */
  releases: ReleaseNote[];
  /**
   * Chamado quando o usuário fecha o modal (X, overlay, Esc).
   * O Gate decide se persiste a marcação (normalmente sim).
   */
  onClose: () => void;
  /**
   * Chamado ao clicar em "Entendi". Pode ser igual a onClose.
   */
  onConfirm: () => void;
}

/**
 * Modal acumulativo de novidades.
 *
 * - Quando há **uma** release: título "Novidades da versão X".
 * - Quando há **várias** releases: título "Novidades desde seu último acesso".
 * - Cada release vira uma seção com versão + título + lista de tópicos.
 * - O conteúdo rola dentro do modal quando excede a altura.
 * - Botão "Entendi" e botão X disparam o mesmo fluxo (fechar + marcar como visto).
 */
export default function ReleaseNotesModal({
  releases,
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

  if (releases.length === 0) return null;

  const isMulti = releases.length > 1;
  const headerTitle = isMulti
    ? 'Novidades desde seu último acesso'
    : `Novidades da versão ${releases[0].version}`;
  const headerEyebrow = isMulti
    ? `${releases.length} atualizações acumuladas`
    : `v${releases[0].version}`;

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
          width: '100%',
          maxWidth: 520,
          boxShadow: '0 32px 80px rgba(0,0,0,0.55)',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'rnSlideIn 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        {/* Header */}
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
                Novidades · {headerEyebrow}
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
                {headerTitle}
              </h2>
              {isMulti && (
                <div style={{
                  marginTop: 6,
                  fontSize: 12.5,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.4,
                }}>
                  Veja o que mudou enquanto você esteve fora.
                </div>
              )}
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

        {/* Conteúdo — scroll interno quando longo */}
        <div style={{
          padding: '14px 22px 6px',
          overflowY: 'auto',
          flex: 1,
        }}>
          {releases.map((rn, idx) => (
            <ReleaseSection
              key={rn.id}
              release={rn}
              showDivider={idx < releases.length - 1}
              singleMode={!isMulti}
            />
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 22px 18px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          borderTop: '1px solid var(--border-subtle)',
        }}>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '9px 22px',
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

function ReleaseSection({
  release,
  showDivider,
  singleMode,
}: {
  release: ReleaseNote;
  showDivider: boolean;
  singleMode: boolean;
}) {
  return (
    <section style={{ paddingTop: singleMode ? 4 : 12, paddingBottom: 12 }}>
      {!singleMode && (
        <header style={{ marginBottom: 8, display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10.5,
            padding: '2px 7px',
            borderRadius: 5,
            background: 'rgba(49,130,206,0.15)',
            color: 'var(--blue-400)',
            border: '1px solid rgba(49,130,206,0.30)',
            fontWeight: 600,
            letterSpacing: '0.02em',
          }}>
            v{release.version}
          </span>
          <span style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}>
            {release.title}
          </span>
        </header>
      )}

      {release.description && (
        <p style={{
          margin: '0 0 10px',
          fontSize: 12.5,
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}>
          {release.description}
        </p>
      )}

      {release.items.length > 0 && (
        <ul style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'grid',
          gap: 7,
        }}>
          {release.items.map((item, i) => (
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

      {showDivider && (
        <div style={{
          marginTop: 14,
          borderTop: '1px solid var(--border-subtle)',
        }} />
      )}
    </section>
  );
}
