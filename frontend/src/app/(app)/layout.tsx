import Sidebar from '@/components/Layout/Sidebar';
import AuthVersionGate from '@/components/AuthVersionGate';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AuthVersionGate />
      <div className="sidebar-desktop">
        <Sidebar />
      </div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          overflow: 'auto',
        }}
      >
        {children}
      </div>
    </div>
  );
}
