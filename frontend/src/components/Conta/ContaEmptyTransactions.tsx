/**
 * ContaEmptyTransactions
 *
 * Exibido na aba Conta quando a conta bancária existe mas não tem
 * nenhum lançamento cadastrado ainda.
 *
 * Quando `importCtx` + `accountId` estão disponíveis, "Importar extrato"
 * abre o file picker do SO diretamente (sem passar por /upload idle).
 * O arquivo selecionado é armazenado no importStore e o usuário vai direto
 * para a tela de revisão com a conta pré-preenchida.
 *
 * Formatos aceitos: .ofx, .qfx, .csv
 */

'use client';

import { useRef, useState }       from 'react';
import { useRouter }              from 'next/navigation';
import { useLancamentoModal }     from '@/components/LancamentoModal';
import {
  setPendingImport,
  type ImportFileContext,
} from '@/lib/importStore';

// ── Constantes ────────────────────────────────────────────────────────────────

const VALID_EXTS = ['.ofx', '.qfx', '.csv'];

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  accountId:   number | null;
  /** Contexto da conta — quando presente, habilita o file picker inline. */
  importCtx?:  Omit<ImportFileContext, 'accountId'>;
  onAdd?:      () => void;   // callback após abrir modal de lançamento
  /** Fallback quando não há importCtx (ex.: ContaEmptyState sem conta). */
  onImport?:   () => void;
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function ContaEmptyTransactions({
  accountId,
  importCtx,
  onAdd,
  onImport,
}: Props) {
  const { openModal }  = useLancamentoModal();
  const router         = useRouter();
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const [formatError, setFormatError] = useState<string | null>(null);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleAddClick() {
    openModal({ bankAccountId: accountId ?? undefined });
    onAdd?.();
  }

  function handleImportClick() {
    if (importCtx && accountId != null) {
      setFormatError(null);
      fileInputRef.current?.click();
    } else {
      onImport?.();
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset → permite re-seleção do mesmo arquivo
    if (!file || !importCtx || accountId == null) return;

    const nameLower = file.name.toLowerCase();
    const valid     = VALID_EXTS.some(ext => nameLower.endsWith(ext));
    if (!valid) {
      setFormatError(
        `Formato não suportado: "${file.name}". Use OFX (.ofx/.qfx) ou CSV.`,
      );
      return;
    }

    setFormatError(null);
    setPendingImport(file, { accountId, ...importCtx });
    router.push(`/upload?type=bank_statement&bankAccountId=${accountId}`);
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{
      background:    'var(--surface-1)',
      border:        '1px solid rgba(255,255,255,0.06)',
      borderRadius:  16,
      padding:       '48px 24px 40px',
      display:       'flex',
      flexDirection: 'column',
      alignItems:    'center',
      textAlign:     'center',
    }}>

      {/* Ícone — cifrão neutro */}
      <div style={{
        width:          56,
        height:         56,
        borderRadius:   16,
        background:     'rgba(255,255,255,0.05)',
        border:         '1px solid rgba(255,255,255,0.08)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        marginBottom:   16,
        flexShrink:     0,
      }}>
        <svg width={24} height={24} viewBox="0 0 24 24" fill="none"
          stroke="var(--text-tertiary, rgba(255,255,255,0.35))"
          strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </div>

      {/* Título */}
      <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 6 }}>
        Nenhum lançamento nesta conta
      </div>

      {/* Descrição */}
      <p style={{
        fontSize:   13,
        color:      'var(--text-tertiary, rgba(255,255,255,0.38))',
        lineHeight: 1.6,
        maxWidth:   280,
        margin:     '0 0 28px',
      }}>
        Adicione um lançamento manual ou importe o extrato do seu banco para começar.
      </p>

      {/* Botões */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>

        {/* Primário — adicionar manual */}
        <button
          onClick={handleAddClick}
          style={{
            display:      'inline-flex',
            alignItems:   'center',
            gap:          7,
            padding:      '9px 18px',
            borderRadius: 9,
            border:       'none',
            background:   'var(--blue-400, #0A84FF)',
            color:        '#fff',
            fontSize:     13,
            fontWeight:   600,
            cursor:       'pointer',
            fontFamily:   'inherit',
          }}
        >
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Adicionar lançamento manual
        </button>

        {/* Ghost — importar extrato */}
        <button
          onClick={handleImportClick}
          style={{
            display:      'inline-flex',
            alignItems:   'center',
            gap:          7,
            padding:      '9px 18px',
            borderRadius: 9,
            border:       '1px solid rgba(255,255,255,0.14)',
            background:   'transparent',
            color:        'rgba(255,255,255,0.55)',
            fontSize:     13,
            fontWeight:   600,
            cursor:       'pointer',
            fontFamily:   'inherit',
          }}
        >
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Importar extrato
        </button>

      </div>

      {/* Erro de formato inline */}
      {formatError && (
        <div style={{
          marginTop:   14,
          display:     'flex',
          alignItems:  'center',
          gap:         6,
          fontSize:    12,
          color:       'var(--red-400, #FF453A)',
          maxWidth:    320,
          textAlign:   'left',
        }}>
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {formatError}
        </div>
      )}

      {/* Input oculto — file picker nativo do SO */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".ofx,.qfx,.csv"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

    </div>
  );
}
