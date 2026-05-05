import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';


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

    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID  ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // Credentials: accessToken + rememberMe vêm do authorize()
      if (user) {
        if (user.accessToken) token.accessToken = user.accessToken;
        // Sem "Manter logado" → sessão expira em 1 dia
        if (user.rememberMe !== 'true') {
          token.exp = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
        }
      }
      // Google: trocar token Google por JWT do backend
      if (account?.provider === 'google' && account.access_token) {
        try {
          const res = await fetch(`${API}/auth/google`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ access_token: account.access_token }),
          });
          if (res.ok) {
            const data = await res.json();
            token.accessToken = data.access_token;
          }
        } catch { /* mantém token existente */ }
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
