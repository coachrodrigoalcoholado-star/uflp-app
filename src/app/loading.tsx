export default function Loading() {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            width: '100vw',
            backgroundColor: '#f8fafc',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 9999
        }}>
            <div style={{
                width: '50px',
                height: '50px',
                border: '4px solid #e2e8f0',
                borderTop: '4px solid #0B5394',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }} />
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
