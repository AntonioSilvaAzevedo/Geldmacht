import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Decodifica o payload de um JWT sem verificar assinatura (apenas para ler exp). */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const b64 = token.split('.')[1];
    const json = Buffer.from(b64, 'base64').toString('utf-8');
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Chama /auth/refresh com o token atual e retorna o token atualizado. */
async function refreshAccessToken(
  oldToken: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  try {
    const res = await fetch(`${API}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${oldToken.accessToken as string}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) throw new Error(`Refresh HTTP ${res.status}`);

    const data = await res.json() as { access_token: string };
    const payload = decodeJwtPayload(data.access_token);

    return {
      ...oldToken,
      accessToken: data.access_token,
      tokenExpiry:  ((payload?.exp as number) ?? 0) * 1000,
      error:        undefined,
    };
  } catch (err) {
    console.error('[auth] refresh falhou:', err);
    // Se o token atual ainda não expirou, a falha é transitória (ex.: backend
    // reiniciando). Retorna o token sem erro para não derrubar a sessão.
    const expiry = (oldToken.tokenExpiry as number) ?? 0;
    if (expiry > Date.now()) {
      console.warn('[auth] refresh transitório falhou — token ainda válido, sessão mantida.');
      return { ...oldToken };
    }
    return { ...oldToken, error: 'RefreshAccessTokenError' as const };
  }
}

// ── Auth config ───────────────────────────────────────────────────────────────

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,

  session: {
    strategy: 'jwt',
    maxAge:   30 * 24 * 60 * 60, // 30 dias
  },

  providers: [
    Credentials({
      credentials: {
        email:    { label: 'E-mail',  type: 'email'    },
        password: { label: 'Senha',   type: 'password' },
      },
      async authorize(credentials) {
        try {
          const res = await fetch(`${API}/auth/login`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
              email:    credentials.email,
              password: credentials.password,
            }),
          });
          if (!res.ok) return null;
          const data = await res.json() as {
            access_token: string;
            user: { email: string; name?: string | null };
          };
          return {
            email:       data.user.email,
            name:        data.user.name ?? null,
            accessToken: data.access_token,
          };
        } catch {
          return null;
        }
      },
    }),

    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID     ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // ── Primeiro login via Credentials ──────────────────────────────────────
      if (user?.accessToken) {
        const payload = decodeJwtPayload(user.accessToken as string);
        return {
          ...token,
          accessToken: user.accessToken,
          tokenExpiry: ((payload?.exp as number) ?? 0) * 1000,
        };
      }

      // ── Primeiro login via Google ────────────────────────────────────────────
      if (account?.provider === 'google' && account.access_token) {
        try {
          const res = await fetch(`${API}/auth/google`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ access_token: account.access_token }),
          });
          if (res.ok) {
            const data = await res.json() as { access_token: string };
            const payload = decodeJwtPayload(data.access_token);
            return {
              ...token,
              accessToken: data.access_token,
              tokenExpiry: ((payload?.exp as number) ?? 0) * 1000,
            };
          }
        } catch { /* mantém token existente */ }
      }

      // ── Token ainda válido? (renova quando falta ≤1 dia para expirar) ─────────
      const ONE_DAY   = 24 * 60 * 60 * 1000;
      const expiry    = (token.tokenExpiry as number) ?? 0;

      // Se o expiry não foi definido (0), significa que decodeJwtPayload falhou
      // no login. Nesse caso evitamos renovar em toda requisição — aguardamos o
      // próximo ciclo de update() do AuthRefreshGuard.
      if (expiry === 0 || Date.now() < expiry - ONE_DAY) {
        return token;
      }

      // ── Token expirado ou dentro do janela de renovação → renovar ────────────
      return refreshAccessToken(token as Record<string, unknown>);
    },

    async session({ session, token }) {
      session.accessToken = (token.accessToken as string) ?? '';
      if (token.error) {
        session.error = token.error as string;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
  },
});
