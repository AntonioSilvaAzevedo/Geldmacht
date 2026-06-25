'use client';

/**
 * Geldmacht — Register Page (Apple Direction)
 * Alinhado ao login: grupo iOS, divisórias edge-to-edge, sem labels nos campos.
 */

import { useState, FormEvent, Suspense, type CSSProperties } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input, InputGroup, InputGroupRow } from '@/components/ui/input';

// ── Icons ─────────────────────────────────────────────────────────────────────
function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

// ── Form ──────────────────────────────────────────────────────────────────────
function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          typeof (data as { message?: unknown }).message === 'string'
            ? (data as { message: string }).message
            : 'Erro ao criar conta. Tente novamente.',
        );
        return;
      }

      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        setError('Conta criada. Entre manualmente na página de login.');
        return;
      }
      window.location.href = '/home/carteira';
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    await signIn('google', { callbackUrl: '/home' });
  }

  return (
    <div style={styles.wrapper}>

      <h1 style={styles.title}>Criar conta</h1>

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
              id="name"
              name="name"
              type="text"
              variant="group"
              size="lg"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Nome completo"
              autoComplete="name"
            />
          </InputGroupRow>

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
              placeholder="Senha (mín. 8 caracteres)"
              autoComplete="new-password"
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

          <InputGroupRow className="gap-2">
            <Input
              id="confirm"
              name="confirm"
              type={showPwd2 ? 'text' : 'password'}
              variant="group"
              size="lg"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              placeholder="Confirmar senha"
              autoComplete="new-password"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowPwd2(v => !v)}
              tabIndex={-1}
              className="h-auto w-auto shrink-0 border-none bg-transparent p-1 text-white/35 hover:bg-transparent hover:text-white/35"
              aria-label={showPwd2 ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
            >
              <EyeIcon open={showPwd2} />
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
          {loading ? 'Criando conta…' : 'Criar conta'}
        </Button>
      </form>

      <div style={styles.divider}>
        <div style={styles.dividerLine} />
        <span style={styles.dividerText}>ou</span>
        <div style={styles.dividerLine} />
      </div>

      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="w-full rounded-[14px] font-medium"
        onClick={handleGoogle}
      >
        <GoogleIcon />
        Continuar com Google
      </Button>

      <div style={styles.links}>
        <p style={styles.linksText}>
          Já tem conta?{' '}
          <Link href="/login" style={styles.link}>Entrar</Link>
        </p>
      </div>

    </div>
  );
}

// ── Styles (mesmo padrão do login) ────────────────────────────────────────────
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

  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  } as CSSProperties,

  dividerLine: {
    flex: 1,
    height: 1,
    background: 'var(--separator)',
  } as CSSProperties,

  dividerText: {
    fontSize: 13,
    color: 'var(--text-tertiary)',
  } as CSSProperties,

  links: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  } as CSSProperties,

  linksText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.60)',
    whiteSpace: 'nowrap',
    margin: 0,
  } as CSSProperties,

  link: {
    color: 'var(--blue)',
    textDecoration: 'none',
    fontWeight: 500,
  } as CSSProperties,
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: 200 }} aria-hidden />}>
      <RegisterForm />
    </Suspense>
  );
}
