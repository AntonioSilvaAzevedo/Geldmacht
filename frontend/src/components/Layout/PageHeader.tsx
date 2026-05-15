/**
 * src/components/Layout/PageHeader.tsx
 *
 * Cabeçalho fixo de página — fica FORA do <main> como sibling anterior.
 * Permanece visível enquanto o <main> rola (ver LAYOUT-SCROLL-HANDOFF.md).
 *
 * Uso básico:
 *   <>
 *     <PageHeader title="Dashboard Anual" subtitle="Jan — Mai 2026" />
 *     <main style={{ flex: 1 }}>...</main>
 *   </>
 *
 * Com breadcrumb + ações:
 *   <>
 *     <PageHeader
 *       title="Cartão Roxinho"
 *       crumbs={[{ href: '/carteira', label: 'Carteira' }, { href: '/carteira/nubank', label: 'Nubank' }]}
 *       right={<Button>Importar</Button>}
 *     />
 *     <main style={{ flex: 1 }}>...</main>
 *   </>
 *
 * Com slot de navegação (InvoiceNavBar):
 *   <>
 *     <PageHeader
 *       title="Maio 2026"
 *       crumbs={[{ href: `/cartao/${id}`, label: card.name }]}
 *       nav={<InvoiceNavBar ... />}
 *     />
 *     <main style={{ flex: 1 }}>...</main>
 *   </>
 */

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export interface Crumb {
  href: string;
  label: string;
}

export interface PageHeaderProps {
  /** h1 da página — obrigatório */
  title: string;
  /** Linha menor abaixo do título */
  subtitle?: string;
  /**
   * Trail de breadcrumb. Um item = back link simples.
   * Múltiplos itens = "← Carteira / Nubank".
   * A seta ← é adicionada automaticamente.
   */
  crumbs?: Crumb[];
  /**
   * Slot de ações no lado direito (botões, links, etc.)
   * Fica alinhado verticalmente ao título.
   */
  right?: React.ReactNode;
  /**
   * Slot abaixo do título — para InvoiceNavBar, segmented controls, etc.
   * Também fica fixo (não rola).
   */
  nav?: React.ReactNode;
  /**
   * Padding horizontal em px. Usar o mesmo valor do <main> da página.
   * Default: 32px desktop / passar 14 no mobile via useIsMobile().
   */
  px?: number;
}

export default function PageHeader({
  title,
  subtitle,
  crumbs = [],
  right,
  nav,
  px = 32,
}: PageHeaderProps) {
  const hasCrumbs = crumbs.length > 0;

  return (
    <div
      data-page-header=""
      style={{
        flexShrink: 0,
        padding: `${hasCrumbs ? 12 : 16}px ${px}px ${nav ? 0 : 13}px`,
        borderBottom: '1px solid var(--separator)',
        background: 'var(--surface-bg)',
      }}
    >
      {/* ── Breadcrumb trail ── */}
      {hasCrumbs && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 10,
        }}>
          <ChevronLeft size={13} color="var(--blue-400)" style={{ flexShrink: 0 }} />
          {crumbs.map((c, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {i > 0 && (
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/</span>
              )}
              <Link
                href={c.href}
                style={{
                  fontSize: 13,
                  color: 'var(--blue-400)',
                  textDecoration: 'none',
                  transition: 'opacity 0.1s',
                }}
              >
                {c.label}
              </Link>
            </span>
          ))}
        </div>
      )}

      {/* ── Title row ── */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
      }}>
        <div>
          <h1 style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            color: 'var(--text-primary)',
            margin: 0,
          }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              margin: '4px 0 0',
              letterSpacing: '-0.005em',
            }}>
              {subtitle}
            </p>
          )}
        </div>

        {right && (
          <div style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            flexShrink: 0,
            paddingTop: 2,
          }}>
            {right}
          </div>
        )}
      </div>

      {/* ── Nav slot ── */}
      {nav && (
        <div style={{ marginTop: 12, paddingBottom: 13 }}>
          {nav}
        </div>
      )}
    </div>
  );
}
