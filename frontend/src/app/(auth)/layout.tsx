import type { ReactNode } from 'react';

/**
 * Auth layout — Apple Direction (fundo preto verdadeiro).
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-black px-4 py-6">
      {children}
    </div>
  );
}
