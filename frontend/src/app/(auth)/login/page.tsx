'use client';

import { useState, FormEvent, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, Mail, Lock, AlertCircle } from 'lucide-react';

// ── componente interno que usa useSearchParams ────────────────────────────────
function LoginForm() {
  const searchParams  = useSearchParams();
  const prefillEmail  = searchParams.get('email') ?? '';

  const [email,      setEmail]      = useState(prefillEmail);
  const [password,   setPassword]   = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(false);

  // sincroniza se searchParam chegar depois da hidratação
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
        rememberMe: rememberMe ? 'true' : 'false',
        redirect: false,
      });
      if (result?.error) {
        setError('E-mail ou senha incorretos.');
      } else {
        window.location.href = '/';
      }
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    await signIn('google', { callbackUrl: '/' });
  }

  return (
    <div style={{ width: '100%', maxWidth: 400 }}>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 52,
            height: 52,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #3182ce 0%, #2c7a7b 100%)',
            marginBottom: 14,
            fontSize: 26,
          }}
        >
          💰
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Geldmacht
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, margin: 0 }}>
          Controle Financeiro Pessoal
        </p>
      </div>

      {/* Card */}
      <div
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 16,
          padding: '32px 28px',
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>
            Bem-vindo de volta
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Acesse sua conta
          </p>
        </div>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(252,129,129,0.08)',
              border: '1px solid rgba(252,129,129,0.25)',
              marginBottom: 20,
            }}
          >
            <AlertCircle size={14} color="var(--red-400)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--red-400)' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* E-mail */}
          <div>
            <label
              htmlFor="email"
              style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}
            >
              E-mail
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={14}
                style={{
                  position: 'absolute', left: 12, top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }}
              />
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                autoComplete="email"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Senha */}
          <div>
            <label
              htmlFor="password"
              style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}
            >
              Senha
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={14}
                style={{
                  position: 'absolute', left: 12, top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }}
              />
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Sua senha"
                autoComplete="current-password"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Manter logado */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              style={{
                width: 15,
                height: 15,
                accentColor: 'var(--blue-400)',
                cursor: 'pointer',
              }}
            />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Manter logado por 30 dias
            </span>
          </label>

          {/* Entrar */}
          <button
            type="submit"
            disabled={loading}
            style={primaryBtnStyle(loading)}
          >
            {loading && <Loader2 size={15} className="spin" />}
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        {/* Divisor */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            margin: '20px 0', color: 'var(--text-muted)', fontSize: 12,
          }}
        >
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          ou
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogle}
          style={googleBtnStyle}
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar com Google
        </button>
      </div>

      {/* Link para cadastro */}
      <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
        Não tem conta?{' '}
        <Link
          href="/register"
          style={{ color: 'var(--blue-400)', textDecoration: 'none', fontWeight: 500 }}
        >
          Criar conta
        </Link>
      </p>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 0.9s linear infinite; }
      `}</style>
    </div>
  );
}

// ── estilos compartilhados ────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px 10px 36px',
  borderRadius: 8,
  border: '1px solid var(--border-default)',
  background: 'var(--navy-900)',
  color: 'var(--text-primary)',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};

function primaryBtnStyle(loading: boolean): React.CSSProperties {
  return {
    padding: '11px',
    borderRadius: 9,
    border: 'none',
    background: loading
      ? 'var(--navy-700)'
      : 'linear-gradient(135deg, #3182ce 0%, #2c7a7b 100%)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'opacity 0.15s',
    opacity: loading ? 0.7 : 1,
  };
}

const googleBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  borderRadius: 9,
  border: '1px solid var(--border-default)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  transition: 'border-color 0.15s, background 0.15s',
};

// ── export com Suspense (necessário pois usa useSearchParams) ─────────────────
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
