'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import styles from '../admin.module.css';
import Link from 'next/link';

interface Document {
    id: string;
    type: string;
    url: string;
    status: string;
    rejectionReason: string | null;
    createdAt: string;
    user: {
        id: string;
        email: string;
        firstName: string | null;
        lastNamePaterno: string | null;
    };
}

export default function DocumentsPage() {
    const { data: session } = useSession();
    const isAuditor = session?.user?.role === 'AUDITOR';
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('PENDING');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [reviewing, setReviewing] = useState(false);

    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            fetchDocuments();
            return;
        }

        const timer = setTimeout(() => {
            fetchDocuments();
        }, 500);
        return () => clearTimeout(timer);
    }, [statusFilter, searchQuery]);

    const fetchDocuments = async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (statusFilter) params.append('status', statusFilter);
        if (searchQuery) params.append('search', searchQuery);

        const res = await fetch(`/api/admin/documents?${params}`);
        const data = await res.json();
        setDocuments(data.documents || []);
        setLoading(false);
    };

    const handleReview = async (docId: string, status: 'APPROVED' | 'REJECTED') => {
        if (status === 'REJECTED' && !rejectionReason) {
            alert('Por favor ingresa una razón para el rechazo');
            return;
        }

        setReviewing(true);

        if (status === 'APPROVED') {
            const doc = documents.find(d => d.id === docId);
            if (doc) {
                try {
                    // 1. Fetch file via proxy to avoid CORS
                    const response = await fetch(`/api/proxy-file?url=${encodeURIComponent(doc.url)}`);
                    if (!response.ok) throw new Error('Proxy fetch failed');

                    const blob = await response.blob();

                    // 2. Determine filename
                    // Try to get extension from URL or MIME type
                    let ext = doc.url.split('.').pop()?.split('?')[0] || 'pdf'; // Default to pdf if unknown
                    if (ext.length > 4) ext = 'pdf';

                    // Clean up document type: replace underscores with spaces and uppercase
                    const cleanType = doc.type.replace(/_/g, ' ').toUpperCase();
                    const userName = `${doc.user.firstName || ''} ${doc.user.lastNamePaterno || ''}`.trim() || doc.user.email;

                    const filename = `${userName} - ${cleanType}.${ext}`;

                    // 3. Trigger download
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);

                } catch (error) {
                    console.error('Error downloading file:', error);
                    if (!confirm('No se pudo descargar el archivo automáticamente. ¿Deseas continuar con la aprobación y eliminación del archivo de todos modos?')) {
                        setReviewing(false);
                        return;
                    }
                }
            }
        }

        try {
            const res = await fetch(`/api/admin/documents/${docId}/review`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, rejectionReason }),
            });

            if (res.ok) {
                alert(`Documento ${status === 'APPROVED' ? 'aprobado' : 'rechazado'} exitosamente`);
                setSelectedDoc(null);
                setRejectionReason('');
                fetchDocuments();
            }
        } catch (error) {
            alert('Error al revisar documento');
        }
        setReviewing(false);
    };

    const handleDelete = async (docId: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este documento? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            const res = await fetch(`/api/documents/${docId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                alert('Documento eliminado exitosamente');
                fetchDocuments();
            } else {
                alert('Error al eliminar el documento');
            }
        } catch (error) {
            alert('Error de conexión');
        }
    };

    return (
        <>
            <div className={styles.topBar}>
                <h1 className={styles.pageTitle}>Revisión de Documentos</h1>
                <div className={styles.topBarActions}>
                    <Link href="/admin" className={styles.btn + ' ' + styles.btnSecondary}>
                        ← Volver al Dashboard
                    </Link>
                </div>
            </div>

            <div className={styles.contentArea}>
                {/* Filters */}
                <div className={styles.card}>
                    <div className={styles.searchBar} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <select
                            className={styles.filterSelect}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ flex: '0 0 auto' }}
                        >
                            <option value="">Todos los estados</option>
                            <option value="PENDING">Pendientes</option>
                            <option value="APPROVED">Aprobados</option>
                            <option value="REJECTED">Rechazados</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Buscar por usuario (nombre, apellido, email)..."
                            className={styles.searchInput}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ flex: '1' }}
                        />
                    </div>
                </div>

                {/* Documents List */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>
                            {documents.length} documento{documents.length !== 1 ? 's' : ''}
                        </h2>
                    </div>

                    {loading ? (
                        <p>Cargando documentos...</p>
                    ) : documents.length === 0 ? (
                        <p style={{ color: '#6b7280', textAlign: 'center', padding: '32px' }}>
                            No hay documentos {statusFilter ? `con estado ${statusFilter}` : ''}
                            {searchQuery ? ` y búsqueda "${searchQuery}"` : ''}
                        </p>
                    ) : (
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
                                {documents.map((doc) => (
                                    <tr key={doc.id}>
                                        <td>
                                            <strong>{doc.type}</strong>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Link href={`/admin/users/${doc.user.id}`} style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                                                    {doc.user.firstName
                                                        ? `${doc.user.firstName} ${doc.user.lastNamePaterno || ''}`
                                                        : doc.user.email}
                                                </Link>
                                                <button
                                                    onClick={() => window.open(`/api/admin/users/${doc.user.id}/documents/zip`, '_blank')}
                                                    title="Descargar todos los documentos aprobados de este usuario (ZIP)"
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        fontSize: '1.2rem',
                                                        padding: '0 4px',
                                                        lineHeight: 1
                                                    }}
                                                >
                                                    📦
                                                </button>
                                                {!isAuditor && (
                                                    <button
                                                        onClick={async () => {
                                                            if (confirm(`¿Aprobar TODOS los documentos pendientes de ${doc.user.firstName || doc.user.email}?`)) {
                                                                try {
                                                                    const res = await fetch(`/api/admin/users/${doc.user.id}/documents/approve-all`, { method: 'PUT' });
                                                                    if (res.ok) {
                                                                        const data = await res.json();
                                                                        alert(`Se aprobaron ${data.count} documento(s) exitosamente.`);
                                                                        fetchDocuments();
                                                                    } else {
                                                                        alert('Error al aprobar documentos.');
                                                                    }
                                                                } catch (err) {
                                                                    console.error(err);
                                                                    alert('Error de conexión.');
                                                                }
                                                            }
                                                        }}
                                                        title="Aprobar TODOS los documentos pendientes"
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            fontSize: '1.2rem',
                                                            padding: '0 4px',
                                                            lineHeight: 1
                                                        }}
                                                    >
                                                        ✅
                                                    </button>
                                                )}
                                            </div>
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
                                                {doc.status === "APPROVED" ? "Aprobado" : doc.status === "REJECTED" ? "Rechazado" : "Pendiente"}
                                            </span>
                                        </td>
                                        <td>{new Date(doc.createdAt).toLocaleDateString('es-ES')}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                {doc.status !== 'APPROVED' ? (
                                                    <>
                                                        <a
                                                            href={doc.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={styles.btn + ' ' + styles.btnSecondary}
                                                            style={{ padding: '6px 12px', fontSize: '12px' }}
                                                        >
                                                            Ver
                                                        </a>
                                                        <a
                                                            href={doc.url}
                                                            download={`${doc.type} - ${doc.user.firstName || ''} ${doc.user.lastNamePaterno || ''}`}
                                                            className={styles.btn + ' ' + styles.btnSecondary}
                                                            style={{ padding: '6px 12px', fontSize: '12px' }}
                                                        >
                                                            Descargar
                                                        </a>
                                                    </>
                                                ) : (
                                                    <span style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        🔒 Aprobado
                                                    </span>
                                                )}

                                                {!isAuditor && (
                                                    <button
                                                        onClick={() => handleDelete(doc.id)}
                                                        className={styles.btn + ' ' + styles.btnDanger}
                                                        style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: '#dc2626' }}
                                                    >
                                                        Eliminar
                                                    </button>
                                                )}

                                                {!isAuditor && doc.status === 'PENDING' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleReview(doc.id, 'APPROVED')}
                                                            className={styles.btn + ' ' + styles.btnSuccess}
                                                            style={{ padding: '6px 12px', fontSize: '12px' }}
                                                            disabled={reviewing}
                                                        >
                                                            Aprobar
                                                        </button>
                                                        <button
                                                            onClick={() => setSelectedDoc(doc)}
                                                            className={styles.btn + ' ' + styles.btnDanger}
                                                            style={{ padding: '6px 12px', fontSize: '12px' }}
                                                        >
                                                            Rechazar
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div >

            {/* Rejection Modal */}
            {
                selectedDoc && (
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                        }}
                        onClick={() => setSelectedDoc(null)}
                    >
                        <div
                            className={styles.card}
                            style={{ maxWidth: '500px', margin: '20px' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className={styles.cardTitle}>Rechazar Documento</h2>
                            <p style={{ marginBottom: '16px' }}>
                                Rechazando: <strong>{selectedDoc.type}</strong>
                            </p>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                    Razón del rechazo
                                </label>
                                <textarea
                                    className={styles.searchInput}
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    rows={4}
                                    style={{ width: '100%', fontFamily: 'inherit' }}
                                    placeholder="Explica por qué este documento fue rechazado..."
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => {
                                        setSelectedDoc(null);
                                        setRejectionReason('');
                                    }}
                                    className={styles.btn + ' ' + styles.btnSecondary}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleReview(selectedDoc.id, 'REJECTED')}
                                    className={styles.btn + ' ' + styles.btnDanger}
                                    disabled={reviewing || !rejectionReason}
                                >
                                    {reviewing ? 'Rechazando...' : 'Confirmar Rechazo'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
}
