'use client';

/**
 * Geldmacht — Login Page (Apple Direction redesign)
 *
 * Mudanças vs versão anterior:
 *  - Remove logo mark e subtitle
 *  - Inputs agrupados estilo iOS Settings (sem labels laterais)
 *  - Botão principal: branco/preto (sem gradiente)
 *  - "Esqueceu a senha?" abaixo de "Criar conta"
 *  - Ícone de olho no campo senha
 *  - Tipografia Apple Direction (-apple-system, tamanhos HIG)
 */

import { useState, FormEvent, useEffect, Suspense, type CSSProperties } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input, InputGroup, InputGroupRow } from '@/components/ui/input';

// ── Icons ─────────────────────────────────────────────────────────────────────
function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}

// ── Form ──────────────────────────────────────────────────────────────────────
function LoginForm() {
  const searchParams = useSearchParams();
  const prefillEmail = searchParams.get('email') ?? '';

  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (prefillEmail) setEmail(prefillEmail);
  }, [prefillEmail]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError('E-mail ou senha incorretos. Tente novamente.');
      } else {
        window.location.href = '/home/carteira';
      }
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrapper}>

      <h1 style={styles.title}>Geldmacht</h1>

      {error && (
        <div style={styles.error}>
          <AlertIcon />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        <InputGroup className="rounded-[14px]">
          <InputGroupRow>
            <Input
              id="email"
              name="email"
              type="email"
              variant="group"
              size="lg"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="E-mail"
              autoComplete="email"
              inputState={error ? 'error' : undefined}
            />
          </InputGroupRow>

          <InputGroupRow className="gap-2">
            <Input
              id="password"
              name="password"
              type={showPwd ? 'text' : 'password'}
              variant="group"
              size="lg"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Senha"
              autoComplete="current-password"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowPwd(v => !v)}
              tabIndex={-1}
              className="h-auto w-auto shrink-0 border-none bg-transparent p-1 text-white/35 hover:bg-transparent hover:text-white/35"
              aria-label={showPwd ? 'Ocultar senha' : 'Mostrar senha'}
            >
              <EyeIcon open={showPwd} />
            </Button>
          </InputGroupRow>
        </InputGroup>

        <Button
          type="submit"
          variant="default"
          size="lg"
          className="w-full rounded-[14px]"
          loading={loading}
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>

      <div style={styles.links}>
        <p style={styles.linksText}>
          Não tem conta?{' '}
          <Link href="/register" style={styles.link}>Criar conta</Link>
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  wrapper: {
    width: '100%',
    maxWidth: 400,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  } as CSSProperties,

  title: {
    fontSize: 32,
    fontWeight: 700,
    letterSpacing: '-0.025em',
    lineHeight: 1.1,
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
    width: '100%',
  } as CSSProperties,

  error: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 14px',
    borderRadius: 10,
    background: 'rgba(255,69,58,0.10)',
    fontSize: 13,
    color: 'var(--red)',
  } as CSSProperties,

  links: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  } as CSSProperties,

  linksText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.60)',
    whiteSpace: 'nowrap',
  } as CSSProperties,

  link: {
    color: 'var(--blue)',
    textDecoration: 'none',
    fontWeight: 500,
  } as CSSProperties,
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: 200 }} aria-hidden />}>
      <LoginForm />
    </Suspense>
  );
}
