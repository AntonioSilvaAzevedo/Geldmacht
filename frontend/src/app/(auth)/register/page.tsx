'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { config } from '@/config/env';

export default function RegisterPage() {
  const router = useRouter();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${config.apiUrl}/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.detail ?? 'Erro ao criar conta. Tente novamente.');
        return;
      }

      // Sucesso — mostrar feedback e redirecionar para login com e-mail pré-preenchido
      setSuccess(true);
      setTimeout(() => {
        router.push(`/login?email=${encodeURIComponent(email)}`);
      }, 1500);
    } catch {
      setError('Erro de conexão. Verifique sua internet.');
    } finally {
      setLoading(false);
    }
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
            Criar conta
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Preencha seus dados
          </p>
        </div>

        {/* Erro */}
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

        {/* Sucesso */}
        {success && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(72,187,120,0.08)',
              border: '1px solid rgba(72,187,120,0.25)',
              marginBottom: 20,
            }}
          >
            <CheckCircle2 size={14} color="var(--green-400)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--green-400)' }}>
              Conta criada! Redirecionando para o login…
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Nome */}
          <div>
            <label
              htmlFor="name"
              style={labelStyle}
            >
              Nome
            </label>
            <div style={{ position: 'relative' }}>
              <User size={14} style={iconStyle} />
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="Seu nome"
                autoComplete="name"
                style={inputStyle}
              />
            </div>
          </div>

          {/* E-mail */}
          <div>
            <label
              htmlFor="email"
              style={labelStyle}
            >
              E-mail
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={14} style={iconStyle} />
              <input
                id="email"
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
              style={labelStyle}
            >
              Senha
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={14} style={iconStyle} />
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                style={inputStyle}
              />
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5, marginBottom: 0 }}>
              Mínimo 8 caracteres
            </p>
          </div>

          {/* Botão */}
          <button
            type="submit"
            disabled={loading || success}
            style={primaryBtnStyle(loading || success)}
          >
            {loading && <Loader2 size={15} className="spin" />}
            {loading ? 'Criando conta…' : 'Criar conta'}
          </button>
        </form>
      </div>

      {/* Link para login */}
      <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
        Já tem conta?{' '}
        <Link
          href="/login"
          style={{ color: 'var(--blue-400)', textDecoration: 'none', fontWeight: 500 }}
        >
          Fazer login
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
const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--text-secondary)',
  display: 'block',
  marginBottom: 6,
};

const iconStyle: React.CSSProperties = {
  position: 'absolute',
  left: 12,
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'var(--text-muted)',
  pointerEvents: 'none',
};

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

function primaryBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: '11px',
    borderRadius: 9,
    border: 'none',
    background: disabled
      ? 'var(--navy-700)'
      : 'linear-gradient(135deg, #3182ce 0%, #2c7a7b 100%)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'opacity 0.15s',
    opacity: disabled ? 0.7 : 1,
  };
}
