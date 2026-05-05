import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';


// ── Auth config ───────────────────────────────────────────────────────────────
export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,

  providers: [
    Credentials({
      credentials: {
        email:    { label: 'E-mail',  type: 'email' },
        password: { label: 'Senha',   type: 'password' },
      },
      async authorize(credentials) {
        try {
          const res = await fetch(`${API}/auth/login`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(credentials),
          });
          if (!res.ok) return null;
          const data = await res.json();
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
      clientId:     process.env.GOOGLE_CLIENT_ID  ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // Credentials: accessToken vem direto do authorize()
      if (user?.accessToken) {
        token.accessToken = user.accessToken;
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
