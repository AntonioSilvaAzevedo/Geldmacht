'use client';

import { useState, FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Loader2, Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { config } from '@/config/env';

export default function RegisterPage() {
  const [name, setName]                 = useState('');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [confirm, setConfirm]           = useState('');
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter ao menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${config.apiUrl}/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password, name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.detail ?? 'Erro ao criar conta. Tente novamente.');
        return;
      }
      // Auto-login após registro
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        setError('Conta criada! Faça login manualmente.');
      } else {
        window.location.href = '/';
      }
    } catch {
      setError('Erro de conexão. Verifique o servidor.');
    } finally {
      setLoading(false);
    }
  }

  const fieldStyle = {
    width: '100%',
    padding: '10px 12px 10px 36px',
    borderRadius: 8,
    border: '1px solid var(--border-default)',
    background: 'var(--navy-900)',
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  const labelStyle = {
    fontSize: 12,
    fontWeight: 500 as const,
    color: 'var(--text-secondary)',
    display: 'block' as const,
    marginBottom: 6,
  };

  const passwordsMatch = confirm.length > 0 && password === confirm;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--navy-950)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 52,
            height: 52,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #3182ce 0%, #2c7a7b 100%)',
            marginBottom: 16,
            fontSize: 24,
          }}>
            💰
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Geldmacht
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
            Crie sua conta gratuita
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 16,
          padding: 32,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 24, marginTop: 0 }}>
            Criar nova conta
          </h2>

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(252,129,129,0.1)',
              border: '1px solid rgba(252,129,129,0.25)',
              marginBottom: 20,
            }}>
              <AlertCircle size={14} color="var(--red-400)" />
              <span style={{ fontSize: 13, color: 'var(--red-400)' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Nome (opcional)</label>
              <div style={{ position: 'relative' }}>
                <User size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" style={fieldStyle} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>E-mail</label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com" style={fieldStyle} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Senha</label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Mín. 6 caracteres" style={fieldStyle} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Confirmar senha</label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  placeholder="Repita a senha"
                  style={{ ...fieldStyle, borderColor: confirm.length > 0 ? (passwordsMatch ? 'rgba(72,187,120,0.5)' : 'rgba(252,129,129,0.5)') : 'var(--border-default)' }}
                />
                {confirm.length > 0 && (
                  <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                    {passwordsMatch
                      ? <CheckCircle2 size={14} color="var(--green-400)" />
                      : <AlertCircle size={14} color="var(--red-400)" />
                    }
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '11px',
                borderRadius: 9,
                border: 'none',
                background: loading ? 'var(--navy-700)' : 'linear-gradient(135deg, #3182ce 0%, #2c7a7b 100%)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 4,
              }}
            >
              {loading && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
          Já tem conta?{' '}
          <Link href="/login" style={{ color: 'var(--blue-400)', textDecoration: 'none', fontWeight: 500 }}>
            Entrar
          </Link>
        </p>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
