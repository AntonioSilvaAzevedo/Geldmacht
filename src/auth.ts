import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

function backendTokenExp(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof json.exp === 'number' ? json.exp : null;
  } catch {
    return null;
  }
}


// ── Auth config ───────────────────────────────────────────────────────────────
export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias (quando "Manter logado" está ativo)
  },

  providers: [
    Credentials({
      credentials: {
        email:      { label: 'E-mail',      type: 'email'    },
        password:   { label: 'Senha',       type: 'password' },
        rememberMe: { label: 'Manter',      type: 'text'     },
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
          const data = await res.json();
          return {
            email:       data.user.email,
            name:        data.user.name ?? null,
            accessToken: data.access_token,
            rememberMe:  credentials.rememberMe as string | undefined,
          };
        } catch {
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        if (user.accessToken) {
          token.accessToken = user.accessToken;
          const exp = backendTokenExp(user.accessToken);
          if (exp) token.exp = exp;
        }
        if (user.rememberMe !== 'true') {
          const oneDay = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
          token.exp = typeof token.exp === 'number' ? Math.min(token.exp, oneDay) : oneDay;
        }
      }
      return token;
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken as string ?? '';
      return session;
    },
  },

  pages: {
    signIn: '/login',
  },
});
