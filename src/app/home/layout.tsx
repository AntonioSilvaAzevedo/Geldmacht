import Sidebar from '@/components/Layout/Sidebar';
import BottomTabBar from '@/components/Layout/BottomTabBar';
import AuthVersionGate from '@/components/AuthVersionGate';
import { LancamentoModalProvider } from '@/components/Lancamento/lancamento-modal-context';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-black">
      <AuthVersionGate />
      <LancamentoModalProvider>
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
      </LancamentoModalProvider>
    </div>
  );
}
