/**
 * Geldmacht — Sidebar (Web Navigation) — Apple Direction
 * Desktop: sempre visível, fixed, 220px
 */

"use client";
import { config } from "@/config/env";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLancamentoModal } from "@/components/Lancamento/lancamento-modal-context";

// ── Nav config ────────────────────────────────────────────────────────────────
const NAV_PRINCIPAL = [
  { href: "/home", label: "Início" },
  { href: "/home/carteira", label: "Carteira" },
  { href: "/home/proventos", label: "Proventos" },
];

const NAV_ANALISE = [
  { href: "/home/categorias", label: "Categorias" },
  { href: "/home/configuracoes", label: "Configurações" },
];

// ── Icons (SVG inline — sem dependência externa) ──────────────────────────────
function NavIcon({ href, active }: { href: string; active: boolean }) {
  const c = active ? "#fff" : "rgba(255,255,255,0.45)";
  const props = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: c,
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const icons: Record<string, React.ReactNode> = {
    "/home": (
      <svg {...props}>
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
    "/home/carteira": (
      <svg {...props}>
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
    "/home/proventos": (
      <svg {...props}>
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
    "/home/categorias": (
      <svg {...props}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    "/home/configuracoes": (
      <svg {...props}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  };
  return <>{icons[href] ?? null}</>;
}

// ── Nav item ──────────────────────────────────────────────────────────────────
function NavItem({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 12px",
        borderRadius: 10,
        fontSize: 14,
        fontWeight: active ? 500 : 400,
        color: active ? "#fff" : "rgba(255,255,255,0.4)",
        background: active ? "#1C1C1E" : "transparent",
        textDecoration: "none",
        transition: "all 0.12s",
        marginBottom: 2,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background: active ? "rgba(255,255,255,0.08)" : "transparent",
        }}
      >
        <NavIcon href={href} active={active} />
      </div>
      {label}
    </Link>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
export default function Sidebar() {
  const pathname = usePathname();
  const { open: openLancamento } = useLancamentoModal();

  function isActive(href: string) {
    if (href === "/home") return pathname === "/home";
    if (href === "/home/carteira")
      return (
        pathname.startsWith("/home/carteira") ||
        pathname.startsWith("/home/cartao")
      );
    return pathname.startsWith(href);
  }

  return (
    <nav
      className="sidebar-desktop"
      aria-label="Navegação principal"
      style={{
        width: 220,
        flexShrink: 0,
        background: "#000",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        flexDirection: "column",
        padding: "24px 10px 20px",
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "4px 10px",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: "#1C1C1E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 15,
            fontWeight: 800,
            color: "#fff",
          }}
        >
          G
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
            Geldmacht
          </div>
          <div
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.3)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            v{config.appVersion}
          </div>
        </div>
      </div>

      {/* Principal */}
      {NAV_PRINCIPAL.map((item) => (
        <NavItem key={item.href} {...item} active={isActive(item.href)} />
      ))}

      <button
        type="button"
        onClick={openLancamento}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "9px 12px",
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 400,
          color: "rgba(255,255,255,0.4)",
          background: "transparent",
          border: "none",
          textAlign: "left",
          cursor: "pointer",
          fontFamily: "inherit",
          marginBottom: 2,
          width: "100%",
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
        Adicionar lançamento
      </button>

      <div style={{ height: 8 }} />
      {NAV_ANALISE.map((item) => (
        <NavItem key={item.href} {...item} active={isActive(item.href)} />
      ))}

      {/* Usuário — rodapé */}
      <div
        style={{
          marginTop: "auto",
          paddingTop: 16,
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <Link
          href="/home/perfil"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 10px",
            borderRadius: 10,
            textDecoration: "none",
            transition: "background 0.12s",
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "#2C2C2E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 600,
              color: "rgba(255,255,255,0.7)",
              flexShrink: 0,
            }}
          >
            U
          </div>
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#fff",
                lineHeight: 1.2,
              }}
            >
              Meu perfil
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
              Configurações
            </div>
          </div>
        </Link>
      </div>
    </nav>
  );
}
