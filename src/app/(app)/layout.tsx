/**
 * Geldmacht — App Layout
 * Desktop (≥768px): Sidebar fixa lateral + main com margin-left 220px
 * Mobile (<768px):  Bottom Tab Bar fixa no rodapé + main com padding-bottom
 */

import Sidebar from '@/components/Layout/Sidebar';
import BottomTabBar from '@/components/Layout/BottomTabBar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      <BottomTabBar />
      <main style={{
        marginLeft:    220,        // desktop: afasta do sidebar
        minHeight:     '100vh',
        background:    '#000',
        color:         '#fff',
      }}
        className="app-main"
      >
        {children}
      </main>
    </>
  );
}
