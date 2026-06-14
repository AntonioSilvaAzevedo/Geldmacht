"use client";

import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  api,
  type Category,
  type CategoryPayload,
  type CategoryUpdatePayload,
  type CreditCardConfig,
} from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Tags,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

// ─── Color palette ─────────────────────────────────────────────────────────────
const PALETTE = [
  "#FF9F0A",
  "#0A84FF",
  "#BF5AF2",
  "#30D158",
  "#FF453A",
  "#5AC8FA",
  "#5E5CE6",
  "#FF6B00",
  "#34C759",
  "#FF375F",
];
const ICONS = [
  "🍽️",
  "🛍️",
  "📱",
  "💊",
  "🚗",
  "🎮",
  "🏠",
  "💼",
  "🤝",
  "📈",
  "✈️",
  "🎓",
  "📋",
  "🛒",
  "☕",
  "🎬",
  "💻",
  "⚡",
  "🔑",
  "🏥",
  "🎵",
  "🎨",
  "🐾",
  "👶",
  "🌍",
];

function resolveColor(cat: Category, idx: number): string {
  return cat.color ?? PALETTE[idx % PALETTE.length];
}

type Scope = "credit_card" | "bank";
type FormMode = null | "new-parent" | "new-sub" | "edit";

interface FormState {
  name: string;
  icon: string;
  color: string;
  scope: Scope;
  cardId: number | null;
  parentId: number | null;
  budgetLimit: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  icon: "📁",
  color: PALETTE[0],
  scope: "credit_card",
  cardId: null,
  parentId: null,
  budgetLimit: "",
};



// ─── Category Card ─────────────────────────────────────────────────────────────
function CategoryCard({
  cat,
  idx,
  subs,
  domain,
  cards,
  onEdit,
  onDelete,
  onAddSub,
  onDeleteSub,
}: {
  cat: Category;
  idx: number;
  subs: Category[];
  domain: Scope;
  cards: CreditCardConfig[];
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
  onAddSub: (c: Category) => void;
  onDeleteSub: (sub: Category) => void;
}) {
  const [subsOpen, setSubsOpen] = useState(false);
  const [hov, setHov] = useState(false);
  const color = resolveColor(cat, idx);
  const hasLimit =
    cat.invoice_budget_limit != null && cat.invoice_budget_limit > 0;

  const cardLabel = cat.card_id
    ? (cards.find((c) => c.id === cat.card_id)?.name ??
      `Cartão #${cat.card_id}`)
    : "Todos os cartões";

  return (
    <div
      style={{
        background: "var(--surface-card)",
        border: `1px solid ${hov ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.06)"}`,
        borderRadius: 16,
        overflow: "hidden",
        transition: "border-color 0.12s",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Main row */}
      <div
        style={{
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        {/* Color avatar */}
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            flexShrink: 0,
            background: `${color}20`,
            border: `1px solid ${color}33`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}
        >
          {cat.icon || "📁"}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: "-0.01em",
              }}
            >
              {cat.name}
            </span>
            {hasLimit && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--blue-400)",
                  background: "rgba(10,132,255,0.1)",
                  borderRadius: 4,
                  padding: "2px 7px",
                }}
              >
                Limite {formatCurrency(cat.invoice_budget_limit!)}
              </span>
            )}
            {subs.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSubsOpen((v) => !v)}
                className="h-auto min-h-0 rounded px-1.5 py-0.5 text-[10px] font-normal text-[var(--text-muted)]"
                style={{
                  fontFamily: "var(--font-sans)",
                  background: "rgba(255,255,255,0.06)",
                  borderWidth: 0,
                }}
              >
                {subs.length} subcategor{subs.length > 1 ? "ias" : "ia"}{" "}
                {subsOpen ? "↑" : "↓"}
              </Button>
            )}
          </div>
          <div
            style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}
          >
            {domain === "credit_card" ? cardLabel : "Conta bancária"}
          </div>
          {hasLimit && (
            <BudgetBar spent={0} limit={cat.invoice_budget_limit!} />
          )}
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: 5,
            flexShrink: 0,
            alignItems: "center",
          }}
        >
          {subs.length > 0 && (
            <IconBtn
              onClick={() => setSubsOpen((v) => !v)}
              style={{ color: subsOpen ? "var(--blue-400)" : undefined }}
            >
              <ChevronDown open={subsOpen} />
            </IconBtn>
          )}
          <IconBtn title="Subcategoria" onClick={() => onAddSub(cat)}>
            <Plus size={13} />
          </IconBtn>
          <IconBtn title="Editar" onClick={() => onEdit(cat)}>
            <Pencil size={13} />
          </IconBtn>
          <IconBtn title="Excluir" onClick={() => onDelete(cat)} danger>
            <Trash2 size={13} />
          </IconBtn>
        </div>
      </div>

      {/* Subcategories */}
      {subsOpen && subs.length > 0 && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {subs.map((sub, i) => (
            <div
              key={sub.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 16px 10px 58px",
                borderBottom:
                  i < subs.length - 1
                    ? "1px solid rgba(255,255,255,0.04)"
                    : "none",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.04)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: color,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 14, marginRight: 4 }}>
                {sub.icon || ""}
              </span>
              <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>
                {sub.name}
              </span>
              <IconBtn title="Editar" onClick={() => onEdit(sub)} small>
                <Pencil size={11} />
              </IconBtn>
              <IconBtn
                title="Excluir"
                onClick={() => onDeleteSub(sub)}
                danger
                small
              >
                <Trash2 size={11} />
              </IconBtn>
            </div>
          ))}
          <div style={{ padding: "8px 16px 10px 58px" }}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onAddSub(cat)}
              className="h-auto min-h-0 gap-1.5 rounded-lg border border-dashed border-[rgba(255,255,255,0.12)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:border-[var(--blue)] hover:text-[var(--blue)] hover:bg-transparent"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              <Plus size={12} /> Adicionar subcategoria
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Inline form ───────────────────────────────────────────────────────────────
function CategoryForm({
  mode,
  target,
  parentCat,
  domain,
  cards,
  onSave,
  onCancel,
}: {
  mode: FormMode;
  target: Category | null;
  parentCat: Category | null;
  domain: Scope;
  cards: CreditCardConfig[];
  onSave: (form: FormState) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(() => {
    if (mode === "edit" && target) {
      return {
        name: target.name,
        icon: target.icon ?? "📁",
        color: target.color ?? PALETTE[0],
        scope: target.scope,
        cardId: target.card_id,
        parentId: target.parent_id,
        budgetLimit:
          target.invoice_budget_limit != null
            ? String(target.invoice_budget_limit)
            : "",
      };
    }
    if (mode === "new-sub" && parentCat) {
      return {
        ...EMPTY_FORM,
        scope: parentCat.scope,
        parentId: parentCat.id,
        color: resolveColor(parentCat, 0),
      };
    }
    return { ...EMPTY_FORM, scope: domain };
  });
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isSub =
    mode === "new-sub" || (mode === "edit" && target?.parent_id != null);
  const title =
    mode === "edit"
      ? "Editar categoria"
      : isSub
        ? `Nova subcategoria em "${parentCat?.name ?? ""}"`
        : "Nova categoria";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setErr("Informe o nome.");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await onSave(form);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        background: "var(--surface-card)",
        border: "1px solid rgba(10,132,255,0.3)",
        borderRadius: 16,
        padding: "16px 18px",
        marginBottom: 14,
        animation: "fadeUp 0.18s cubic-bezier(.25,.46,.45,.94) both",
      }}
    >
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 14,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>{title}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onCancel}
          aria-label="Fechar"
          className="text-[length:18px] leading-none text-[var(--text-muted)]"
        >
          ×
        </Button>
      </div>

      {isSub && parentCat && (
        <div
          style={{
            padding: "8px 12px",
            marginBottom: 12,
            borderRadius: 8,
            background: "rgba(10,132,255,0.08)",
            border: "1px solid rgba(10,132,255,0.2)",
            fontSize: 12,
            color: "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 14 }}>{parentCat.icon || "📁"}</span>
          Subcategoria de{" "}
          <strong style={{ color: "var(--text-primary)" }}>
            {parentCat.name}
          </strong>
        </div>
      )}

      <form
        onSubmit={(e) => void handleSubmit(e)}
        style={{ display: "grid", gap: 12 }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: 12,
            alignItems: "start",
          }}
        >
          {/* Icon + color */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => setShowIconPicker((v) => !v)}
              aria-label={showIconPicker ? "Ocultar ícones" : "Escolher ícone"}
              className="size-[52px] min-h-[52px] min-w-[52px] rounded-[14px] p-0 text-2xl"
              style={{
                background: `${form.color}20`,
                border: `2px solid ${form.color}44`,
              }}
            >
              {form.icon}
            </Button>
            {!isSub && (
              <div
                style={{ display: "flex", flexWrap: "wrap", gap: 3, width: 52 }}
              >
                {PALETTE.slice(0, 8).map((c) => (
                  <Button
                    key={c}
                    type="button"
                    variant="ghost"
                    size="lg"
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    aria-label={`Cor ${c}`}
                    className={cn(
                      "size-5 min-h-5 min-w-5 shrink-0 rounded-full p-0",
                    )}
                    style={{
                      background: c,
                      border: `2px solid ${form.color === c ? "#fff" : "transparent"}`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <label style={lbl}>
              <span>Nome</span>
              <Input
                size="sm"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder={isSub ? "Ex: Mercado" : "Ex: Alimentação"}
                required
                autoFocus
              />
            </label>
            {!isSub && domain === "credit_card" && (
              <>
                <label style={lbl}>
                  <span>Aplicar em</span>
                  <Select
                    size="sm"
                    value={form.cardId ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        cardId: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                  >
                    <option value="">Todos os cartões</option>
                    {cards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </label>
                <label style={lbl}>
                  <span>Limite por fatura (opcional)</span>
                  <div style={{ position: "relative" }}>
                    <span
                      style={{
                        position: "absolute",
                        left: 11,
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: 13,
                        color: "var(--text-muted)",
                      }}
                    >
                      R$
                    </span>
                    <Input
                      value={form.budgetLimit}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, budgetLimit: e.target.value }))
                      }
                      type="number"
                      min="0"
                      step="0.01"
                      size="sm"
                      placeholder="Sem limite"
                      className="pl-8"
                    />
                  </div>
                </label>
              </>
            )}
          </div>
        </div>

        {showIconPicker && (
          <div
            style={{
              background: "var(--surface-2)",
              borderRadius: 10,
              padding: 10,
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
            }}
          >
            {ICONS.map((ic) => (
              <Button
                key={ic}
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setForm((f) => ({ ...f, icon: ic }));
                  setShowIconPicker(false);
                }}
                aria-label={`Ícone ${ic}`}
                className={cn(
                  "size-9 rounded-lg border p-0 text-lg",
                  form.icon === ic && "border-[var(--separator-opaque)]",
                )}
                style={{
                  background:
                    form.icon === ic ? `${form.color}30` : "transparent",
                  borderColor: form.icon === ic ? form.color : "transparent",
                }}
              >
                {ic}
              </Button>
            ))}
          </div>
        )}

        {err && (
          <p style={{ fontSize: 12, color: "var(--red-400)", margin: 0 }}>
            {err}
          </p>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={saving}>
            {mode === "edit" ? "Salvar" : "Criar categoria"}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Summary Strip ─────────────────────────────────────────────────────────────
function SummaryStrip({ cats, domain }: { cats: Category[]; domain: Scope }) {
  const parents = cats.filter((c) => c.parent_id == null);
  const subs = cats.filter((c) => c.parent_id != null);
  const withLimit = parents.filter(
    (c) => c.invoice_budget_limit != null && c.invoice_budget_limit > 0,
  ).length;
  const withSubcats = parents.filter((c) =>
    subs.some((s) => s.parent_id === c.id),
  ).length;

  const items =
    domain === "credit_card"
      ? [
          {
            label: "Categorias",
            value: parents.length,
            color: "var(--text-primary)",
          },
          {
            label: "Subcategorias",
            value: subs.length,
            color: "var(--purple-400,#BF5AF2)",
          },
          {
            label: "Com limite",
            value: withLimit,
            color: withLimit > 0 ? "var(--blue-400)" : "var(--text-muted)",
          },
          {
            label: "Com subcats",
            value: withSubcats,
            color:
              withSubcats > 0 ? "var(--teal-400,#5AC8FA)" : "var(--text-muted)",
          },
        ]
      : [
          {
            label: "Categorias",
            value: parents.length,
            color: "var(--text-primary)",
          },
          {
            label: "Subcategorias",
            value: subs.length,
            color: "var(--purple-400,#BF5AF2)",
          },
        ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${items.length},1fr)`,
        background: "var(--surface-card)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 14,
        overflow: "hidden",
        marginBottom: 14,
      }}
    >
      {items.map((s, i) => (
        <div
          key={i}
          style={{
            padding: "12px 14px",
            borderRight:
              i < items.length - 1
                ? "1px solid rgba(255,255,255,0.06)"
                : "none",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: 5,
            }}
          >
            {s.label}
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 18,
              fontWeight: 700,
              color: s.color,
            }}
          >
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function BudgetBar({ spent, limit }: { spent: number; limit: number }) {
  const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const over = spent > limit;
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--surface-3)]">
        <div
          className={cn("h-full rounded-full", over ? "bg-[var(--red)]" : "bg-[var(--green)]")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="shrink-0 font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-muted)]">
        {formatCurrency(spent)} / {formatCurrency(limit)}
      </span>
    </div>
  );
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: open ? "rotate(180deg)" : "none",
        transition: "transform 0.15s",
      }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  danger,
  small,
  style,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  danger?: boolean;
  small?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      title={title}
      aria-label={title ?? "Ação"}
      style={style}
      className={cn(
        "shrink-0 rounded-[7px] border border-[rgba(255,255,255,0.08)] bg-transparent hover:bg-[rgba(255,255,255,0.06)]",
        small
          ? 'size-6 [&_svg:not([class*="size-"])]:!size-[11px]'
          : 'size-7 [&_svg:not([class*="size-"])]:!size-[13px]',
        danger ? "!text-[var(--red)]" : "text-[var(--text-muted)]",
      )}
    >
      {children}
    </Button>
  );
}

function DomainToggle({
  domain,
  onChange,
}: {
  domain: Scope;
  onChange: (d: Scope) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 2,
        background: "rgba(255,255,255,0.08)",
        borderRadius: 10,
        padding: 3,
      }}
    >
      {(["credit_card", "bank"] as Scope[]).map((d, i) => (
        <Button
          key={d}
          type="button"
          variant={domain === d ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onChange(d)}
          className={domain === d ? "shadow-[0_1px_4px_rgba(0,0,0,0.4)]" : ""}
        >
          {i === 0 ? "Cartão" : "Conta"}
        </Button>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CategoriesPage() {
  const isMobile = useIsMobile();
  const [domain, setDomain] = useState<Scope>("credit_card");
  const [categories, setCategories] = useState<Category[]>([]);
  const [cards, setCards] = useState<CreditCardConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [parentTarget, setParentTarget] = useState<Category | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cats, cds] = await Promise.all([
        api.listCategories(domain),
        domain === "credit_card"
          ? api.listCards()
          : Promise.resolve<CreditCardConfig[]>([]),
      ]);
      setCategories(cats);
      setCards(cds);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }, [domain]);

  useEffect(() => {
    void load();
  }, [load]);

  const parents = useMemo(
    () => categories.filter((c) => c.parent_id == null),
    [categories],
  );
  const subsByParent = useMemo(() => {
    const m = new Map<number, Category[]>();
    categories
      .filter((c) => c.parent_id != null)
      .forEach((c) => {
        const l = m.get(c.parent_id!) ?? [];
        l.push(c);
        m.set(c.parent_id!, l);
      });
    return m;
  }, [categories]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return parents;
    return parents.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (subsByParent.get(c.id) ?? []).some((s) =>
          s.name.toLowerCase().includes(q),
        ),
    );
  }, [parents, subsByParent, search]);

  async function handleSave(form: FormState) {
    const payload: CategoryPayload = {
      name: form.name.trim(),
      scope: form.scope,
      icon: form.icon || null,
      color: form.color || null,
      card_id: form.scope === "bank" ? null : (form.cardId ?? null),
      parent_id: form.parentId ?? null,
      invoice_budget_limit:
        form.scope === "credit_card" && form.budgetLimit
          ? parseFloat(form.budgetLimit)
          : null,
    };
    if (formMode === "edit" && editTarget) {
      const patch: CategoryUpdatePayload = {
        name: payload.name,
        icon: payload.icon as string,
        color: payload.color as string,
      };
      if (form.scope === "credit_card") {
        patch.card_id = form.cardId ?? 0;
        patch.parent_id = form.parentId ?? 0;
        patch.invoice_budget_limit = form.budgetLimit
          ? parseFloat(form.budgetLimit)
          : 0;
      }
      const updated = await api.updateCategory(editTarget.id, patch);
      setCategories((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c)),
      );
    } else {
      const created = await api.createCategory(payload);
      setCategories((prev) => [...prev, created]);
    }
    setFormMode(null);
    setEditTarget(null);
    setParentTarget(null);
  }

  async function handleDelete(cat: Category) {
    const subs = subsByParent.get(cat.id) ?? [];
    if (
      !window.confirm(
        subs.length > 0
          ? `Excluir "${cat.name}" e suas ${subs.length} subcategoria(s)?`
          : `Excluir "${cat.name}"?`,
      )
    )
      return;
    await api.deleteCategory(cat.id);
    setCategories((prev) =>
      prev.filter((c) => c.id !== cat.id && c.parent_id !== cat.id),
    );
  }

  function openEdit(cat: Category) {
    setEditTarget(cat);
    setParentTarget(null);
    setFormMode("edit");
  }
  function openNewSub(parent: Category) {
    setParentTarget(parent);
    setEditTarget(null);
    setFormMode("new-sub");
  }

  const px = isMobile ? 14 : 24;

  return (
    <>
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {/* Page header row */}
        <div
          style={{
            padding: `13px ${px}px 12px`,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
            <Search
              size={13}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                pointerEvents: "none",
              }}
            />
            <Input
              variant="search"
              size="sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar categoria..."
              className="w-full pl-[30px] text-xs"
            />
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <DomainToggle
              domain={domain}
              onChange={(d) => {
                setDomain(d);
                setFormMode(null);
              }}
            />
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                setFormMode("new-parent");
                setEditTarget(null);
                setParentTarget(null);
              }}
            >
              <Plus size={13} /> Nova categoria
            </Button>
          </div>
        </div>

        <div style={{ padding: `16px ${px}px 40px` }}>
          {loading ? (
            <div
              style={{ display: "flex", justifyContent: "center", padding: 48 }}
            >
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                padding: "16px 0",
              }}
            >
              <AlertTriangle size={16} color="var(--red-400)" />
              <p style={{ fontSize: 14, color: "var(--red-400)", margin: 0 }}>
                {error}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void load()}
              >
                <RefreshCw size={14} /> Tentar novamente
              </Button>
            </div>
          ) : (
            <>
              <SummaryStrip cats={categories} domain={domain} />

              {formMode && (
                <CategoryForm
                  mode={formMode}
                  target={editTarget}
                  parentCat={parentTarget}
                  domain={domain}
                  cards={cards}
                  onSave={handleSave}
                  onCancel={() => {
                    setFormMode(null);
                    setEditTarget(null);
                    setParentTarget(null);
                  }}
                />
              )}

              {filtered.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 24px",
                    border: "1px dashed rgba(255,255,255,0.1)",
                    borderRadius: 16,
                  }}
                >
                  <Tags
                    size={28}
                    style={{
                      margin: "0 auto 12px",
                      display: "block",
                      opacity: 0.3,
                    }}
                  />
                  <div
                    style={{
                      fontSize: 14,
                      color: "var(--text-secondary)",
                      marginBottom: 16,
                    }}
                  >
                    {search
                      ? "Nenhuma categoria encontrada."
                      : `Nenhuma categoria de ${domain === "credit_card" ? "cartão" : "conta"} ainda.`}
                  </div>
                  {!search && (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setFormMode("new-parent");
                        setEditTarget(null);
                        setParentTarget(null);
                      }}
                    >
                      <Plus size={13} /> Criar primeira categoria
                    </Button>
                  )}
                </div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {filtered.map((cat, i) => (
                    <CategoryCard
                      key={cat.id}
                      cat={cat}
                      idx={i}
                      domain={domain}
                      cards={cards}
                      subs={subsByParent.get(cat.id) ?? []}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                      onAddSub={openNewSub}
                      onDeleteSub={handleDelete}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const lbl: React.CSSProperties = {
  display: "grid",
  gap: 4,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
};
