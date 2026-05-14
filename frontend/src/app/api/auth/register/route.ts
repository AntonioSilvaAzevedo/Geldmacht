import { NextResponse } from 'next/server';
import { config } from '@/config/env';

function parseBackendError(data: unknown): string {
  if (!data || typeof data !== 'object') return 'Erro ao criar conta. Tente novamente.';
  const o = data as Record<string, unknown>;
  if (typeof o.message === 'string') return o.message;
  const d = o.detail;
  if (typeof d === 'string') return d;
  if (Array.isArray(d) && d.length > 0) {
    const first = d[0];
    if (first && typeof first === 'object' && 'msg' in first && typeof (first as { msg: unknown }).msg === 'string')
      return (first as { msg: string }).msg;
  }
  return 'Erro ao criar conta. Tente novamente.';
}

export async function POST(request: Request) {
  if (!config.apiUrl) {
    return NextResponse.json({ message: 'Serviço temporariamente indisponível.' }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  try {
    const res = await fetch(`${config.apiUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json({ message: parseBackendError(data) }, { status: res.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ message: 'Erro de conexão. Tente novamente.' }, { status: 502 });
  }
}
