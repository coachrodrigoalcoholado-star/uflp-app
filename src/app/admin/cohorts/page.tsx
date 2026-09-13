'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CohortsPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/admin/users');
    }, [router]);

    return (
        <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
            Redirigiendo a la gestión de usuarios por camada...
        </div>
    );
}

