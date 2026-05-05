import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import Sidebar from '@/components/Layout/Sidebar';

export const metadata: Metadata = {
  title: 'Geldmacht — Controle Financeiro',
  description: 'Painel financeiro pessoal — CLT, PJ, Investimentos B3',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>
          <div style={{ display: 'flex', minHeight: '100vh' }}>
            <div className="sidebar-desktop">
              <Sidebar />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'auto' }}>
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
