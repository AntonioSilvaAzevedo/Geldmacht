'use client';

/**
 * EditableDescription
 *
 * Renderiza uma descrição de transação com edição inline.
 * - Exibe ícone de lápis ao passar o mouse
 * - Clique no ícone (ou na descrição) entra em modo de edição
 * - Enter ou blur salva; Escape cancela
 * - Mostra spinner enquanto o onSave assíncrono está pendente
 */

import { useState, useRef, type KeyboardEvent, type CSSProperties } from 'react';
import { Pencil, Loader2 } from 'lucide-react';

interface Props {
  value: string;
  /** Chamado quando o usuário confirma uma nova descrição.
   *  Pode ser async (chama API) ou sync (atualiza estado local). */
  onSave: (newValue: string) => Promise<void> | void;
  /** Estilos opcionais para o texto exibido. */
  textStyle?: CSSProperties;
}

export default function EditableDescription({ value, onSave, textStyle }: Props) {
  const [editing, setEditing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [draft,   setDraft]   = useState('');
  const [saving,  setSaving]  = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Entrar em modo edição ─────────────────────────────────────────────────
  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraft(value);
    setEditing(true);
  };

  // ── Cancelar ──────────────────────────────────────────────────────────────
  const cancel = () => {
    setEditing(false);
    setDraft('');
  };

  // ── Salvar ────────────────────────────────────────────────────────────────
  const save = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === value) {
      cancel();
      return;
    }
    setSaving(true);
    try {
      await onSave(trimmed);
      setEditing(false);
    } catch {
      // Em caso de erro de API, mantemos o valor anterior
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter')  { e.preventDefault(); save(); }
    if (e.key === 'Escape') { e.preventDefault(); cancel(); }
  };

  // ── Modo edição ───────────────────────────────────────────────────────────
  if (editing) {
    return (
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}
        onClick={e => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 13,
            color: 'var(--text-primary)',
            background: 'var(--navy-800)',
            border: '1px solid var(--blue-500)',
            borderRadius: 5,
            padding: '2px 7px',
            outline: 'none',
            fontFamily: 'inherit',
            ...textStyle,
          }}
        />
        {saving && (
          <Loader2
            size={12}
            style={{
              color: 'var(--text-muted)',
              flexShrink: 0,
              animation: 'spin 1s linear infinite',
            }}
          />
        )}
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Modo visualização ─────────────────────────────────────────────────────
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 5, width: '100%', cursor: 'default' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
          ...textStyle,
        }}
      >
        {value}
      </span>
      <button
        onClick={startEdit}
        title="Editar descrição"
        tabIndex={-1}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          padding: '2px 3px',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.12s',
          borderRadius: 4,
        }}
      >
        <Pencil size={11} />
      </button>
    </div>
  );
}
