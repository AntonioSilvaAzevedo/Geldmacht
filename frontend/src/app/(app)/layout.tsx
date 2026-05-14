import Sidebar from '@/components/Layout/Sidebar';
import BottomTabBar from '@/components/Layout/BottomTabBar';
import AuthVersionGate from '@/components/AuthVersionGate';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#000' }}>
      <AuthVersionGate />
      <Sidebar />
      <BottomTabBar />
      <div
        className="app-main-content"
        style={{
          display:        'flex',
          flexDirection:  'column',
          minHeight:      '100vh',
          minWidth:       0,
          overflowX:      'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
}
