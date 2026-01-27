'use client';

import { useState, useEffect } from 'react';
import styles from '../../admin.module.css';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { MessageCircle, Download, CheckCircle, Trash2, Eye } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface UserData {
    id: string;
    email: string;
    role: string;
    firstName: string | null;
    lastNamePaterno: string | null;
    lastNameMaterno: string | null;
    dob: string | null;
    sex: string | null;
    age: number | null;
    birthPlace: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    zipCode: string | null;
    phone: string | null;
    landline: string | null;
    alternativeEmail: string | null;
    profession: string | null;
    educationLevel: string | null;
    institution: string | null;
    currentOccupation: string | null;
    profileCompleted: boolean;
    documentsCompleted: boolean;
    createdAt: string;
    documents: any[];
    payments: any[];
    cohortId?: string;
}

export default function UserDetailPage() {
    const params = useParams();
    const { data: session } = useSession();
    const isAuditor = session?.user?.role === 'AUDITOR';

    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [notificationForm, setNotificationForm] = useState({
        title: '',
        message: '',
        type: 'INFO'
    });
    const [sending, setSending] = useState(false);
    const [cohorts, setCohorts] = useState<any[]>([]);

    useEffect(() => {
        fetchUser();
        fetchCohorts();
    }, []);

    const fetchUser = async () => {
        try {
            const res = await fetch(`/api/admin/users/${params.id}`);
            const data = await res.json();
            setUser(data.user);
        } catch (error) {
            console.error('Error fetching user:', error);
        } finally {
            setLoading(false);
        }
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

    const handleRoleChange = async (newRole: string) => {
        if (!confirm(`¿Cambiar el rol del usuario a ${newRole}?`)) return;

        try {
            const res = await fetch('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?.id, role: newRole }),
            });

            if (res.ok) {
                alert('Rol actualizado exitosamente');
                fetchUser();
            }
        } catch (error) {
            alert('Error al actualizar rol');
        }
    };

    const handleCohortChange = async (cohortId: string) => {
        if (!confirm('¿Asignar usuario a esta camada?')) return;

        try {
            const res = await fetch('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?.id, cohortId }),
            });

            if (res.ok) {
                alert('Camada actualizada exitosamente');
                fetchUser();
            } else {
                const data = await res.json();
                alert(data.error || 'Error actualizando camada');
            }
        } catch (error) {
            alert('Error al actualizar camada');
        }
    };

    const sendNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);

        try {
            const res = await fetch('/api/admin/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    ...notificationForm,
                }),
            });

            if (res.ok) {
                alert('Notificación enviada exitosamente');
                setNotificationForm({ title: '', message: '', type: 'INFO' });
            }
        } catch (error) {
            alert('Error al enviar notificación');
        }
        setSending(false);
    };

    const handleApprovePayment = async (paymentId: string) => {
        if (!confirm("Esto aprobará el pago y ELIMINARÁ el comprobante de la nube (debes haberlo descargado ya). ¿Continuar?")) return;

        try {
            const res = await fetch(`/api/admin/payments/${paymentId}/approve`, { method: 'POST' });
            if (res.ok) {
                alert("Pago aprobado correctamente.");
                fetchUser();
            } else {
                alert("Error al aprobar pago.");
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión.");
        }
    };

    // Keep handlePaymentStatus for legacy or specific partial updates if needed, though mostly superseded by handleApprovePayment
    const handlePaymentStatus = async (paymentId: string, status: string) => {
        const action = status === 'APPROVED' ? 'aprobar' : status === 'REJECTED' ? 'rechazar' : 'cambiar a pendiente';
        let rejectionReason = '';

        if (status === 'REJECTED') {
            rejectionReason = prompt('Motivo del rechazo:') || '';
            if (!rejectionReason) return; // Cancel if no reason provided for rejection
        }

        if (!confirm(`¿Estás seguro de que deseas ${action} este pago?`)) return;

        try {
            // Using review endpoint to trigger notifications
            const res = await fetch(`/api/admin/payments/${paymentId}/review`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, rejectionReason }),
            });

            if (res.ok) {
                alert(`Pago ${status === 'APPROVED' ? 'aprobado' : 'actualizado'} exitosamente`);
                fetchUser();
            } else {
                alert('Error al actualizar el pago');
            }
        } catch (error) {
            console.error(error);
            alert('Error al conectar con el servidor');
        }
    };

    const handleDeletePayment = async (paymentId: string) => {
        if (!confirm('¿Estás seguro de eliminar este pago? Esta acción no se puede deshacer.')) return;

        try {
            const res = await fetch(`/api/admin/payments/${paymentId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                alert('Pago eliminado correctamente');
                fetchUser();
            } else {
                alert('Error al eliminar el pago');
            }
        } catch (error) {
            console.error(error);
            alert('Error al intentar eliminar');
        }
    };

    if (loading) {
        return (
            <div className={styles.contentArea}>
                <p>Cargando usuario...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className={styles.contentArea}>
                <p>Usuario no encontrado</p>
            </div>
        );
    }

    const fullName = user.firstName
        ? `${user.firstName} ${user.lastNamePaterno || ''} ${user.lastNameMaterno || ''}`
        : user.email;

    return (
        <>
            <div className={styles.topBar}>
                <h1 className={styles.pageTitle}>{fullName}</h1>
                <div className={styles.topBarActions}>
                    <Link href="/admin/users" className={styles.btn + ' ' + styles.btnSecondary}>
                        ← Volver a Usuarios
                    </Link>
                </div>
            </div>

            <div className={styles.contentArea}>
                {/* User Info */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Información del Usuario</h2>
                        {!isAuditor ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Cambiar Rol:</span>
                                <select
                                    value={user.role}
                                    onChange={(e) => handleRoleChange(e.target.value)}
                                    className={styles.filterSelect}
                                >
                                    <option value="STUDENT">Estudiante</option>
                                    <option value="AUDITOR">Auditor</option>
                                    <option value="SUPERADMIN">Superadmin</option>
                                </select>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Rol:</span>
                                <span>{user.role}</span>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                        <div>
                            <strong>Email:</strong> {user.email}
                        </div>
                        <div>
                            <strong>Rol:</strong>{' '}
                            <span className={user.role === 'SUPERADMIN' ? styles.badgeApproved : styles.badgePending}>
                                {user.role}
                            </span>
                        </div>
                        <div>
                            <strong>Perfil:</strong>{' '}
                            <span className={user.profileCompleted ? styles.badgeApproved : styles.badgePending}>
                                {user.profileCompleted ? 'Completo' : 'Incompleto'}
                            </span>
                        </div>
                        <div>
                            <strong>Documentos:</strong>{' '}
                            <span className={user.documentsCompleted ? styles.badgeApproved : styles.badgePending}>
                                {user.documentsCompleted ? 'Completo' : 'Incompleto'}
                            </span>
                        </div>
                        <div>
                            <strong>Fecha de registro:</strong> {new Date(user.createdAt).toLocaleDateString('es-ES')}
                        </div>
                        {user.phone && (
                            <div>
                                <strong>Teléfono:</strong> {user.phone}
                            </div>
                        )}
                        {user.address && (
                            <div>
                                <strong>Dirección:</strong> {user.address}, {user.city}
                            </div>
                        )}
                        {user.profession && (
                            <div>
                                <strong>Profesión:</strong> {user.profession}
                            </div>
                        )}
                        {user.educationLevel && (
                            <div>
                                <strong>Nivel educativo:</strong> {user.educationLevel}
                            </div>
                        )}
                        {user.institution && (
                            <div>
                                <strong>Institución:</strong> {user.institution}
                            </div>
                        )}

                        <div style={{ gridColumn: '1 / -1', marginTop: '16px', borderTop: '1px solid #eee', paddingTop: '16px' }}>
                            <label style={{ fontWeight: 'bold', marginRight: '10px' }}>Camada Asignada:</label>
                            <select
                                value={user.cohortId || ''}
                                onChange={(e) => handleCohortChange(e.target.value)}
                                className={styles.filterSelect}
                                style={{ maxWidth: '200px' }}
                                disabled={isAuditor}
                            >
                                <option value="">Sin asignar</option>
                                {cohorts.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.code} ({new Date(c.startDate).toLocaleDateString()} - {new Date(c.endDate).toLocaleDateString()})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Documents Section */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Documentos ({user.documents.length})</h2>
                        {user.documents.length > 0 && (
                            <a
                                href={`/api/admin/users/${user.id}/documents/zip`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.btn + ' ' + styles.btnSecondary}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '0.9rem',
                                    padding: '6px 12px',
                                    textDecoration: 'none'
                                }}
                            >
                                📥 Descargar Todo (ZIP)
                            </a>
                        )}
                    </div>

                    {user.documents.length === 0 ? (
                        <p style={{ color: '#6b7280' }}>No hay documentos cargados</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                            {user.documents.map((doc) => (
                                <div
                                    key={doc.id}
                                    style={{
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        padding: '16px',
                                        background: '#f9fafb',
                                    }}
                                >
                                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{doc.type}</div>
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
                                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                                        {new Date(doc.createdAt).toLocaleDateString('es-ES')}
                                    </div>
                                    {doc.url && (
                                        <a
                                            href={doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.btn + ' ' + styles.btnPrimary}
                                            style={{ marginTop: '8px', padding: '4px 8px', fontSize: '12px', display: 'block', textAlign: 'center' }}
                                            download={`${doc.type} - ${user.firstName || ''} ${user.lastNamePaterno || ''}`}
                                        >
                                            Ver documento
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Payments Section */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Pagos ({user.payments.length})</h2>
                    </div>

                    {user.payments.length === 0 ? (
                        <p style={{ color: '#6b7280' }}>No hay pagos registrados</p>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Monto</th>
                                    <th>Fecha</th>
                                    <th>Método</th>
                                    <th>Recibido por</th>
                                    <th>Estado</th>
                                    <th>Comprobante</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {user.payments.map((payment) => (
                                    <tr key={payment.id}>
                                        <td>
                                            <strong>${payment.amount}</strong>
                                        </td>
                                        <td>{new Date(payment.date).toLocaleDateString('es-ES')}</td>
                                        <td>{payment.method || '-'}</td>
                                        <td>{payment.payerName || '-'}</td>
                                        <td>
                                            <span style={{
                                                padding: '2px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600,
                                                backgroundColor: payment.status === 'APPROVED' ? '#dcfce7' : '#ffedd5',
                                                color: payment.status === 'APPROVED' ? '#166534' : '#9a3412'
                                            }}>
                                                {payment.status === 'APPROVED' ? 'Aprobado' : 'Pendiente'}
                                            </span>
                                        </td>
                                        <td>
                                            {payment.url ? (
                                                <a
                                                    href={payment.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2563eb', fontWeight: 500 }}
                                                    download
                                                >
                                                    <Download size={14} /> Ver Archivo
                                                </a>
                                            ) : (
                                                <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Sin archivo</span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                {/* View/Download Buttons */}
                                                {/* View/Download Buttons - ALWAYS RENDERED */}
                                                <a
                                                    href={payment.url || '#'}
                                                    target={payment.url ? "_blank" : "_self"}
                                                    rel="noopener noreferrer"
                                                    title={payment.url ? "Ver archivo" : "Sin archivo"}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                                                        padding: '6px 10px',
                                                        backgroundColor: payment.url ? '#eff6ff' : '#f3f4f6',
                                                        color: payment.url ? '#2563eb' : '#9ca3af',
                                                        borderRadius: '6px',
                                                        textDecoration: 'none',
                                                        border: payment.url ? '1px solid #bfdbfe' : '1px solid #e5e7eb',
                                                        cursor: payment.url ? 'pointer' : 'not-allowed',
                                                        pointerEvents: payment.url ? 'auto' : 'none',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    <Eye size={14} /> Ver
                                                </a>
                                                <a
                                                    href={payment.url || '#'}
                                                    download={!!payment.url}
                                                    title={payment.url ? "Descargar archivo" : "Sin archivo"}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                                                        padding: '6px 10px',
                                                        backgroundColor: payment.url ? '#eff6ff' : '#f3f4f6',
                                                        color: payment.url ? '#2563eb' : '#9ca3af',
                                                        borderRadius: '6px',
                                                        textDecoration: 'none',
                                                        border: payment.url ? '1px solid #bfdbfe' : '1px solid #e5e7eb',
                                                        cursor: payment.url ? 'pointer' : 'not-allowed',
                                                        pointerEvents: payment.url ? 'auto' : 'none',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    <Download size={14} /> Bajar
                                                </a>

                                                {payment.status !== 'APPROVED' && !isAuditor && (
                                                    <button
                                                        onClick={() => handleApprovePayment(payment.id)}
                                                        title="Aprobar (Guarda y Borra archivo)"
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '4px',
                                                            backgroundColor: '#16a34a', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem'
                                                        }}
                                                    >
                                                        <CheckCircle size={14} /> Aprobar
                                                    </button>
                                                )}

                                                {payment.status === 'APPROVED' && user.phone && (
                                                    <a
                                                        href={`https://wa.me/${user.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${user.firstName}, confirmo la recepción de tu pago de $${payment.amount}. ¡Gracias!`)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={styles.btn}
                                                        style={{
                                                            padding: '4px 8px',
                                                            fontSize: '12px',
                                                            backgroundColor: '#25D366',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            textDecoration: 'none'
                                                        }}
                                                        title="Enviar confirmación por WhatsApp"
                                                    >
                                                        <MessageCircle size={14} />
                                                        <span>WA</span>
                                                    </a>
                                                )}
                                                {!isAuditor && (
                                                    <button
                                                        onClick={() => handleDeletePayment(payment.id)}
                                                        className={styles.btn + ' ' + styles.btnDanger}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '4px',
                                                            padding: '6px 10px', fontSize: '0.75rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'
                                                        }}
                                                        title="Eliminar registro de pago"
                                                    >
                                                        <Trash2 size={14} /> Eliminar
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Send Notification */}
                {!isAuditor && (
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>Enviar Notificación</h2>
                        </div>

                        <form onSubmit={sendNotification}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Título</label>
                                <input
                                    type="text"
                                    className={styles.searchInput}
                                    value={notificationForm.title}
                                    onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                                    required
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Mensaje</label>
                                <textarea
                                    className={styles.searchInput}
                                    value={notificationForm.message}
                                    onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                                    required
                                    rows={4}
                                    style={{ width: '100%', fontFamily: 'inherit' }}
                                />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Tipo</label>
                                <select
                                    className={styles.filterSelect}
                                    value={notificationForm.type}
                                    onChange={(e) => setNotificationForm({ ...notificationForm, type: e.target.value })}
                                >
                                    <option value="INFO">Info</option>
                                    <option value="SUCCESS">Éxito</option>
                                    <option value="WARNING">Advertencia</option>
                                    <option value="ERROR">Error</option>
                                </select>
                            </div>

                            <button type="submit" className={styles.btn + ' ' + styles.btnSuccess} disabled={sending}>
                                {sending ? 'Enviando...' : 'Enviar Notificación'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </>
    );
}
