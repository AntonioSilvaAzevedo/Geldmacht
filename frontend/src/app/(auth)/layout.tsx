import type { ReactNode } from 'react';

/**
 * Auth layout — Apple Direction (fundo preto verdadeiro).
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      {children}
    </div>
  );
}
