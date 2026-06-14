'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { CategoryChoiceSelect } from '@/components/category-choice-select';
import { useInstitution } from '@/components/carteira/institution-context';
import StatePanel from '@/components/StatePanel';
import LoadingSpinner from '@/components/LoadingSpinner';
import CategoryIcon  from '@/components/CategoryIcon';
import { Button } from '@/components/ui/button';
import {
  api, type CardInvoice, type CardInvoiceDetail,
  type CreditCardConfig, type Category,
} from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/formatters';
import type { Transaction } from '@/types/financial';
import { useIsMobile } from '@/hooks/useIsMobile';

interface PageProps { params: Promise<{ slug: string; invoiceId: string }> }

// ─── Month helpers ─────────────────────────────────────────────────────────────
const MONTH_FULL: Record<string,string> = {
  '01':'Janeiro','02':'Fevereiro','03':'Março','04':'Abril',
  '05':'Maio','06':'Junho','07':'Julho','08':'Agosto',
  '09':'Setembro','10':'Outubro','11':'Novembro','12':'Dezembro',
};
const MONTH_SHORT: Record<string,string> = {
  '01':'Jan','02':'Fev','03':'Mar','04':'Abr','05':'Mai','06':'Jun',
  '07':'Jul','08':'Ago','09':'Set','10':'Out','11':'Nov','12':'Dez',
};
function fullLabel(m:string)  { const [y,mo]=m.split('-'); return `${MONTH_FULL[mo]??mo} ${y}`; }
function shortLabel(inv: CardInvoice) { const [y,mo]=inv.due_month.split('-'); return `${MONTH_SHORT[mo]??mo}/${y.slice(-2)}`; }

function isSystemic(tx: Transaction): boolean {
  if (tx.is_payment) return true;
  if (tx.installment_current != null && tx.installment_total != null && tx.installment_total > 1) return true;
  return false;
}

// ─── CategoryGroup (mesma estrutura do CategoryGrid) ─────────────────────────
interface CategoryGroup {
  key: string; label: string; icon: string|null;
  total: number; budgetLimit: number|null; transactions: Transaction[];
}

// ─── InvoiceNavBar ─────────────────────────────────────────────────────────────
function InvoiceNavBar({
  prev, current, next, onPrev, onNext, isMobile,
}: {
  prev:    CardInvoice | null;
  current: CardInvoice;
  next:    CardInvoice | null;
  onPrev:  () => void;
  onNext:  () => void;
  isMobile: boolean;
}) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:8,
      padding:'12px 0 16px', userSelect:'none',
    }}>
      <Button
        variant="outline"
        size="sm"
        disabled={!prev}
        type="button"
        onClick={onPrev}
        className="inline-flex min-h-9 flex-1 shrink font-medium sm:flex-none [&_svg]:shrink-0"
      >
        <ChevronLeft className="size-3.5" />
        {!isMobile && (prev ? shortLabel(prev) : '—')}
      </Button>

      <div style={{ flex:1, textAlign:'center' }}>
        <div style={{ fontSize:isMobile?15:16, fontWeight:700, letterSpacing:'-0.01em' }}>
          {fullLabel(current.due_month)}
        </div>
        {current.due_date && (
          <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>
            Vence {formatDate(current.due_date)}
          </div>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        disabled={!next}
        type="button"
        onClick={onNext}
        className="inline-flex min-h-9 flex-1 shrink justify-end font-medium sm:flex-none [&_svg]:shrink-0"
      >
        {!isMobile && (next ? shortLabel(next) : '—')}
        <ChevronRight className="size-3.5" />
      </Button>
    </div>
  );
}

// ─── InvoiceHero ───────────────────────────────────────────────────────────────
function InvoiceHero({
  invoice, summary,
}: {
  invoice: CardInvoiceDetail;
  summary: CardInvoiceDetail['summary'];
}) {
  const hasPdf   = invoice.total_amount != null;
  const total    = hasPdf ? invoice.total_amount! : summary.total_invoice;
  const isPaid   = summary.payment_amount > 0;

  return (
    <div style={{
      background:'var(--surface-card)', border:'1px solid var(--border-subtle)',
      borderRadius:20, padding:'22px 22px 18px', marginBottom:14,
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.09em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:6 }}>
            {hasPdf ? 'Total da fatura (PDF)' : 'Soma dos lançamentos'}
          </div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:32, fontWeight:700, color:'var(--red-400)', letterSpacing:'-0.03em', lineHeight:1 }}>
            {formatCurrency(total)}
          </div>
        </div>

        <div style={{ textAlign:'right' }}>
          {isPaid ? (
            <>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--green-400)', background:'rgba(48,209,88,0.12)', borderRadius:6, padding:'3px 8px' }}>
                Paga
              </span>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:13, color:'var(--green-400)', marginTop:6 }}>
                {formatCurrency(summary.payment_amount)}
              </div>
            </>
          ) : (
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--orange-400,#FF9F0A)', background:'rgba(255,159,10,0.12)', borderRadius:6, padding:'3px 8px' }}>
              Em aberto
            </span>
          )}
        </div>
      </div>

      {/* Context chips */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {invoice.cycle_start_date && invoice.cycle_end_date && (
          <Chip icon="📅" label={`${formatDate(invoice.cycle_start_date)} — ${formatDate(invoice.cycle_end_date)}`} />
        )}
        {invoice.due_date && (
          <Chip icon="🕐" label={`Vence ${formatDate(invoice.due_date)}`} />
        )}
        <Chip icon="☰" label={`${invoice.transactions.length} lançamentos`} />
      </div>
    </div>
  );
}

function Chip({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{
      display:'inline-flex', alignItems:'center', gap:6,
      background:'var(--surface-2)', borderRadius:8, padding:'6px 10px',
      fontSize:12, color:'var(--text-secondary)',
    }}>
      <span style={{ fontSize:11 }}>{icon}</span>
      {label}
    </div>
  );
}

// ─── SummaryStrip ─────────────────────────────────────────────────────────────
function SummaryStrip({
  summary, groups, isMobile,
}: {
  summary: CardInvoiceDetail['summary'];
  groups: CategoryGroup[];
  isMobile: boolean;
}) {
  const topCat = groups[0];
  const cols = isMobile ? '1fr 1fr' : 'repeat(3,1fr)';

  return (
    <div style={{
      display:'grid', gridTemplateColumns:cols,
      background:'var(--surface-card)', border:'1px solid var(--border-subtle)',
      borderRadius:14, overflow:'hidden', marginBottom:14,
    }}>
      {[
        {
          label:'Maior categoria',
          value: topCat?.label ?? '—',
          sub:   topCat ? formatCurrency(topCat.total) : undefined,
          color:'var(--text-primary)',
        },
        {
          label:'Maior gasto',
          value: formatCurrency(summary.largest_expense),
          sub:   summary.largest_expense_description.slice(0,28),
          color:'var(--red-400)',
        },
        {
          label:'Parcelas futuras',
          value: formatCurrency(summary.future_commitment),
          color:'var(--blue-400)',
        },
      ].map((s,i,arr) => (
        <div key={i} style={{
          padding:'12px 14px',
          borderRight: i<arr.length-1 ? '1px solid var(--border-subtle)' : 'none',
          borderBottom: isMobile && i===0 ? '1px solid var(--border-subtle)' : 'none',
          gridColumn: isMobile && i===2 ? 'span 2' : 'auto',
        }}>
          <div style={{ fontSize:9, fontWeight:600, letterSpacing:'0.07em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:5 }}>
            {s.label}
          </div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700, color:s.color, letterSpacing:'-0.01em', lineHeight:1.2 }}>
            {s.value}
          </div>
          {s.sub && <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:3 }}>{s.sub}</div>}
        </div>
      ))}
    </div>
  );
}

// ─── CategoryBreakdown ────────────────────────────────────────────────────────
function CategoryBreakdown({
  groups, total, onRecategorize,
}: {
  groups: CategoryGroup[];
  total: number;
  onRecategorize: (txId: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [openGroup, setOpenGroup] = useState<string|null>(null);
  const visible = expanded ? groups : groups.slice(0,4);

  return (
    <section style={{ marginBottom:14 }}>
      <div style={{
        background:'var(--surface-card)', border:'1px solid var(--border-subtle)',
        borderRadius:16, overflow:'hidden',
      }}>
        <div style={{ padding:'13px 16px', borderBottom:'1px solid var(--border-subtle)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:13, fontWeight:600 }}>Categorias</span>
          <span style={{ fontSize:11, color:'var(--text-muted)' }}>{groups.length} categorias</span>
        </div>

        <div style={{ padding:'8px 0' }}>
          {visible.map(group => {
            const pct = total > 0 ? (group.total/total)*100 : 0;
            const isOpen = openGroup === group.key;
            return (
              <div key={group.key}>
                {/* Category row */}
                <Button
                  type="button"
                  variant="ghost"
                  className="inline-flex h-auto w-full flex-col items-stretch gap-1.5 rounded-none px-4 py-2.5 text-left font-normal normal-case"
                  onClick={() => setOpenGroup(isOpen ? null : group.key)}
                >
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      {group.icon ? (
                        <div style={{ width:28, height:28, borderRadius:8, background:'rgba(49,130,206,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <CategoryIcon icon={group.icon} size={13} color="var(--blue-400)" />
                        </div>
                      ) : (
                        <div style={{ width:8, height:8, borderRadius:'50%', background:'rgba(255,255,255,0.2)', flexShrink:0 }} />
                      )}
                      <span style={{ fontSize:13, fontWeight:500 }}>{group.label}</span>
                      <span style={{ fontSize:11, color:'var(--text-muted)' }}>{group.transactions.length} itens</span>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <span style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>
                        {formatCurrency(group.total)}
                      </span>
                      <span style={{ fontSize:11, color:'var(--text-muted)', marginLeft:6 }}>
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height:3, background:'var(--surface-3)', borderRadius:2, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, borderRadius:2, transition:'width 0.4s ease',
                      background: group.key==='uncategorized' ? 'rgba(255,255,255,0.2)' : 'var(--blue-400)' }} />
                  </div>
                  {/* Budget warning */}
                  {group.budgetLimit && group.total > group.budgetLimit && (
                    <div style={{ fontSize:10, color:'var(--red-400)', marginTop:4 }}>
                      Limite ultrapassado (+{formatCurrency(group.total - group.budgetLimit)})
                    </div>
                  )}
                </Button>

                {/* Transactions (expandable) */}
                {isOpen && (
                  <div style={{ borderTop:'1px solid var(--border-subtle)', background:'rgba(255,255,255,0.02)' }}>
                    {group.transactions.map((tx, i) => (
                      <div key={tx.id} style={{
                        display:'flex', alignItems:'center', gap:10,
                        padding:'10px 16px',
                        borderBottom: i<group.transactions.length-1 ? '1px solid var(--border-subtle)' : 'none',
                      }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:12, fontWeight:500, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {tx.description}
                          </div>
                          <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>
                            {formatDate(tx.date)}
                          </div>
                        </div>
                        <div style={{ textAlign:'right', flexShrink:0 }}>
                          <div style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:600, color:'var(--red-400)' }}>
                            {formatCurrency(Math.abs(tx.amount))}
                          </div>
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="mt-0.5 !px-0 !py-0 text-[10px]"
                            onClick={e => { e.stopPropagation(); onRecategorize(tx.id); }}
                          >
                            Categoria
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {groups.length > 4 && (
          <div style={{ padding:'10px 16px', borderTop:'1px solid var(--border-subtle)', textAlign:'center' }}>
            <Button type="button" variant="link" size="sm" onClick={() => setExpanded(v=>!v)}>
              {expanded ? 'Mostrar menos' : `Ver mais ${groups.length-4} categorias`}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── InstallmentsAccordion ────────────────────────────────────────────────────
function InstallmentsAccordion({ transactions }: { transactions: Transaction[] }) {
  const [open, setOpen] = useState(false);
  const installments = transactions.filter(tx =>
    tx.amount < 0 && tx.installment_current != null &&
    tx.installment_total != null && tx.installment_total > 1
  );
  if (!installments.length) return null;

  const totalHere = installments.reduce((s,tx) => s + Math.abs(tx.amount), 0);

  return (
    <section style={{ marginBottom:14 }}>
      <div style={{ background:'var(--surface-card)', border:'1px solid var(--border-subtle)', borderRadius:16, overflow:'hidden' }}>
        <Button
          type="button"
          variant="ghost"
          className="h-auto min-h-[52px] w-full justify-between gap-3 rounded-none px-4 py-3 font-normal [&_svg]:shrink-0"
          onClick={() => setOpen(v=>!v)}
        >
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <ChevronRight size={13} style={{ transform:open?'rotate(90deg)':'none', transition:'transform 0.15s', color:'var(--text-muted)' }} />
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>Compras parceladas</div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>
                {installments.length} lançamento{installments.length>1?'s':''} nesta fatura
              </div>
            </div>
          </div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:14, fontWeight:700, color:'var(--blue-400)' }}>
            {formatCurrency(totalHere)}
          </div>
        </Button>

        {open && (
          <div style={{ borderTop:'1px solid var(--border-subtle)', padding:'10px 16px 14px' }}>
            {installments.map((tx,i) => {
              const future = (tx.installment_total??0) - (tx.installment_current??0);
              const pct = ((tx.installment_current??0)/(tx.installment_total??1))*100;
              return (
                <div key={tx.id} style={{
                  background:'rgba(10,132,255,0.06)', border:'1px solid rgba(10,132,255,0.15)',
                  borderRadius:12, padding:'12px 14px',
                  marginBottom: i<installments.length-1?8:0,
                }}>
                  <div style={{ display:'flex', justifyContent:'space-between', gap:12, marginBottom:8 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {tx.description}
                      </div>
                      <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:3 }}>
                        Parcela{' '}
                        <span style={{ fontFamily:'var(--font-mono)', color:'var(--blue-400)', fontWeight:600 }}>
                          {tx.installment_current} de {tx.installment_total}
                        </span>
                        {future===0 && <span style={{ color:'var(--green-400)', marginLeft:6 }}>· Última ✓</span>}
                        {future>0 && <span style={{ color:'var(--orange-400,#FF9F0A)', marginLeft:6 }}>· {future} restante{future>1?'s':''}</span>}
                      </div>
                    </div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700, color:'var(--red-400)', flexShrink:0 }}>
                      {formatCurrency(Math.abs(tx.amount))}
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height:3, background:'var(--surface-3)', borderRadius:2, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:'var(--blue-400)', borderRadius:2 }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function InvoiceDetailPage({ params }: PageProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { invoiceId } = use(params);
  const { slug, cards } = useInstitution();
  const cid = cards[0]?.id ?? 0, iid = Number(invoiceId);

  const [card, setCard]           = useState<CreditCardConfig|null>(null);
  const [invoice, setInvoice]     = useState<CardInvoiceDetail|null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allInvoices, setAllInvoices] = useState<CardInvoice[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string|null>(null);
  const [recatModal, setRecatModal] = useState<{txId:number;categoryId:number|null}|null>(null);
  const [recatSaving, setRecatSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [c, inv, cats, invList] = await Promise.all([
        api.getCard(cid),
        api.getCardInvoiceDetail(cid, iid),
        api.listCategories('credit_card', cid),
        api.getCardInvoices(cid),
      ]);
      setCard(c); setInvoice(inv); setCategories(cats); setAllInvoices(invList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar fatura.');
    } finally { setLoading(false); }
  }, [cid, iid]);

  useEffect(() => { void load(); }, [load]);

  // Navigation
  const sorted = useMemo(() => [...allInvoices].sort((a,b) => a.due_month.localeCompare(b.due_month)), [allInvoices]);
  const idx    = useMemo(() => sorted.findIndex(i => i.id===iid), [sorted, iid]);
  const current = sorted[idx] ?? null;
  const prev    = idx > 0 ? sorted[idx-1] : null;
  const next    = idx < sorted.length-1 ? sorted[idx+1] : null;

  // Categories
  const catById = useMemo(() => { const m=new Map<number,Category>(); categories.forEach(c=>m.set(c.id,c)); return m; }, [categories]);

  const groups = useMemo<CategoryGroup[]>(() => {
    if (!invoice) return [];
    const map = new Map<string,CategoryGroup>();
    invoice.transactions.filter(tx => tx.amount<0 && !isSystemic(tx)).forEach(tx => {
      const cat   = tx.category_id!=null ? catById.get(tx.category_id)??null : null;
      const label = tx.category_display_label ?? cat?.name ?? tx.category_name ?? tx.category ?? 'Sem categoria';
      const key   = tx.category_id!=null ? `c-${tx.category_id}` : 'uncategorized';
      const cur   = map.get(key) ?? { key, label, icon:cat?.icon??null, total:0, budgetLimit:cat?.invoice_budget_limit??null, transactions:[] };
      cur.total  += Math.abs(tx.amount);
      cur.transactions.push(tx);
      map.set(key, cur);
    });
    return [...map.values()].sort((a,b) => b.total-a.total);
  }, [invoice, catById]);

  const catTotal = useMemo(() => groups.reduce((s,g)=>s+g.total,0), [groups]);

  const categoryChoiceOptions = useMemo(() =>
    categories.map(c => {
      let label = c.name;
      const parent = c.parent_id!=null ? catById.get(c.parent_id) : undefined;
      if (parent) label = `${parent.name} / ${c.name}`;
      return { id:c.id, label, icon:c.icon };
    })
  , [categories, catById]);

  const saveRecat = useCallback(async () => {
    if (!recatModal) return;
    setRecatSaving(true);
    try {
      await api.updateTransaction(recatModal.txId, { category_id: recatModal.categoryId??undefined });
      await load(); setRecatModal(null);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Não foi possível alterar a categoria.');
    } finally { setRecatSaving(false); }
  }, [recatModal, load]);

  const navigate = (inv: CardInvoice) => router.push(`/home/carteira/${slug}/cartao/faturas/${inv.id}`);

  if (loading) return <div className="flex flex-1 items-center justify-center"><LoadingSpinner /></div>;
  if (error)   return <StatePanel variant="error" message={error} />;
  if (!card || !invoice) return <StatePanel variant="error" message="Fatura não encontrada." />;
  if (!invoice.transactions.length) return (
    <StatePanel variant="empty" title="Nenhum lançamento nesta fatura." message="" actionHref={`/home/carteira/${slug}/cartao/faturas`} actionLabel="Voltar às faturas" />
  );

  const summary = invoice.summary;

  return (
    <div>

      {sorted.length > 1 && current ? (
        <div style={{ marginBottom: 14 }}>
          <InvoiceNavBar
            prev={prev} current={current} next={next}
            onPrev={() => prev && navigate(prev)}
            onNext={() => next && navigate(next)}
            isMobile={isMobile}
          />
        </div>
      ) : null}

      {/* Hero */}
      <InvoiceHero invoice={invoice} summary={summary} />

      {/* Payment received */}
      {summary.payment_amount > 0 && (
        <div style={{
          background:'rgba(48,209,88,0.1)', border:'1px solid rgba(48,209,88,0.25)',
          borderRadius:14, padding:'13px 16px', marginBottom:14,
          display:'flex', justifyContent:'space-between', alignItems:'center',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <TrendingUp size={15} color="var(--green-400)" />
            <div>
              <div style={{ fontSize:13, fontWeight:600 }}>Pagamento recebido</div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>{summary.payment_description}</div>
            </div>
          </div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:14, fontWeight:700, color:'var(--green-400)' }}>
            {formatCurrency(summary.payment_amount)}
          </div>
        </div>
      )}

      {/* Summary strip */}
      <SummaryStrip summary={summary} groups={groups} isMobile={isMobile} />

      {/* Categories */}
      <CategoryBreakdown groups={groups} total={catTotal} onRecategorize={txId => {
        const tx = invoice.transactions.find(t=>t.id===txId);
        setRecatModal({ txId, categoryId:tx?.category_id??null });
      }} />

      {/* Installments */}
      <InstallmentsAccordion transactions={invoice.transactions} />

      {/* Recategorization modal */}
      {recatModal && (
        <div role="dialog" aria-modal="true" onClick={e => { if(e.target===e.currentTarget && !recatSaving) setRecatModal(null); }}
          style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.65)', display:'flex', alignItems:'center', justifyContent:'center', padding:'var(--inset-screen)' }}>
          <div onClick={e=>e.stopPropagation()} style={{ width:'100%', maxWidth:400, background:'var(--surface-card)', borderRadius:'var(--radius-lg)', border:'1px solid var(--border-subtle)', padding:'var(--space-5)', boxShadow:'var(--shadow-modal)' }}>
            <h2 style={{ margin:'0 0 var(--space-4)', fontSize:17, fontWeight:700 }}>Alterar categoria</h2>
            <CategoryChoiceSelect
              value={recatModal.categoryId} options={categoryChoiceOptions} emptyLabel="Sem categoria"
              onChange={id => setRecatModal(r => r ? {...r, categoryId:id} : null)}
            />
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:22 }}>
              <Button type="button" variant="outline" size="default" disabled={recatSaving} onClick={()=>setRecatModal(null)}>
                Cancelar
              </Button>
              <Button type="button" variant="primary" loading={recatSaving} onClick={()=>void saveRecat()}>
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
