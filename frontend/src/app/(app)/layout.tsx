import Sidebar from '@/components/Layout/Sidebar';
import BottomTabBar from '@/components/Layout/BottomTabBar';
import AuthVersionGate from '@/components/AuthVersionGate';
import AuthRefreshGuard from '@/components/AuthRefreshGuard';
import { LancamentoModalProvider } from '@/components/LancamentoModal';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <LancamentoModalProvider>
      <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', background: '#000' }}>
        <AuthVersionGate />
        <AuthRefreshGuard />
        <Sidebar />
        <BottomTabBar />
        <div
          className="app-main-content"
          style={{
            display:        'flex',
            flexDirection:  'column',
            flex:           1,
            overflow:       'hidden',
            minWidth:       0,
            overflowX:      'hidden',
          }}
        >
          {children}
        </div>
      </div>
    </LancamentoModalProvider>
  );
}
