'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, CreditCard, Upload, Edit3, Trash2, X, AlertTriangle } from 'lucide-react';
import StatePanel from '@/components/StatePanel';
import LoadingSpinner from '@/components/LoadingSpinner';
import CreditCardForm from '@/components/Cards/CreditCardForm';
import { Button } from '@/components/ui/button';
import { api, type CardInvoice, type CreditCardConfig } from '@/lib/api';
import { getOpeningDay } from '@/lib/cardDates';

interface DeleteTarget {
  card: CreditCardConfig;
  invoices?: CardInvoice[];
  loadingInfo: boolean;
}

interface Toast {
  message: string;
  type: 'success' | 'error';
}

export default function CardsPage() {
  const [cards, setCards] = useState<CreditCardConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCardConfig | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  async function loadCards() {
    setLoading(true);
    setError(null);
    try {
      setCards(await api.listCards());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar cartões.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadCards(); }, []);

  type CardFormPayload = Pick<CreditCardConfig, 'name' | 'institution' | 'closing_day' | 'due_day'> & { credit_limit: number | null };

  async function createCard(payload: CardFormPayload) {
    const card = await api.createCard(payload);
    setCards(prev => [...prev, card].sort((a, b) => a.name.localeCompare(b.name)));
    setShowCreateForm(false);
  }

  async function saveEditCard(payload: CardFormPayload) {
    if (!editingCard) return;
    // Sentinela: backend usa 0 para limpar credit_limit (vira null).
    const apiPayload = {
      ...payload,
      credit_limit: payload.credit_limit ?? 0,
    };
    const updated = await api.updateCard(editingCard.id, apiPayload);
    setCards(prev => prev.map(c => c.id === editingCard.id ? updated : c));
    setEditingCard(null);
  }

  async function handleDeleteClick(card: CreditCardConfig) {
    setDeleteTarget({ card, loadingInfo: true });
    try {
      const invoices = await api.getCardInvoices(card.id);
      setDeleteTarget(prev => prev ? { ...prev, invoices, loadingInfo: false } : null);
    } catch {
      setDeleteTarget(prev => prev ? { ...prev, loadingInfo: false } : null);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.deleteCard(deleteTarget.card.id);
      setCards(prev => prev.filter(c => c.id !== deleteTarget.card.id));
      setDeleteTarget(null);
      setToast({ message: 'Cartão e faturas excluídos com sucesso.', type: 'success' });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Erro ao excluir cartão.', type: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  }

  if (loading) {
    return (
      <>
<main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LoadingSpinner />
        </main>
      </>
    );
  }

  if (error) return <StatePanel variant="error" message={error} />;

  return (
    <>
<main style={{ padding: 24, flex: 1 }}>

        {/* Toast de feedback */}
        {toast && (
          <div style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
            padding: '12px 18px',
            borderRadius: 10,
            background: toast.type === 'success' ? 'rgba(56,161,105,0.95)' : 'rgba(229,62,62,0.95)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}>
            {toast.message}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setToast(null)}
              aria-label="Fechar notificação"
              className="h-auto w-auto border-none bg-transparent p-0 text-inherit hover:bg-transparent hover:opacity-80"
            >
              <X size={14} />
            </Button>
          </div>
        )}

        {/* Modal de confirmação de exclusão */}
        {deleteTarget && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.65)',
              zIndex: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
            onClick={e => { if (e.target === e.currentTarget && !deleteLoading) setDeleteTarget(null); }}
          >
            <div style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 16,
              padding: 28,
              maxWidth: 460,
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'rgba(229,62,62,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 2,
                }}>
                  <AlertTriangle size={20} color="var(--red-400)" />
                </div>
                <div>
                  <h2 id="delete-modal-title" style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                    Excluir cartão?
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    Essa ação não poderá ser desfeita.
                  </p>
                </div>
              </div>

              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 18, lineHeight: 1.65 }}>
                Ao excluir este cartão,{' '}
                <strong style={{ color: 'var(--text-primary)' }}>
                  todas as faturas e lançamentos vinculados
                </strong>{' '}
                a ele também serão excluídos permanentemente.
              </p>

              <div style={{
                background: 'var(--surface-panel)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 10,
                padding: '12px 16px',
                marginBottom: 22,
                display: 'grid',
                gap: 8,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Cartão</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget.card.name}</strong>
                </div>
                {deleteTarget.loadingInfo ? (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '4px 0' }}>
                    Carregando informações...
                  </div>
                ) : deleteTarget.invoices ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Faturas vinculadas</span>
                      <strong style={{ color: 'var(--red-400)' }}>{deleteTarget.invoices.length}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Lançamentos vinculados</span>
                      <strong style={{ color: 'var(--red-400)' }}>
                        {deleteTarget.invoices.reduce((sum, inv) => sum + inv.transactions_count, 0)}
                      </strong>
                    </div>
                  </>
                ) : null}
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { if (!deleteLoading) setDeleteTarget(null); }}
                  disabled={deleteLoading}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteConfirm}
                  disabled={deleteLoading || deleteTarget.loadingInfo}
                  loading={deleteLoading}
                >
                  {deleteLoading ? 'Excluindo...' : 'Excluir cartão e faturas'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo principal */}
        {cards.length === 0 && !showCreateForm ? (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 400,
          }}>
            <StatePanel variant="empty"
              title="Nenhum cartão cadastrado ainda."
              message="Adicione um cartão para começar a importar e organizar suas faturas."
              onAction={() => setShowCreateForm(true)}
              actionLabel="Adicionar cartão"
              icon={<CreditCard size={22} color="var(--blue-400)" />}
            />
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                {cards.length} cartão{cards.length !== 1 ? 'ões' : ''} cadastrado{cards.length !== 1 ? 's' : ''}
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => { setShowCreateForm(v => !v); setEditingCard(null); }}
              >
                <Plus size={15} /> Adicionar cartão
              </Button>
            </div>

            {showCreateForm && (
              <div style={{ maxWidth: 520, marginBottom: 18 }}>
                <CreditCardForm
                  submitLabel="Salvar cartão"
                  onSubmit={createCard}
                  onCancel={() => setShowCreateForm(false)}
                />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {cards.map(card => (
                <div key={card.id}>
                  <div style={{
                    background: 'var(--surface-card)',
                    border: `1px solid ${editingCard?.id === card.id ? 'var(--blue-500)' : 'var(--border-subtle)'}`,
                    borderRadius: 12,
                    overflow: 'hidden',
                    transition: 'border-color 0.15s',
                  }}>
                    <Link href={card.institution_id != null ? `/home/carteira/${card.institution_id}/cartao/faturas` : '/home/carteira'} style={{
                      display: 'block',
                      padding: '16px 18px',
                      textDecoration: 'none',
                      color: 'var(--text-primary)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {card.name}
                        </div>
                        <CreditCard size={16} color="var(--blue-400)" />
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 4 }}>
                        {card.institution || 'Instituição não informada'}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 2 }}>
                        Fecha dia {card.closing_day} · Vence dia {card.due_day}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        Abertura estimada: dia {getOpeningDay(card.closing_day)}
                      </div>
                    </Link>

                    {/* Ações do cartão */}
                    <div style={{
                      padding: '10px 14px',
                      borderTop: '1px solid var(--border-subtle)',
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}>
                      <Link
                        href={`/home/upload?type=credit_card&cardId=${card.id}`}
                        style={importLinkStyle}
                        title={`Importar fatura do cartão ${card.name}`}
                      >
                        <Upload size={12} /> Importar fatura
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-auto rounded-md px-2.5 py-1.5 text-xs"
                        onClick={() => {
                          setEditingCard(editingCard?.id === card.id ? null : card);
                          setShowCreateForm(false);
                        }}
                        title="Editar configurações do cartão"
                      >
                        <Edit3 size={12} /> Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-auto h-auto rounded-md border-[rgba(229,62,62,0.3)] px-2.5 py-1.5 text-xs text-[var(--red-400)] hover:bg-[rgba(229,62,62,0.08)]"
                        onClick={() => handleDeleteClick(card)}
                        title="Excluir cartão e faturas"
                      >
                        <Trash2 size={12} /> Excluir
                      </Button>
                    </div>
                  </div>

                  {/* Form de edição inline */}
                  {editingCard?.id === card.id && (
                    <div style={{
                      marginTop: 8,
                      background: 'var(--surface-card)',
                      border: '1px solid var(--blue-500)',
                      borderRadius: 12,
                      padding: 16,
                    }}>
                      <CreditCardForm
                        initial={editingCard}
                        submitLabel="Salvar alterações"
                        onSubmit={saveEditCard}
                        onCancel={() => setEditingCard(null)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}

const importLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '6px 10px',
  borderRadius: 6,
  background: 'var(--primary-gradient)',
  color: '#fff',
  textDecoration: 'none',
  fontSize: 12,
  fontWeight: 600,
};
