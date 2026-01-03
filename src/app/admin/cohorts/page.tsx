'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import styles from '../admin.module.css';

interface User {
    id: string;
    firstName: string | null;
    lastNamePaterno: string | null;
    lastNameMaterno: string | null;
    email: string;
}

interface Cohort {
    id: string;
    code: string;
    startDate: string;
    endDate: string;
    users: User[];
    _count?: {
        users: number;
    };
}

export default function CohortsPage() {
    const { data: session } = useSession();
    const isAuditor = session?.user?.role === 'AUDITOR';
    const [cohorts, setCohorts] = useState<Cohort[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
    const [editingCohort, setEditingCohort] = useState<Cohort | null>(null);
    const [selectedCohortUsers, setSelectedCohortUsers] = useState<Cohort | null>(null);

    const [formData, setFormData] = useState({
        code: '',
        startDate: '',
        endDate: '',
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
            console.error('Error fetching cohorts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingCohort
                ? `/api/admin/cohorts/${editingCohort.id}`
                : '/api/admin/cohorts';

            const method = editingCohort ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error saving cohort');
            }

            setIsModalOpen(false);
            setEditingCohort(null);
            setFormData({ code: '', startDate: '', endDate: '' });
            fetchCohorts();
            alert(editingCohort ? 'Camada actualizada' : 'Camada creada');
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleDelete = async (id: string, userCount: number) => {
        if (userCount > 0) {
            alert('No se puede eliminar una camada con alumnos asignados.');
            return;
        }
        if (!confirm('¿Estás seguro de eliminar esta camada?')) return;

        try {
            const res = await fetch(`/api/admin/cohorts/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                fetchCohorts();
            } else {
                const data = await res.json();
                alert(data.error);
            }
        } catch (error) {
            alert('Error deleting cohort');
        }
    };

    const openModal = (cohort?: Cohort) => {
        if (cohort) {
            setEditingCohort(cohort);
            setFormData({
                code: cohort.code,
                startDate: new Date(cohort.startDate).toISOString().split('T')[0],
                endDate: new Date(cohort.endDate).toISOString().split('T')[0],
            });
        } else {
            setEditingCohort(null);
            setFormData({ code: '', startDate: '', endDate: '' });
        }
        setIsModalOpen(true);
    };

    const openUsersModal = (cohort: Cohort) => {
        setSelectedCohortUsers(cohort);
        setIsUsersModalOpen(true);
    };

    return (
        <>
            <div className={styles.topBar}>
                <h1 className={styles.pageTitle}>Gestión de Camadas</h1>
                <div className={styles.topBarActions}>
                    {!isAuditor && (
                        <button
                            className={styles.btn + ' ' + styles.btnPrimary}
                            onClick={() => openModal()}
                        >
                            + Nueva Camada
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.contentArea}>
                <div className={styles.card}>
                    {loading ? (
                        <p>Cargando...</p>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Inicio</th>
                                    <th>Fin</th>
                                    <th>Alumnos</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cohorts.map((cohort) => (
                                    <tr key={cohort.id}>
                                        <td><strong>{cohort.code}</strong></td>
                                        <td>{new Date(cohort.startDate).toLocaleDateString()}</td>
                                        <td>{new Date(cohort.endDate).toLocaleDateString()}</td>
                                        <td>
                                            <span style={{ marginRight: '10px' }}>{cohort._count?.users || 0}</span>
                                            {cohort._count?.users! > 0 && (
                                                <button
                                                    onClick={() => openUsersModal(cohort)}
                                                    style={{ background: 'none', border: 'none', color: '#3182ce', cursor: 'pointer', textDecoration: 'underline', fontSize: '12px' }}
                                                >
                                                    Ver lista
                                                </button>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {!isAuditor && (
                                                    <>
                                                        <button
                                                            onClick={() => openModal(cohort)}
                                                            className={styles.btn + ' ' + styles.btnSecondary}
                                                            style={{ padding: '4px 8px', fontSize: '12px' }}
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(cohort.id, cohort._count?.users || 0)}
                                                            className={styles.btn + ' ' + styles.btnDanger}
                                                            style={{ padding: '4px 8px', fontSize: '12px' }}
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {cohorts.length === 0 && (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                                            No hay camadas registradas.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal Create/Edit */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className={styles.card} style={{ width: '400px', margin: '20px' }}>
                        <h2 className={styles.cardTitle}>
                            {editingCohort ? 'Editar Camada' : 'Nueva Camada'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Código</label>
                                <input
                                    type="text"
                                    required
                                    className={styles.searchInput}
                                    style={{ width: '100%' }}
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                                    placeholder="Ej: G3"
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Fecha Inicio</label>
                                <input
                                    type="date"
                                    required
                                    className={styles.searchInput}
                                    style={{ width: '100%' }}
                                    value={formData.startDate}
                                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Fecha Fin</label>
                                <input
                                    type="date"
                                    required
                                    className={styles.searchInput}
                                    style={{ width: '100%' }}
                                    value={formData.endDate}
                                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    className={styles.btn + ' ' + styles.btnSecondary}
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className={styles.btn + ' ' + styles.btnPrimary}
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal View Users */}
            {isUsersModalOpen && selectedCohortUsers && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className={styles.card} style={{ width: '500px', margin: '20px', maxHeight: '80vh', overflowY: 'auto' }}>
                        <h2 className={styles.cardTitle}>Alumnos en {selectedCohortUsers.code}</h2>

                        <div style={{ marginTop: '16px' }}>
                            {selectedCohortUsers.users && selectedCohortUsers.users.length > 0 ? (
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {selectedCohortUsers.users.map(user => (
                                        <li key={user.id} style={{ padding: '8px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>
                                                {user.firstName} {user.lastNamePaterno} {user.lastNameMaterno}
                                            </span>
                                            <span style={{ color: '#718096', fontSize: '0.9em' }}>
                                                {user.email}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>No hay alumnos en esta lista.</p>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <button
                                type="button"
                                className={styles.btn + ' ' + styles.btnSecondary}
                                onClick={() => setIsUsersModalOpen(false)}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
