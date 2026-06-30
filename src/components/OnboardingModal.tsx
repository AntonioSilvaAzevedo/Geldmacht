'use client';

import {
  CreditCard, FileText, ListChecks, Tags, Target, Layers,
  BarChart3, Sparkles,
} from 'lucide-react';
import ModalDialog from '@/components/ui/ModalDialog';
import { Button } from '@/components/ui/button';

interface OnboardingModalProps {
  /** Chamado ao fechar o modal (X, overlay, Esc, "Pular"). */
  onClose: () => void;
  /** Chamado ao clicar no botão principal. Por padrão também marca como visto. */
  onComplete: () => void;
}

/**
 * Modal de boas-vindas exibido apenas para usuários que ainda não viram
 * o onboarding inicial.
 *
 * - Conteúdo curto, com tópicos do que o sistema faz hoje.
 * - Botão "Pular" e botão "Começar" disparam o mesmo fluxo (marcar como visto).
 * - Esc / overlay / X também marcam como visto, evitando reabrir.
 */
export default function OnboardingModal({ onClose, onComplete }: OnboardingModalProps) {
  return (
    <ModalDialog onClose={onClose} ariaLabelledBy="onboarding-title" zIndex={250}>
      {/* Header */}
      <div style={{
        padding: '22px 24px 18px',
        background: 'linear-gradient(135deg, rgba(49,130,206,0.20) 0%, rgba(44,122,123,0.14) 100%)',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'var(--primary-gradient)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 14px rgba(49,130,206,0.35)',
          }}>
            <Sparkles size={19} color="#fff" />
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 10.5, color: 'var(--text-muted)',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              fontFamily: 'var(--font-mono)',
            }}>
              Primeiro acesso
            </div>
            <h2 id="onboarding-title" style={{
              margin: '4px 0 0',
              fontSize: 18, fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}>
              Bem-vindo ao Geldmacht
            </h2>
            <p style={{
              margin: '6px 0 0',
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}>
              Organize seus cartões, faturas e categorias em um só lugar.
            </p>
          </div>
        </div>
      </div>

      {/* Tópicos */}
      <div style={{
        padding: '18px 24px 8px',
        overflowY: 'auto',
        flex: 1,
      }}>
        <div style={{
          fontSize: 11.5,
          color: 'var(--text-muted)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          marginBottom: 10,
          fontWeight: 600,
        }}>
          O que você já pode fazer
        </div>

        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
          <FeatureItem
            icon={<CreditCard size={14} color="var(--blue-400)" />}
            text="Cadastre seus cartões de crédito."
          />
          <FeatureItem
            icon={<FileText size={14} color="var(--blue-400)" />}
            text="Importe faturas em PDF."
          />
          <FeatureItem
            icon={<ListChecks size={14} color="var(--blue-400)" />}
            text="Revise os lançamentos antes de salvar."
          />
          <FeatureItem
            icon={<Tags size={14} color="var(--blue-400)" />}
            text="Categorize seus gastos com categorias e subcategorias."
          />
          <FeatureItem
            icon={<Target size={14} color="var(--blue-400)" />}
            text="Defina limites de gasto por categoria."
          />
          <FeatureItem
            icon={<Layers size={14} color="var(--blue-400)" />}
            text="Acompanhe compras parceladas e parcelas futuras."
          />
          <FeatureItem
            icon={<BarChart3 size={14} color="var(--blue-400)" />}
            text="Veja dashboards com resumo dos seus cartões."
          />
        </ul>

        <div style={{
          marginTop: 16,
          padding: '10px 12px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px dashed var(--border-subtle)',
          borderRadius: 8,
          fontSize: 12,
          color: 'var(--text-muted)',
          lineHeight: 1.5,
        }}>
          Algumas áreas, como o dashboard geral, ainda estão em desenvolvimento.
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '14px 24px 18px',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 8,
        borderTop: '1px solid var(--border-subtle)',
      }}>
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Pular
        </Button>
        <Button type="button" variant="primary" size="sm" onClick={onComplete}>
          Começar
        </Button>
      </div>
    </ModalDialog>
  );
}

function FeatureItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li style={{
      display: 'flex', gap: 10, alignItems: 'flex-start',
      fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5,
    }}>
      <span style={{
        width: 26, height: 26, borderRadius: 7,
        background: 'rgba(49,130,206,0.10)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: -2,
      }}>
        {icon}
      </span>
      <span style={{ paddingTop: 4 }}>{text}</span>
    </li>
  );
}
