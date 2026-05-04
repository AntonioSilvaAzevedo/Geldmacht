'use client';

export default function LoadingSpinner({ message = 'Carregando...' }: { message?: string }) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      padding: 48,
      color: 'var(--text-muted)',
    }}>
      <div style={{
        width: 36,
        height: 36,
        border: '3px solid var(--border-default)',
        borderTopColor: 'var(--blue-400)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <span style={{ fontSize: 13 }}>{message}</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
