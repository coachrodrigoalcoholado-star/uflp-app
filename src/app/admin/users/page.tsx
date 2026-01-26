'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import styles from '../admin.module.css';
import Link from 'next/link';

interface User {
    id: string;
    email: string;
    firstName: string | null;
    lastNamePaterno: string | null;
    lastNameMaterno: string | null;
    role: string;
    profileCompleted: boolean;
    documentsCompleted: boolean;
    createdAt: string;
    cohort?: {
        id: string;
        code: string;
    };
    _count: {
        documents: number;
        payments: number;
    };
}

export default function UsersPage() {
    const { data: session } = useSession();
    const isAuditor = session?.user?.role === 'AUDITOR';
    const [users, setUsers] = useState<User[]>([]);
    const [cohorts, setCohorts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [profileFilter, setProfileFilter] = useState('');

    useEffect(() => {
        fetchUsers();
        fetchCohorts();
    }, [search, roleFilter, profileFilter]);

    const fetchUsers = async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (roleFilter) params.append('role', roleFilter);
        if (profileFilter) params.append('profileCompleted', profileFilter);

        const res = await fetch(`/api/admin/users?${params}`);
        const data = await res.json();
        setUsers(data.users || []);
        setLoading(false);
    };

    const fetchCohorts = async () => {
        try {
            const res = await fetch('/api/admin/cohorts');
            const data = await res.json();
            setCohorts(data.cohorts || []);
        } catch (error) {
            console.error('Error fetching cohorts:', error);
        }
    };

    const handleCohortChange = async (userId: string, cohortId: string) => {
        if (!confirm('¿Estás seguro de cambiar la asignación de camada?')) return;

        try {
            const res = await fetch('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, cohortId }),
            });

            if (res.ok) {
                alert('Camada actualizada exitosamente');
                fetchUsers();
            } else {
                alert('Error al actualizar camada');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al actualizar camada');
        }
    };

    const handleDelete = async (userId: string, userName: string) => {
        if (!confirm(`¿Estás seguro de eliminar al usuario ${userName}?`)) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/users?userId=${userId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                alert('Usuario eliminado exitosamente');
                fetchUsers();
            } else {
                alert('Error al eliminar usuario');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al eliminar usuario');
        }
    };

    const handlePasswordChange = async (userId: string, userName: string) => {
        const newPassword = prompt(`Ingrese la nueva contraseña para ${userName}:`);
        if (!newPassword) return;

        try {
            const res = await fetch('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, password: newPassword }),
            });

            if (res.ok) {
                alert('Contraseña actualizada exitosamente');
            } else {
                alert('Error al actualizar contraseña');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al actualizar contraseña');
        }
    };

    return (
        <>
            <div className={styles.topBar}>
                <h1 className={styles.pageTitle}>Gestión de Usuarios</h1>
                <div className={styles.topBarActions}>
                    <Link href="/admin" className={styles.btn + ' ' + styles.btnSecondary}>
                        ← Volver al Dashboard
                    </Link>
                </div>
            </div>

            <div className={styles.contentArea}>
                {/* Search and Filters */}
                <div className={styles.card}>
                    <div className={styles.searchBar}>
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Buscar por email o nombre..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <select
                            className={styles.filterSelect}
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            <option value="">Todos los roles</option>
                            <option value="STUDENT">Estudiantes</option>
                            <option value="AUDITOR">Auditores</option>
                            <option value="SUPERADMIN">Superadmins</option>
                        </select>
                        <select
                            className={styles.filterSelect}
                            value={profileFilter}
                            onChange={(e) => setProfileFilter(e.target.value)}
                        >
                            <option value="">Todos los perfiles</option>
                            <option value="true">Perfil completado</option>
                            <option value="false">Perfil incompleto</option>
                        </select>
                    </div>
                </div>

                {/* Users Table */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>
                            {users.length} usuario{users.length !== 1 ? 's' : ''} encontrado{users.length !== 1 ? 's' : ''}
                        </h2>
                    </div>

                    {loading ? (
                        <p>Cargando usuarios...</p>
                    ) : users.length === 0 ? (
                        <p style={{ color: '#6b7280', textAlign: 'center', padding: '32px' }}>
                            No se encontraron usuarios
                        </p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Usuario</th>
                                        <th>Email</th>
                                        <th>Rol</th>
                                        {/* <th>Camada</th> */}
                                        <th>Perfil</th>
                                        <th>Documentos</th>
                                        <th>Pagos</th>
                                        <th>Fecha Registro</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id}>
                                            <td>
                                                <strong>
                                                    {user.firstName
                                                        ? `${user.firstName} ${user.lastNamePaterno || ''}`
                                                        : 'Sin nombre'}
                                                </strong>
                                            </td>
                                            <td>{user.email}</td>
                                            <td>
                                                <span className={user.role === 'SUPERADMIN' ? styles.badgeApproved : styles.badgePending}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            {/* <td>
                                                <select
                                                    value={user.cohort?.id || ''}
                                                    onChange={(e) => handleCohortChange(user.id, e.target.value)}
                                                    className={styles.filterSelect}
                                                    disabled={isAuditor}
                                                    style={{
                                                        padding: '4px 8px',
                                                        borderColor: !user.cohort ? '#e53e3e' : '#e2e8f0',
                                                        color: !user.cohort ? '#e53e3e' : 'inherit',
                                                        fontWeight: !user.cohort ? 'bold' : 'normal'
                                                    }}
                                                >
                                                    <option value="" disabled={!!user.cohort} style={{ color: '#e53e3e' }}>
                                                        {user.cohort ? 'Desasignar' : 'Sin Asignar'}
                                                    </option>
                                                    {cohorts.map((c) => (
                                                        <option key={c.id} value={c.id} style={{ color: 'black' }}>
                                                            {c.code}
                                                        </option>
                                                    ))}
                                                    <option value="">(Quitar asignación)</option>
                                                </select>
                                            </td> */}
                                            <td>
                                                <span className={user.profileCompleted ? styles.badgeApproved : styles.badgePending}>
                                                    {user.profileCompleted ? 'Completo' : 'Incompleto'}
                                                </span>
                                            </td>
                                            <td>{user._count.documents}</td>
                                            <td>{user._count.payments}</td>
                                            <td>{new Date(user.createdAt).toLocaleDateString('es-ES')}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <Link
                                                        href={`/admin/users/${user.id}`}
                                                        className={styles.btn + ' ' + styles.btnPrimary}
                                                        style={{ padding: '6px 12px', fontSize: '12px' }}
                                                    >
                                                        Ver
                                                    </Link>
                                                    {!isAuditor && (
                                                        <>
                                                            <button
                                                                onClick={() => handlePasswordChange(user.id, user.firstName || 'Usuario')}
                                                                className={styles.btn + ' ' + styles.btnSecondary}
                                                                style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: '#f59e0b', borderColor: '#d97706', color: 'white' }}
                                                            >
                                                                Contraseña
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(user.id, user.email)}
                                                                className={styles.btn + ' ' + styles.btnDanger}
                                                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                                            >
                                                                Eliminar
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
