'use client';

import { useState } from 'react';
import { api, type CreditCardConfig } from '@/lib/api';

interface Props {
  institutionName: string;
  institutionColor: string;
  institutionAbbr: string;
  onClose: () => void;
  onCreated: (card: CreditCardConfig) => void;
}

type Step = 'form' | 'saving' | 'done';

interface FormFields {
  name: string;
  closing: string;
  due: string;
  limit: string;
}

const EMPTY_FIELDS: FormFields = { name: '', closing: '', due: '', limit: '' };

const INPUT_CLASS =
  'w-full rounded-[9px] border border-[var(--border-default)] bg-[var(--surface-2)] px-[13px] py-[10px] text-[14px] text-[var(--text-primary)] outline-none disabled:opacity-60';
const LABEL_CLASS =
  'mb-[5px] block text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--text-secondary)]';

function parseLimit(raw: string): number | null {
  const cleaned = raw.trim().replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

export default function CardFormModal({
  institutionName,
  institutionColor,
  institutionAbbr,
  onClose,
  onCreated,
}: Props) {
  const [step, setStep] = useState<Step>('form');
  const [fields, setFields] = useState<FormFields>(EMPTY_FIELDS);
  const [err, setErr] = useState('');
  const [createdCard, setCreatedCard] = useState<CreditCardConfig | null>(null);

  const isSaving = step === 'saving';
  const valid = fields.name.trim().length >= 1 && !!fields.closing && !!fields.due;

  function setField(key: keyof FormFields, value: string) {
    setFields(prev => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!valid || isSaving) return;
    setStep('saving');
    setErr('');
    try {
      const card = await api.createCard({
        name:         fields.name.trim(),
        institution:  institutionName,
        closing_day:  Number(fields.closing),
        due_day:      Number(fields.due),
        credit_limit: fields.limit.trim() ? parseLimit(fields.limit) : null,
      });
      onCreated(card);
      setCreatedCard(card);
      setStep('done');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao salvar. Tente novamente.');
      setStep('form');
    }
  }

  if (step === 'done' && createdCard) {
    return (
      <div
        onClick={onClose}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/65 px-4 py-6 backdrop-blur-md"
      >
        <div
          onClick={e => e.stopPropagation()}
          className="w-full max-w-[420px] rounded-[24px] border border-[var(--border-default)] bg-[var(--surface-1)] p-6 shadow-[var(--shadow-modal)] [animation:gm-fade-up_0.18s_ease_both]"
        >
          <div className="flex flex-col items-center pt-2 text-center">
            <div className="mb-4 flex size-[60px] items-center justify-center rounded-full border-2 border-[var(--green)]/30 bg-[var(--green)]/10">
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none"
                stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <div className="mb-[6px] text-[17px] font-bold tracking-[-0.015em]">Cartão vinculado!</div>

            <p className="mb-[22px] max-w-[300px] text-[13px] leading-[1.65] text-[var(--text-secondary)]">
              O cartão foi adicionado a{' '}
              <strong className="text-[var(--text-primary)]">{institutionName}</strong>. Agora você
              pode acompanhar faturas e lançamentos.
            </p>

            <div className="flex w-full gap-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-[10px] border border-[var(--border-default)] py-[11px] text-[13px] font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)]"
              >
                Fechar
              </button>
              <button
                onClick={() => { setFields(EMPTY_FIELDS); setErr(''); setCreatedCard(null); setStep('form'); }}
                className="flex-1 rounded-[10px] bg-[var(--blue)] py-[11px] text-[13px] font-bold text-white"
              >
                + Outro cartão
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/65 px-4 py-6 backdrop-blur-md"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-[420px] rounded-[24px] border border-[var(--border-default)] bg-[var(--surface-1)] p-6 shadow-[var(--shadow-modal)] [animation:gm-fade-up_0.18s_ease_both]"
      >
        <div className="mb-5 flex items-center gap-[10px]">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-[14px] text-[15px] font-extrabold tracking-[-0.02em] text-white"
            style={{ background: institutionColor }}
          >
            {institutionAbbr.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-bold tracking-[-0.01em]">Novo cartão de crédito</div>
            <div className="mt-[2px] text-[12px] text-[var(--text-secondary)]">{institutionName}</div>
          </div>
          <button
            onClick={onClose}
            className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] border border-[var(--border-default)] bg-white/[0.06] text-[14px] text-[var(--text-secondary)] transition-colors hover:bg-white/[0.1]"
          >
            ✕
          </button>
        </div>

        <div className="mb-3">
          <label className={LABEL_CLASS}>Nome do cartão</label>
          <input
            value={fields.name}
            onChange={e => setField('name', e.target.value)}
            placeholder="ex: Nubank Mastercard"
            className={INPUT_CLASS}
            autoFocus
            disabled={isSaving}
          />
        </div>

        <div className="mb-3 grid grid-cols-2 gap-[10px]">
          <div>
            <label className={LABEL_CLASS}>Fecha dia</label>
            <input
              type="number" min={1} max={31}
              value={fields.closing}
              onChange={e => setField('closing', e.target.value)}
              placeholder="4"
              className={INPUT_CLASS}
              disabled={isSaving}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Vence dia</label>
            <input
              type="number" min={1} max={31}
              value={fields.due}
              onChange={e => setField('due', e.target.value)}
              placeholder="13"
              className={INPUT_CLASS}
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className={LABEL_CLASS}>Limite (opcional)</label>
          <input
            type="text"
            value={fields.limit}
            onChange={e => setField('limit', e.target.value)}
            placeholder="R$ 15.000"
            className={INPUT_CLASS}
            disabled={isSaving}
          />
          <div className="mt-[5px] text-[11px] text-[var(--text-secondary)]">
            Deixe em branco se não souber
          </div>
        </div>

        {err && (
          <div className="mb-[14px] rounded-[8px] border border-[var(--red)]/20 bg-[var(--red)]/[0.08] px-3 py-2 text-[12px] text-[var(--red)]">
            {err}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="shrink-0 rounded-[10px] border border-[var(--border-default)] px-4 py-[10px] text-[12px] font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={isSaving || !valid}
            className="flex-1 rounded-[10px] py-[10px] text-[13px] font-bold text-white transition-colors disabled:cursor-not-allowed disabled:bg-[var(--surface-3)] disabled:text-[var(--text-quaternary)] enabled:bg-[var(--blue)]"
          >
            {isSaving ? 'Salvando…' : 'Salvar cartão'}
          </button>
        </div>
      </div>
    </div>
  );
}
