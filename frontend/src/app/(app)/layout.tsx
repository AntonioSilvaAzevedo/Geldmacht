import Sidebar from '@/components/Layout/Sidebar';
import BottomTabBar from '@/components/Layout/BottomTabBar';
import AuthVersionGate from '@/components/AuthVersionGate';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#000' }}>
      <AuthVersionGate />
      <Sidebar />
      <BottomTabBar />
      <main className="app-main-content">
        {children}
      </main>
    </div>
  );
}
