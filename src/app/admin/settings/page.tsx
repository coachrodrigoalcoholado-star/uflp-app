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

            {/* Cohort Management Section - RESTORED */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Gestión de Camadas</h2>
                </div>

                {!isAuditor ? (
                    <CohortManager />
                ) : (
                    <p style={{ color: '#666' }}>No tienes permisos para gestionar camadas.</p>
                )}
            </div>
        </div>
    );
}

// Inline Cohort Manager Component to restore functionality quickly
function CohortManager() {
    const [cohorts, setCohorts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        code: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        fetchCohorts();
    }, []);

    const fetchCohorts = async () => {
        try {
            const res = await fetch('/api/admin/cohorts');
            const data = await res.json();
            setCohorts(data.cohorts || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/cohorts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            if (res.ok) {
                alert('Camada creada exitosamente');
                setForm({ code: '', startDate: '', endDate: '' });
                fetchCohorts();
            } else {
                const data = await res.json();
                alert(data.error || 'Error al crear camada');
            }
        } catch (error) {
            alert('Error de conexión');
        }
    };

    const handleDelete = async (id: string, code: string) => {
        if (!confirm(`¿Eliminar la camada ${code}? No debe tener usuarios asignados.`)) return;

        try {
            const res = await fetch(`/api/admin/cohorts/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                alert('Camada eliminada');
                fetchCohorts();
            } else {
                const data = await res.json();
                alert(data.error || 'Error al eliminar');
            }
        } catch (error) {
            alert('Error de conexión');
        }
    };

    if (loading) return <p>Cargando camadas...</p>;

    return (
        <div>
            {/* Create Form */}
            <form onSubmit={handleSubmit} style={{ marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Código (Ej: 2024-A)</label>
                    <input
                        type="text"
                        value={form.code}
                        onChange={e => setForm({ ...form, code: e.target.value })}
                        className={styles.searchInput}
                        required
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Fecha Inicio</label>
                    <input
                        type="date"
                        value={form.startDate}
                        onChange={e => setForm({ ...form, startDate: e.target.value })}
                        className={styles.searchInput}
                        required
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Fecha Fin</label>
                    <input
                        type="date"
                        value={form.endDate}
                        onChange={e => setForm({ ...form, endDate: e.target.value })}
                        className={styles.searchInput}
                        required
                    />
                </div>
                <button type="submit" className={styles.btn + ' ' + styles.btnSuccess}>
                    + Crear Camada
                </button>
            </form>

            {/* List */}
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Inicio</th>
                        <th>Fin</th>
                        <th>Usuarios</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {cohorts.map(c => (
                        <tr key={c.id}>
                            <td><strong>{c.code}</strong></td>
                            <td>{new Date(c.startDate).toLocaleDateString()}</td>
                            <td>{new Date(c.endDate).toLocaleDateString()}</td>
                            <td>{c._count?.users || 0}</td>
                            <td>
                                <button
                                    onClick={() => handleDelete(c.id, c.code)}
                                    className={styles.btn + ' ' + styles.btnDanger}
                                    style={{ padding: '4px 8px', fontSize: '12px' }}
                                    disabled={c._count?.users > 0}
                                    title={c._count?.users > 0 ? "No se puede eliminar camada con usuarios" : "Eliminar"}
                                >
                                    Eliminar
                                </button>
                            </td>
                        </tr>
                    ))}
                    {cohorts.length === 0 && (
                        <tr>
                            <td colSpan={5} style={{ textAlign: 'center', color: '#666' }}>No hay camadas registradas</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
