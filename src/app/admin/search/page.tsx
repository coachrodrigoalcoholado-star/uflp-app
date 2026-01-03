'use client';

import { useState } from 'react';
import styles from '../admin.module.css';
import Link from 'next/link';

interface SearchResults {
    users: any[];
    documents: any[];
    payments: any[];
}

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [type, setType] = useState('');
    const [results, setResults] = useState<SearchResults>({ users: [], documents: [], payments: [] });
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!query.trim()) {
            alert('Por favor ingresa un término de búsqueda');
            return;
        }

        setLoading(true);
        setSearched(true);

        const params = new URLSearchParams();
        params.append('q', query);
        if (type) params.append('type', type);

        const res = await fetch(`/api/admin/search?${params}`);
        const data = await res.json();
        setResults(data);
        setLoading(false);
    };

    const totalResults = results.users.length + results.documents.length + results.payments.length;

    return (
        <>
            <div className={styles.topBar}>
                <h1 className={styles.pageTitle}>Búsqueda Avanzada</h1>
                <div className={styles.topBarActions}>
                    <Link href="/admin" className={styles.btn + ' ' + styles.btnSecondary}>
                        ← Volver al Dashboard
                    </Link>
                </div>
            </div>

            <div className={styles.contentArea}>
                {/* Search Form */}
                <div className={styles.card}>
                    <form onSubmit={handleSearch}>
                        <div className={styles.searchBar}>
                            <input
                                type="text"
                                className={styles.searchInput}
                                placeholder="Buscar usuarios, documentos, pagos..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            <select
                                className={styles.filterSelect}
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                            >
                                <option value="">Buscar en todo</option>
                                <option value="users">Solo usuarios</option>
                                <option value="documents">Solo documentos</option>
                                <option value="payments">Solo pagos</option>
                            </select>
                            <button type="submit" className={styles.btn + ' ' + styles.btnPrimary} disabled={loading}>
                                {loading ? 'Buscando...' : 'Buscar'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Results */}
                {searched && !loading && (
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>
                            {totalResults} resultado{totalResults !== 1 ? 's' : ''} encontrado{totalResults !== 1 ? 's' : ''}
                        </h2>
                    </div>
                )}

                {/* Users Results */}
                {results.users.length > 0 && (
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>Usuarios ({results.users.length})</h2>
                        </div>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Email</th>
                                    <th>Rol</th>
                                    <th>Fecha Registro</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.users.map((user) => (
                                    <tr key={user.id}>
                                        <td>
                                            {user.firstName
                                                ? `${user.firstName} ${user.lastNamePaterno || ''}`
                                                : 'Sin nombre'}
                                        </td>
                                        <td>{user.email}</td>
                                        <td>
                                            <span className={user.role === 'SUPERADMIN' ? styles.badgeApproved : styles.badgePending}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td>{new Date(user.createdAt).toLocaleDateString('es-ES')}</td>
                                        <td>
                                            <Link
                                                href={`/admin/users/${user.id}`}
                                                className={styles.btn + ' ' + styles.btnPrimary}
                                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                            >
                                                Ver perfil
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Documents Results */}
                {results.documents.length > 0 && (
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>Documentos ({results.documents.length})</h2>
                        </div>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Tipo</th>
                                    <th>Usuario</th>
                                    <th>Estado</th>
                                    <th>Fecha</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.documents.map((doc) => (
                                    <tr key={doc.id}>
                                        <td>{doc.type}</td>
                                        <td>
                                            {doc.user.firstName
                                                ? `${doc.user.firstName} ${doc.user.lastNamePaterno || ''}`
                                                : doc.user.email}
                                        </td>
                                        <td>
                                            <span
                                                className={
                                                    doc.status === 'APPROVED'
                                                        ? styles.badgeApproved
                                                        : doc.status === 'REJECTED'
                                                            ? styles.badgeRejected
                                                            : styles.badgePending
                                                }
                                            >
                                                {doc.status}
                                            </span>
                                        </td>
                                        <td>{new Date(doc.createdAt).toLocaleDateString('es-ES')}</td>
                                        <td>
                                            <a
                                                href={doc.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={styles.btn + ' ' + styles.btnSecondary}
                                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                            >
                                                Ver documento
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Payments Results */}
                {results.payments.length > 0 && (
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>Pagos ({results.payments.length})</h2>
                        </div>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Monto</th>
                                    <th>Usuario</th>
                                    <th>Fecha</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.payments.map((payment) => (
                                    <tr key={payment.id}>
                                        <td>
                                            <strong>${payment.amount}</strong>
                                        </td>
                                        <td>
                                            {payment.user.firstName
                                                ? `${payment.user.firstName} ${payment.user.lastNamePaterno || ''}`
                                                : payment.user.email}
                                        </td>
                                        <td>{new Date(payment.date).toLocaleDateString('es-ES')}</td>
                                        <td>
                                            <span
                                                className={
                                                    payment.status === 'APPROVED'
                                                        ? styles.badgeApproved
                                                        : payment.status === 'REJECTED'
                                                            ? styles.badgeRejected
                                                            : styles.badgePending
                                                }
                                            >
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td>
                                            {payment.url && (
                                                <a
                                                    href={payment.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={styles.btn + ' ' + styles.btnSecondary}
                                                    style={{ padding: '6px 12px', fontSize: '12px' }}
                                                >
                                                    Ver comprobante
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {searched && !loading && totalResults === 0 && (
                    <div className={styles.card}>
                        <p style={{ color: '#6b7280', textAlign: 'center', padding: '32px' }}>
                            No se encontraron resultados para "{query}"
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}
