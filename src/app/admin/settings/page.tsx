'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import styles from '../admin.module.css';

export default function SettingsPage() {
    const { data: session } = useSession();
    const isAuditor = session?.user?.role === 'AUDITOR';
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Local state for specific fields
    const [totalCost, setTotalCost] = useState('350.00');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings');
            const data = await res.json();
            if (data.settings) {
                setSettings(data.settings);
                if (data.settings.diploma_total_cost) {
                    setTotalCost(data.settings.diploma_total_cost);
                }
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCost = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    key: 'diploma_total_cost',
                    value: totalCost,
                    description: 'Costo total del diplomado'
                }),
            });

            if (res.ok) {
                alert('Configuración guardada exitosamente');
                fetchSettings();
            } else {
                const data = await res.json();
                alert(`Error al guardar configuración: ${data.error || 'Desconocido'}`);
            }
        } catch (error) {
            console.error(error);
            alert('Error al conectar con el servidor');
        }
        setSaving(false);
    };

    if (loading) {
        return <div className={styles.contentArea}>Cargando...</div>;
    }

    return (
        <div className={styles.contentArea}>
            <div className={styles.topBar}>
                <h1 className={styles.pageTitle}>Configuración del Sistema</h1>
            </div>

            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Finanzas</h2>
                </div>

                <form onSubmit={handleSaveCost} style={{ maxWidth: '400px' }}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                            Costo Total del Diplomado ($)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={totalCost}
                            onChange={(e) => setTotalCost(e.target.value)}
                            className={styles.searchInput}
                            style={{ width: '100%' }}
                            required
                            disabled={isAuditor}
                        />
                        <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            Este valor se utilizará para calcular el progreso de pagos de todos los estudiantes.
                        </p>
                    </div>

                    {!isAuditor && (
                        <button
                            type="submit"
                            className={styles.btn + ' ' + styles.btnSuccess}
                            disabled={saving}
                        >
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}
