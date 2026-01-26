'use client';

import { useState, useEffect, useRef } from 'react';
import styles from '../admin.module.css';
import Link from 'next/link';
import { Eye, Download, CheckCircle, Trash2, X } from 'lucide-react';

interface Payment {
    id: string;
    amount: number;
    status: string;
    date: string;
    method: string | null;
    url: string | null;
}

interface FinancialRecord {
    user: {
        id: string;
        email: string;
        firstName: string | null;
        lastNamePaterno: string | null;
        cohort?: { code: string };
    };
    totalPaid: number;
    payments: Payment[];
    distributionUFLP: string;
    distributionUFLPDate: string | null;
    distributionECOA: string;
    distributionECOADate: string | null;
    distributionCommission: string;
    distributionCommissionDate: string | null;
}

export default function PaymentsPage() {
    const [records, setRecords] = useState<FinancialRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [showOnlyFullyPaid, setShowOnlyFullyPaid] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Config
    const [diplomaCost, setDiplomaCost] = useState('390.00');
    const [distributionUFLP, setDistributionUFLP] = useState('110.00');
    const [distributionECOA, setDistributionECOA] = useState('230.00');
    const [distributionCommission, setDistributionCommission] = useState('50.00');
    const [updatingCost, setUpdatingCost] = useState(false);

    // Date Filters
    const [dateFilterUFLP, setDateFilterUFLP] = useState('');
    const [dateFilterECOA, setDateFilterECOA] = useState('');
    const [dateFilterCommission, setDateFilterCommission] = useState('');

    // Modal State
    const [selectedUserPayments, setSelectedUserPayments] = useState<{ user: string, payments: Payment[] } | null>(null);

    const isFirstRender = useRef(true);

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            fetchFinancials();
            return;
        }

        const timeoutId = setTimeout(() => {
            fetchFinancials();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, dateFilterUFLP, dateFilterECOA, dateFilterCommission]);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings');
            if (res.ok) {
                const data = await res.json();
                if (data.diploma_cost) setDiplomaCost(String(data.diploma_cost));
                if (data.distribution_uflp) setDistributionUFLP(String(data.distribution_uflp));
                if (data.distribution_ecoa) setDistributionECOA(String(data.distribution_ecoa));
                if (data.distribution_commission) setDistributionCommission(String(data.distribution_commission));
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const handleUpdateCost = async () => {
        setUpdatingCost(true);
        try {
            await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'diploma_cost', value: diplomaCost }),
            });
            await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'distribution_uflp', value: distributionUFLP }),
            });
            await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'distribution_ecoa', value: distributionECOA }),
            });
            await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'distribution_commission', value: distributionCommission }),
            });
            alert('Configuración actualizada correctly');
        } catch (error) {
            alert('Error al actualizar configuración');
        } finally {
            setUpdatingCost(false);
        }
    };

    const fetchFinancials = async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (dateFilterUFLP) params.append('uflpDate', dateFilterUFLP);
        if (dateFilterECOA) params.append('ecoaDate', dateFilterECOA);
        if (dateFilterCommission) params.append('commissionDate', dateFilterCommission);

        const res = await fetch(`/api/admin/payments?${params}`);
        const data = await res.json();
        setRecords(data.payments || []);
        setLoading(false);
    };

    const handleDistributionUpdate = async (userId: string, field: string, value: string) => {
        setRecords(prev => prev.map(rec =>
            rec.user.id === userId ? { ...rec, [field]: value } : rec
        ));

        try {
            await fetch(`/api/admin/users/${userId}/financials`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value }),
            });
        } catch (error) {
            console.error('Error updating distribution:', error);
            fetchFinancials();
        }
    };

    // Modal Actions
    const handleApprovePayment = async (paymentId: string, url: string | null) => {
        if (!confirm("Esto aprobará el pago y ELIMINARÁ el comprobante de la nube (debes haberlo descargado ya). ¿Continuar?")) return;

        try {
            const res = await fetch(`/api/admin/payments/${paymentId}/approve`, { method: 'POST' });
            if (res.ok) {
                alert("Pago aprobado correctamente.");
                fetchFinancials();
                setSelectedUserPayments(null);
            } else {
                alert("Error al aprobar pago.");
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión.");
        }
    };

    const handleDeletePayment = async (paymentId: string) => {
        if (!confirm("¿Estás seguro de ELIMINAR este pago y su comprobante? Esta acción no se puede deshacer.")) return;

        try {
            const res = await fetch(`/api/admin/payments/${paymentId}/delete`, { method: 'DELETE' });
            if (res.ok) {
                alert("Pago eliminado.");
                fetchFinancials();
                setSelectedUserPayments(null);
            } else {
                alert("Error al eliminar pago.");
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión.");
        }
    };

    const openPaymentModal = (user: any, payments: Payment[]) => {
        setSelectedUserPayments({ user: `${user.firstName} ${user.lastNamePaterno || ''} (${user.email})`, payments });
    };

    const filteredRecords = records.filter(rec => {
        if (showOnlyFullyPaid) {
            return rec.totalPaid >= (Number(diplomaCost) - 0.1);
        }
        return true;
    });

    const totalUFLP = records.filter(p => p.distributionUFLP === 'PAID').length;
    const totalECOA = records.filter(p => p.distributionECOA === 'PAID').length;
    const totalCommission = records.filter(p => p.distributionCommission === 'PAID').length;

    const amountUFLPVal = totalUFLP * Number(distributionUFLP);
    const amountECOAVal = totalECOA * Number(distributionECOA);
    const amountCommissionVal = totalCommission * Number(distributionCommission);

    return (
        <>
            <div className={styles.topBar}>
                <h1 className={styles.pageTitle}>Verificación de Pagos</h1>
                <div className={styles.topBarActions}>
                    <Link href="/admin" className={styles.btn + ' ' + styles.btnSecondary}>
                        ← Volver al Dashboard
                    </Link>
                </div>
            </div>

            <div className={styles.contentArea}>
                {/* Configuration */}
                <div className={styles.card} style={{ marginBottom: "2rem" }}>
                    <h2 className={styles.cardTitle}>Configuración y Distribución</h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginTop: "1rem", alignItems: "end" }}>
                        {/* Config Inputs ... same as before */}
                        <div>
                            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold", fontSize: "0.9rem" }}>Costo Total</label>
                            <input type="number" value={diplomaCost} onChange={(e) => setDiplomaCost(e.target.value)} className={styles.searchInput} style={{ width: "100%" }} />
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold", fontSize: "0.9rem" }}>UFLP (Monto)</label>
                            <input type="number" value={distributionUFLP} onChange={(e) => setDistributionUFLP(e.target.value)} className={styles.searchInput} style={{ width: "100%" }} />
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold", fontSize: "0.9rem" }}>ECOA (Monto)</label>
                            <input type="number" value={distributionECOA} onChange={(e) => setDistributionECOA(e.target.value)} className={styles.searchInput} style={{ width: "100%" }} />
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold", fontSize: "0.9rem" }}>Comisión (Monto)</label>
                            <input type="number" value={distributionCommission} onChange={(e) => setDistributionCommission(e.target.value)} className={styles.searchInput} style={{ width: "100%" }} />
                        </div>

                        <button
                            onClick={handleUpdateCost}
                            disabled={updatingCost}
                            className={styles.btn + " " + styles.btnSecondary}
                            style={{ height: "42px" }}
                        >
                            {updatingCost ? "Guardando..." : "Guardar Config"}
                        </button>
                    </div>
                </div>

                {/* Dashboard Summary */}
                <div className={styles.card} style={{ marginBottom: "2rem" }}>
                    <h2 className={styles.cardTitle}>Resumen de Distribución (Global)</h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
                        <div style={{ padding: "1rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                            <div style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "0.5rem" }}>Total UFLP</div>
                            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#0f172a" }}>U$S {amountUFLPVal.toLocaleString()}</div>
                            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{totalUFLP} pagos completados</div>
                        </div>
                        <div style={{ padding: "1rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                            <div style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "0.5rem" }}>Total ECOA</div>
                            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#0f172a" }}>U$S {amountECOAVal.toLocaleString()}</div>
                            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{totalECOA} pagos completados</div>
                        </div>
                        <div style={{ padding: "1rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                            <div style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "0.5rem" }}>Total Comisión</div>
                            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#0f172a" }}>U$S {amountCommissionVal.toLocaleString()}</div>
                            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{totalCommission} pagos completados</div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className={styles.card}>
                    <div className={styles.searchBar} style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                            <input
                                type="checkbox"
                                checked={showOnlyFullyPaid}
                                onChange={(e) => setShowOnlyFullyPaid(e.target.checked)}
                                style={{ width: '18px', height: '18px' }}
                            />
                            <span style={{ fontWeight: 500 }}>Mostrar solo pagos al 100%</span>
                        </label>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <input
                                type="text"
                                placeholder="Buscar por usuario..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={styles.searchInput}
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Payments List */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>
                            {filteredRecords.length} estudiante{filteredRecords.length !== 1 ? 's' : ''}
                        </h2>
                    </div>

                    {loading ? (
                        <p>Cargando datos...</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Usuario</th>
                                        <th>Camada</th>
                                        <th>Total Pagado</th>
                                        <th>Progreso</th>
                                        <th>Pago UFLP (U$S {distributionUFLP})</th>
                                        <th>Pago ECOA (U$S {distributionECOA})</th>
                                        <th>Comisión (U$S {distributionCommission})</th>
                                        <th>Detalles</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRecords.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                                                No hay registros
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredRecords.map((rec) => {
                                            const isFullyPaid = rec.totalPaid >= Number(diplomaCost);
                                            const progressColor = isFullyPaid ? '#166534' : '#c2410c';

                                            return (
                                                <tr key={rec.user.id}>
                                                    <td>
                                                        <Link href={`/admin/users/${rec.user.id}`} style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                                                            {rec.user.firstName
                                                                ? `${rec.user.firstName} ${rec.user.lastNamePaterno || ''}`
                                                                : rec.user.email}
                                                        </Link>
                                                    </td>
                                                    <td>
                                                        <span style={{ color: '#999' }}>N/A</span>
                                                        {/* {rec.user.cohort?.code || <span style={{ color: 'red' }}>Sin Asignar</span>} */}
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 'bold' }}>U$S {rec.totalPaid}</div>
                                                    </td>
                                                    <td>
                                                        <span style={{
                                                            color: progressColor,
                                                            fontWeight: 'bold',
                                                            background: isFullyPaid ? '#dcfce7' : '#ffedd5',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            fontSize: '0.8rem'
                                                        }}>
                                                            {isFullyPaid ? '100%' : `${Math.round((rec.totalPaid / Number(diplomaCost)) * 100)}%`}
                                                        </span>
                                                    </td>

                                                    {/* UFLP Distribution */}
                                                    <td>
                                                        <select
                                                            value={rec.distributionUFLP || 'PENDING'}
                                                            onChange={(e) => handleDistributionUpdate(rec.user.id, 'distributionUFLP', e.target.value)}
                                                            className={styles.statusSelect}
                                                            style={{ ...getStatusStyle(rec.distributionUFLP), padding: '4px', borderRadius: '4px', border: '1px solid #ddd' }}
                                                        >
                                                            <option value="PENDING">Pendiente</option>
                                                            <option value="IN_PROCESS">En Proceso</option>
                                                            <option value="PAID">Pagado</option>
                                                        </select>
                                                        {rec.distributionUFLP === 'PAID' && (
                                                            <input
                                                                type="date"
                                                                value={rec.distributionUFLPDate ? rec.distributionUFLPDate.split('T')[0] : ''}
                                                                onChange={(e) => handleDistributionUpdate(rec.user.id, 'distributionUFLPDate', e.target.value)}
                                                                style={{ fontSize: '0.8rem', padding: '2px', width: '100%', marginTop: '5px' }}
                                                            />
                                                        )}
                                                    </td>

                                                    {/* ECOA Distribution */}
                                                    <td>
                                                        <select
                                                            value={rec.distributionECOA || 'PENDING'}
                                                            onChange={(e) => handleDistributionUpdate(rec.user.id, 'distributionECOA', e.target.value)}
                                                            className={styles.statusSelect}
                                                            style={{ ...getStatusStyle(rec.distributionECOA), padding: '4px', borderRadius: '4px', border: '1px solid #ddd' }}
                                                        >
                                                            <option value="PENDING">Pendiente</option>
                                                            <option value="IN_PROCESS">En Proceso</option>
                                                            <option value="PAID">Pagado</option>
                                                        </select>
                                                        {rec.distributionECOA === 'PAID' && (
                                                            <input
                                                                type="date"
                                                                value={rec.distributionECOADate ? rec.distributionECOADate.split('T')[0] : ''}
                                                                onChange={(e) => handleDistributionUpdate(rec.user.id, 'distributionECOADate', e.target.value)}
                                                                style={{ fontSize: '0.8rem', padding: '2px', width: '100%', marginTop: '5px' }}
                                                            />
                                                        )}
                                                    </td>

                                                    {/* Commission */}
                                                    <td>
                                                        <select
                                                            value={rec.distributionCommission || 'PENDING'}
                                                            onChange={(e) => handleDistributionUpdate(rec.user.id, 'distributionCommission', e.target.value)}
                                                            className={styles.statusSelect}
                                                            style={{ ...getStatusStyle(rec.distributionCommission), padding: '4px', borderRadius: '4px', border: '1px solid #ddd' }}
                                                        >
                                                            <option value="PENDING">Pendiente</option>
                                                            <option value="IN_PROCESS">En Proceso</option>
                                                            <option value="PAID">Pagado</option>
                                                        </select>
                                                        {rec.distributionCommission === 'PAID' && (
                                                            <input
                                                                type="date"
                                                                value={rec.distributionCommissionDate ? rec.distributionCommissionDate.split('T')[0] : ''}
                                                                onChange={(e) => handleDistributionUpdate(rec.user.id, 'distributionCommissionDate', e.target.value)}
                                                                style={{ fontSize: '0.8rem', padding: '2px', width: '100%', marginTop: '5px' }}
                                                            />
                                                        )}
                                                    </td>

                                                    <td>
                                                        <button
                                                            onClick={() => openPaymentModal(rec.user, rec.payments)}
                                                            className={styles.btn + " " + styles.btnSecondary}
                                                            style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                                                        >
                                                            Ver {rec.payments.length} Pagos
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL */}
            {selectedUserPayments && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50,
                    backdropFilter: 'blur(2px)'
                }}>
                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', maxWidth: '900px', width: '90%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>Detalle de Pagos</h2>
                                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Estudiante: {selectedUserPayments.user}</p>
                            </div>
                            <button onClick={() => setSelectedUserPayments(null)} style={{ padding: '8px', borderRadius: '50%', hover: { backgroundColor: '#f3f4f6' } } as any}><X size={24} color="#6b7280" /></button>
                        </div>

                        <table className={styles.table} style={{ fontSize: '0.9rem', width: '100%' }}>
                            <thead>
                                <tr style={{ background: '#f9fafb' }}>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Fecha</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Monto</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Método</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Estado</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Comprobante</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedUserPayments.payments.length === 0 ? (
                                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>No hay historial de pagos.</td></tr>
                                ) : (selectedUserPayments.payments.map((p) => (
                                    <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '12px' }}>{new Date(p.date).toLocaleDateString()}</td>
                                        <td style={{ padding: '12px', fontWeight: 'bold' }}>U$S {p.amount}</td>
                                        <td style={{ padding: '12px' }}>{p.method}</td>
                                        <td style={{ padding: '12px' }}>
                                            <span style={{
                                                padding: '2px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600,
                                                backgroundColor: p.status === 'APPROVED' ? '#dcfce7' : '#ffedd5',
                                                color: p.status === 'APPROVED' ? '#166534' : '#9a3412'
                                            }}>
                                                {p.status === 'APPROVED' ? 'Aprobado' : 'Pendiente'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            {p.url ? (
                                                <a
                                                    href={p.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2563eb', fontWeight: 500 }}
                                                    download // Suggest browser download
                                                >
                                                    <Download size={14} /> Ver Archivo
                                                </a>
                                            ) : (
                                                <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Sin archivo</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {p.status !== 'APPROVED' && (
                                                    <button
                                                        onClick={() => handleApprovePayment(p.id, p.url)}
                                                        title="Aprobar (Guarda y Borra archivo)"
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '4px',
                                                            backgroundColor: '#16a34a', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem'
                                                        }}
                                                    >
                                                        <CheckCircle size={14} /> Aprobar
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeletePayment(p.id)}
                                                    title="Eliminar registro"
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '4px',
                                                        backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem'
                                                    }}
                                                >
                                                    <Trash2 size={14} /> Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </>
    );
}

function getStatusStyle(status?: string) {
    if (!status) status = 'PENDING';

    switch (status) {
        case 'PAID':
            return { backgroundColor: '#dcfce7', color: '#166534' }; // Green
        case 'IN_PROCESS':
            return { backgroundColor: '#ffedd5', color: '#c2410c' }; // Orange
        default:
            return { backgroundColor: '#fee2e2', color: '#991b1b' }; // Red
    }
}
