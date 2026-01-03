import styles from './admin.module.css';
import Link from 'next/link';
import { requireAdminView } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';
import AdminCharts from '@/components/AdminCharts';

interface AnalyticsData {
    users: {
        total: number;
        students: number;
        superadmins: number;
    };
    documents: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
    };
    payments: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
    };
    recent: {
        users: any[];
        documents: any[];
        payments: any[];
    };
    charts: {
        growth: { date: string; count: number }[];
        payments: { name: string; value: number; color: string }[];
        documents: { name: string; value: number; color: string }[];
    }
}

import { unstable_cache } from 'next/cache';

const getAnalytics = unstable_cache(
    async (): Promise<AnalyticsData> => {
        // Get user statistics
        const totalUsers = await prisma.user.count();
        const studentCount = await prisma.user.count({ where: { role: 'STUDENT' } });
        const superadminCount = await prisma.user.count({ where: { role: 'SUPERADMIN' } });

        // Get document statistics
        const totalDocuments = await prisma.document.count();
        const pendingDocuments = await prisma.document.count({ where: { status: 'PENDING' } });
        const approvedDocuments = await prisma.document.count({ where: { status: 'APPROVED' } });
        const rejectedDocuments = await prisma.document.count({ where: { status: 'REJECTED' } });

        // Get payment statistics
        const totalPayments = await prisma.payment.count();
        const pendingPayments = await prisma.payment.count({ where: { status: 'PENDING' } });
        const approvedPayments = await prisma.payment.count({ where: { status: 'APPROVED' } });
        const rejectedPayments = await prisma.payment.count({ where: { status: 'REJECTED' } });

        // Get recent users (last 10)
        const recentUsers = await prisma.user.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastNamePaterno: true,
                role: true,
                createdAt: true,
            }
        });

        // Get recent documents
        const recentDocuments = await prisma.document.findMany({
            take: 10,
            where: { status: 'PENDING' },
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { email: true, firstName: true, lastNamePaterno: true } } }
        });

        // Get recent payments
        const recentPayments = await prisma.payment.findMany({
            take: 10,
            where: { status: 'PENDING' },
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { email: true, firstName: true, lastNamePaterno: true } } }
        });

        // --- Chart Data Aggregation ---

        // 1. Growth Chart (Users registered per month - Last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // Using prisma.$queryRaw could be more efficient for aggregation but for simplicity/portability in this project context logic in JS is fine (~500 users)
        const allStudents = await prisma.user.findMany({
            where: {
                role: 'STUDENT',
                createdAt: { gte: sixMonthsAgo }
            },
            select: { createdAt: true }
        });

        // Initialize last 6 months with 0
        const monthlyGrowth: Record<string, number> = {};
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
            monthlyGrowth[key] = 0; // Init
        }

        allStudents.forEach(user => {
            const monthYear = new Date(user.createdAt).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
            if (monthlyGrowth[monthYear] !== undefined) {
                monthlyGrowth[monthYear] += 1;
            }
        });

        const growthChartData = Object.entries(monthlyGrowth).map(([date, count]) => ({ date, count }));

        // 2. Pie Charts Data
        const paymentChartData = [
            { name: 'Aprobados', value: approvedPayments, color: '#166534' }, // Green
            { name: 'Pendientes', value: pendingPayments, color: '#ca8a04' }, // Yellow
            { name: 'Rechazados', value: rejectedPayments, color: '#991b1b' }, // Red
        ].filter(item => item.value > 0);

        const documentChartData = [
            { name: 'Aprobados', value: approvedDocuments, color: '#166534' },
            { name: 'Pendientes', value: pendingDocuments, color: '#ca8a04' },
            { name: 'Rechazados', value: rejectedDocuments, color: '#991b1b' },
        ].filter(item => item.value > 0);


        return {
            users: { total: totalUsers, students: studentCount, superadmins: superadminCount },
            documents: { total: totalDocuments, pending: pendingDocuments, approved: approvedDocuments, rejected: rejectedDocuments },
            payments: { total: totalPayments, pending: pendingPayments, approved: approvedPayments, rejected: rejectedPayments },
            recent: { users: recentUsers, documents: recentDocuments, payments: recentPayments },
            charts: {
                growth: growthChartData,
                payments: paymentChartData,
                documents: documentChartData
            }
        };
    },
    ['admin-analytics'], // Cache key
    {
        revalidate: 3600, // Revalidate every hour by default
        tags: ['admin-analytics'] // Cache tag for manual invalidation
    }
);

export default async function AdminDashboard() {
    await requireAdminView();
    const data = await getAnalytics();

    return (
        <>
            <div className={styles.topBar}>
                <h1 className={styles.pageTitle}>Dashboard</h1>
                <div className={styles.topBarActions}>
                    <Link href="/" className={styles.btn + ' ' + styles.btnSecondary}>
                        Ver como estudiante
                    </Link>
                </div>
            </div>

            <div className={styles.contentArea}>
                {/* Stats Overview */}
                <div className={styles.statsGrid}>
                    <div className={`${styles.statCard} ${styles.success}`}>
                        <div className={styles.statLabel}>Total Usuarios</div>
                        <div className={styles.statValue}>{data.users.total}</div>
                        <div className={styles.statChange}>
                            {data.users.students} estudiantes, {data.users.superadmins} admins
                        </div>
                    </div>

                    <div className={`${styles.statCard} ${styles.warning}`}>
                        <div className={styles.statLabel}>Docs Pendientes</div>
                        <div className={styles.statValue}>{data.documents.pending}</div>
                        <div className={styles.statChange}>
                            {data.documents.approved} aprobados, {data.documents.rejected} rechazados
                        </div>
                    </div>

                    <div className={`${styles.statCard} ${styles.warning}`}>
                        <div className={styles.statLabel}>Pagos Pendientes</div>
                        <div className={styles.statValue}>{data.payments.pending}</div>
                        <div className={styles.statChange}>
                            {data.payments.approved} aprobados, {data.payments.rejected} rechazados
                        </div>
                    </div>

                    <div className={`${styles.statCard} ${styles.warning}`}>
                        <div className={styles.statLabel}>Total Cobrado</div>
                        <div className={styles.statValue}>{data.payments.approved}</div>
                        <div className={styles.statChange}>
                            Pagos aprobados
                        </div>
                    </div>
                </div>

                {/* NEW: Analytics Charts */}
                <AdminCharts
                    growthData={data.charts.growth}
                    paymentData={data.charts.payments}
                    documentData={data.charts.documents}
                />

                {/* Quick Actions */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Acciones Rápidas</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <Link href="/admin/documents" className={`${styles.btn} ${styles.btnPrimary}`}>
                            Revisar Documentos ({data.documents.pending})
                        </Link>
                        <Link href="/admin/payments" className={`${styles.btn} ${styles.btnPrimary}`}>
                            Verificar Pagos ({data.payments.pending})
                        </Link>
                        <Link href="/admin/users" className={`${styles.btn} ${styles.btnSecondary}`}>
                            Gestionar Usuarios
                        </Link>
                        <Link href="/admin/reports/db" className={`${styles.btn} ${styles.btnSecondary}`}>
                            Base de Datos
                        </Link>
                    </div>
                </div>

                {/* Recent Activity */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '2rem' }}>
                    {/* Recent Users */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>Usuarios Recientes</h2>
                            <Link href="/admin/users">Ver todos →</Link>
                        </div>
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {data.recent.users.length === 0 ? (
                                <p style={{ color: '#6b7280', fontSize: '14px' }}>No hay usuarios registrados</p>
                            ) : (
                                <table className={styles.table}>
                                    <tbody>
                                        {data.recent.users.map((user) => (
                                            <tr key={user.id}>
                                                <td>
                                                    <strong>{user.firstName ? `${user.firstName} ${user.lastNamePaterno}` : user.email}</strong>
                                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                                        {new Date(user.createdAt).toLocaleDateString('es-ES')}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={user.role === 'SUPERADMIN' ? styles.badgeApproved : styles.badgePending}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Pending Documents */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>Documentos Pendientes</h2>
                            <Link href="/admin/documents">Ver todos →</Link>
                        </div>
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {data.recent.documents.length === 0 ? (
                                <p style={{ color: '#6b7280', fontSize: '14px' }}>No hay documentos pendientes</p>
                            ) : (
                                <table className={styles.table}>
                                    <tbody>
                                        {data.recent.documents.map((doc) => (
                                            <tr key={doc.id}>
                                                <td>
                                                    <strong>{doc.type}</strong>
                                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                                        {doc.user.firstName ? `${doc.user.firstName} ${doc.user.lastNamePaterno}` : doc.user.email}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={styles.badgePending}>{doc.status}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Pending Payments */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>Pagos Pendientes</h2>
                            <Link href="/admin/payments">Ver todos →</Link>
                        </div>
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {data.recent.payments.length === 0 ? (
                                <p style={{ color: '#6b7280', fontSize: '14px' }}>No hay pagos pendientes</p>
                            ) : (
                                <table className={styles.table}>
                                    <tbody>
                                        {data.recent.payments.map((payment) => (
                                            <tr key={payment.id}>
                                                <td>
                                                    <strong>${payment.amount}</strong>
                                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                                        {payment.user.firstName ? `${payment.user.firstName} ${payment.user.lastNamePaterno}` : payment.user.email}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={styles.badgePending}>{payment.status}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
