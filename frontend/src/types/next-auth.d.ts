import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    accessToken: string;
    user: { email: string; name?: string | null } & DefaultSession['user'];
  }
  interface User {
    accessToken?: string;
  }
}

// next-auth v5 beta: JWT augmentation lives in the same module
declare module '@auth/core/jwt' {
  interface JWT {
    accessToken?: string;
  }
}
