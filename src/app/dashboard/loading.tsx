export default function DashboardLoading() {
    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{
                height: '200px',
                backgroundColor: '#e2e8f0',
                borderRadius: '12px',
                marginBottom: '2rem',
                animation: 'pulse 1.5s infinite'
            }} />
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{
                    flex: 1,
                    height: '150px',
                    backgroundColor: '#e2e8f0',
                    borderRadius: '8px',
                    animation: 'pulse 1.5s infinite'
                }} />
                <div style={{
                    flex: 1,
                    height: '150px',
                    backgroundColor: '#e2e8f0',
                    borderRadius: '8px',
                    animation: 'pulse 1.5s infinite'
                }} />
            </div>
            <style>{`
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
            `}</style>
        </div>
    );
}
