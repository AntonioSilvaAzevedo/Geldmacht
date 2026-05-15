import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    accessToken: string;
    /** 'RefreshAccessTokenError' quando o refresh silencioso falha. */
    error?: string;
    user: { email: string; name?: string | null } & DefaultSession['user'];
  }
  interface User {
    accessToken?: string;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    accessToken?: string;
    /** Timestamp em ms da expiração do accessToken do backend. */
    tokenExpiry?: number;
    error?: string;
  }
}
