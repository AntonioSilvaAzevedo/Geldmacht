'use client';

import { useState } from 'react';
import { api, type CreditCardConfig } from '@/lib/api';
import EmptyState from '@/components/EmptyState';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  institutionName:  string;
  institutionColor: string;
  institutionAbbr:  string;
  onCreated:        (card: CreditCardConfig) => void;
}

type Step = 'empty' | 'form' | 'saving' | 'done';

// ── Overlay / container styles (espelham ManageProductModal) ─────────────────

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 9999,
  background: 'rgba(0,0,0,0.65)',
  backdropFilter: 'blur(6px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '24px 16px',
};

const containerStyle: React.CSSProperties = {
  background:   'var(--surface-1)',
  border:       '1px solid rgba(255,255,255,0.10)',
  borderRadius: 24,
  padding:      24,
  width:        '100%',
  maxWidth:     420,
  boxShadow:    '0 32px 80px rgba(0,0,0,0.75)',
  animation:    'gm-fade-up 0.18s ease both',
};

const inputStyle: React.CSSProperties = {
  padding:      '10px 13px',
  borderRadius: 9,
  border:       '1px solid rgba(255,255,255,0.10)',
  background:   'var(--surface-2)',
  color:        'var(--text-primary)',
  fontSize:     14,
  width:        '100%',
  outline:      'none',
  fontFamily:   'inherit',
  boxSizing:    'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize:        10,
  fontWeight:      700,
  letterSpacing:   '0.06em',
  textTransform:   'uppercase',
  color:           'var(--text-secondary)',
  display:         'block',
  marginBottom:    5,
};

// ── Componente ────────────────────────────────────────────────────────────────

export default function CartaoEmptyState({
  institutionName,
  institutionColor,
  institutionAbbr,
  onCreated,
}: Props) {
  const [step,        setStep]        = useState<Step>('empty');
  const [name,        setName]        = useState('');
  const [closing,     setClosing]     = useState('');
  const [due,         setDue]         = useState('');
  const [limit,       setLimit]       = useState('');
  const [err,         setErr]         = useState('');
  const [createdCard, setCreatedCard] = useState<CreditCardConfig | null>(null);

  const isSaving = step === 'saving';
  const valid    = name.trim().length >= 1 && !!closing && !!due;

  function resetForm() {
    setName(''); setClosing(''); setDue(''); setLimit(''); setErr('');
  }

  // Faz parse de string BR (ex: "15.000,50") para número
  function parseLimit(raw: string): number | null {
    const cleaned = raw.trim().replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.');
    const n = parseFloat(cleaned);
    return isNaN(n) ? null : n;
  }

  async function handleSave() {
    if (!valid || isSaving) return;
    setStep('saving');
    setErr('');
    try {
      const card = await api.createCard({
        name:         name.trim(),
        institution:  institutionName,
        closing_day:  Number(closing),
        due_day:      Number(due),
        credit_limit: limit.trim() ? parseLimit(limit) : null,
      });
      setCreatedCard(card);
      setStep('done');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao salvar. Tente novamente.');
      setStep('form');
    }
  }

  // ── Step: done ───────────────────────────────────────────────────────────────

  if (step === 'done' && createdCard) {
    const card = createdCard;
    function handleClose() { onCreated(card); setStep('empty'); }

    return (
      <div onClick={handleClose} style={overlayStyle}>
        <div onClick={e => e.stopPropagation()} style={containerStyle}>
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', textAlign: 'center',
            padding: '8px 0 0',
          }}>
            {/* Ícone ✓ */}
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: 'rgba(48,209,88,0.10)',
              border: '2px solid rgba(48,209,88,0.30)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}>
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none"
                stroke="var(--green-400, #30D158)" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <div style={{
              fontSize: 17, fontWeight: 700, letterSpacing: '-0.015em', marginBottom: 6,
            }}>
              Cartão vinculado!
            </div>

            <p style={{
              fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65,
              maxWidth: 300, margin: '0 0 22px',
            }}>
              O cartão foi adicionado a{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{institutionName}</strong>.
              {' '}Agora você pode acompanhar faturas e lançamentos.
            </p>

            {/* Botões lado a lado */}
            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
              <button
                onClick={handleClose}
                style={{
                  flex: 1, padding: '11px', borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'transparent', color: 'rgba(255,255,255,0.6)',
                  fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Fechar
              </button>
              <button
                onClick={() => { resetForm(); setStep('form'); }}
                style={{
                  flex: 1, padding: '11px', borderRadius: 10, border: 'none',
                  background: 'var(--blue-400, #0A84FF)',
                  color: '#fff', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                + Outro cartão
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Step: empty (modal fechado) ───────────────────────────────────────────────

  if (step === 'empty') {
    return (
      <EmptyState
        icon={
          <svg width={26} height={26} viewBox="0 0 24 24" fill="none"
            stroke={institutionColor} strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
        }
        title="Nenhum cartão vinculado"
        description={
          <>
            Adicione o cartão de crédito do{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{institutionName}</strong>{' '}
            para acompanhar faturas e lançamentos.
          </>
        }
        actionLabel="Adicionar cartão"
        onAction={() => setStep('form')}
      />
    );
  }

  // ── Step: form / saving ───────────────────────────────────────────────────────

  return (
    <div onClick={() => { setStep('empty'); resetForm(); }} style={overlayStyle}>
      <div onClick={e => e.stopPropagation()} style={containerStyle}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14, flexShrink: 0,
            background: institutionColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em',
          }}>
            {institutionAbbr.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>
              Novo cartão de crédito
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              {institutionName}
            </div>
          </div>
          <button
            onClick={() => { setStep('empty'); resetForm(); }}
            style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontFamily: 'inherit',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
          >
            ✕
          </button>
        </div>

        {/* Nome */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Nome do cartão</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="ex: Nubank Mastercard"
            style={inputStyle}
            autoFocus
            disabled={isSaving}
          />
        </div>

        {/* Fecha dia + Vence dia */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Fecha dia</label>
            <input
              type="number" min={1} max={31}
              value={closing}
              onChange={e => setClosing(e.target.value)}
              placeholder="4"
              style={inputStyle}
              disabled={isSaving}
            />
          </div>
          <div>
            <label style={labelStyle}>Vence dia</label>
            <input
              type="number" min={1} max={31}
              value={due}
              onChange={e => setDue(e.target.value)}
              placeholder="13"
              style={inputStyle}
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Limite */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Limite (opcional)</label>
          <input
            type="text"
            value={limit}
            onChange={e => setLimit(e.target.value)}
            placeholder="R$ 15.000"
            style={inputStyle}
            disabled={isSaving}
          />
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 5 }}>
            Deixe em branco se não souber
          </div>
        </div>

        {/* Erro inline */}
        {err && (
          <div style={{
            fontSize: 12, color: 'var(--red-400, #FF453A)',
            marginBottom: 14, padding: '8px 12px',
            background: 'rgba(255,69,58,0.08)', borderRadius: 8,
            border: '1px solid rgba(255,69,58,0.20)',
          }}>
            {err}
          </div>
        )}

        {/* Botões */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => { setStep('empty'); resetForm(); }}
            disabled={isSaving}
            style={{
              padding: '10px 16px', borderRadius: 10, flexShrink: 0,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'transparent', color: 'rgba(255,255,255,0.5)',
              fontSize: 12, fontWeight: 600,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={isSaving || !valid}
            style={{
              flex: 1, padding: '10px', borderRadius: 10, border: 'none',
              background: isSaving || !valid
                ? 'var(--surface-3, #3A3A3C)'
                : 'var(--blue-400, #0A84FF)',
              color: isSaving || !valid ? 'rgba(255,255,255,0.2)' : '#fff',
              fontSize: 13, fontWeight: 700,
              cursor: isSaving || !valid ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.12s',
            }}
          >
            {isSaving ? 'Salvando…' : 'Salvar cartão'}
          </button>
        </div>
      </div>
    </div>
  );
}
