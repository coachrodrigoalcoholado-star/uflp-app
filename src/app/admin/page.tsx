import styles from './admin.module.css';
import Link from 'next/link';
import { requireAdminView } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';
import AdminCharts from '@/components/AdminCharts';
import { Users, FileCheck, CreditCard, ExternalLink, Activity, ArrowUpRight, Clock, ShieldCheck, Sparkles } from 'lucide-react';

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

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const allStudents = await prisma.user.findMany({
            where: {
                role: 'STUDENT',
                createdAt: { gte: sixMonthsAgo }
            },
            select: { createdAt: true }
        });

        const monthlyGrowth: Record<string, number> = {};
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
            monthlyGrowth[key] = 0;
        }

        allStudents.forEach(user => {
            const monthYear = new Date(user.createdAt).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
            if (monthlyGrowth[monthYear] !== undefined) {
                monthlyGrowth[monthYear] += 1;
            }
        });

        const growthChartData = Object.entries(monthlyGrowth).map(([date, count]) => ({ date, count }));

        const paymentChartData = [
            { name: 'Aprobados', value: approvedPayments, color: '#10b981' },
            { name: 'Pendientes', value: pendingPayments, color: '#f59e0b' },
            { name: 'Rechazados', value: rejectedPayments, color: '#ef4444' },
        ].filter(item => item.value > 0);

        const documentChartData = [
            { name: 'Aprobados', value: approvedDocuments, color: '#10b981' },
            { name: 'Pendientes', value: pendingDocuments, color: '#f59e0b' },
            { name: 'Rechazados', value: rejectedDocuments, color: '#ef4444' },
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
    ['admin-analytics'],
    {
        revalidate: 3600,
        tags: ['admin-analytics']
    }
);

export default async function AdminDashboard() {
    await requireAdminView();
    const data = await getAnalytics();

    return (
        <>
            <div className={styles.topBar}>
                <div>
                    <h1 className={styles.pageTitle}>Dashboard Principal</h1>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Sistema de Gestión UFLP • Vista Ejecutiva
                    </p>
                </div>
                <div className={styles.topBarActions}>
                    <Link href="/" className={`${styles.btn} ${styles.btnSecondary}`}>
                        <ExternalLink size={15} /> Ver Portal Estudiantes
                    </Link>
                </div>
            </div>

            <div className={styles.contentArea}>
                {/* Stats Overview */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className="flex justify-between items-start mb-2">
                            <div className={styles.statLabel}>Total Usuarios</div>
                            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                                <Users size={20} />
                            </div>
                        </div>
                        <div className={styles.statValue}>{data.users.total}</div>
                        <div className={styles.statChange}>
                            <span className="text-emerald-400 font-semibold">{data.users.students}</span> Estudiantes registrados
                        </div>
                    </div>

                    <div className={`${styles.statCard} ${styles.warning}`}>
                        <div className="flex justify-between items-start mb-2">
                            <div className={styles.statLabel}>Docs por Revisar</div>
                            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                                <FileCheck size={20} />
                            </div>
                        </div>
                        <div className={styles.statValue}>{data.documents.pending}</div>
                        <div className={styles.statChange}>
                            <span className="text-emerald-400">{data.documents.approved}</span> aprobados • <span className="text-rose-400">{data.documents.rejected}</span> rechazados
                        </div>
                    </div>

                    <div className={`${styles.statCard} ${styles.warning}`}>
                        <div className="flex justify-between items-start mb-2">
                            <div className={styles.statLabel}>Pagos por Verificar</div>
                            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                                <CreditCard size={20} />
                            </div>
                        </div>
                        <div className={styles.statValue}>{data.payments.pending}</div>
                        <div className={styles.statChange}>
                            <span className="text-emerald-400">{data.payments.approved}</span> verificados de forma exitosa
                        </div>
                    </div>

                    <div className={`${styles.statCard} ${styles.success}`}>
                        <div className="flex justify-between items-start mb-2">
                            <div className={styles.statLabel}>Pagos Aprobados</div>
                            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                                <Activity size={20} />
                            </div>
                        </div>
                        <div className={styles.statValue}>{data.payments.approved}</div>
                        <div className={styles.statChange}>
                            <span className="text-emerald-400 font-semibold">100%</span> procesados de forma segura
                        </div>
                    </div>
                </div>

                {/* Analytics Charts */}
                <AdminCharts
                    growthData={data.charts.growth}
                    paymentData={data.charts.payments}
                    documentData={data.charts.documents}
                />

                {/* Quick Actions */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>
                            <Sparkles size={18} className="text-blue-400" /> Acciones Rápidas de Administración
                        </h2>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        <Link href="/admin/documents" className={`${styles.btn} ${styles.btnPrimary}`}>
                            <FileCheck size={16} /> Revisar Documentos ({data.documents.pending})
                        </Link>
                        <Link href="/admin/payments" className={`${styles.btn} ${styles.btnPrimary}`}>
                            <CreditCard size={16} /> Verificar Pagos ({data.payments.pending})
                        </Link>
                        <Link href="/admin/users" className={`${styles.btn} ${styles.btnSecondary}`}>
                            <Users size={16} /> Gestionar Usuarios
                        </Link>
                        <Link href="/admin/reports/db" className={`${styles.btn} ${styles.btnSecondary}`}>
                            <Activity size={16} /> Base de Datos
                        </Link>
                    </div>
                </div>

                {/* Recent Activity Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    {/* Recent Users */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>
                                <Users size={18} className="text-blue-400" /> Usuarios Recientes
                            </h2>
                            <Link href="/admin/users" className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-semibold">
                                Ver todos <ArrowUpRight size={14} />
                            </Link>
                        </div>
                        <div className="max-h-72 overflow-y-auto pr-1">
                            {data.recent.users.length === 0 ? (
                                <p className="text-slate-500 text-xs py-4 text-center">No hay usuarios registrados</p>
                            ) : (
                                <div className="space-y-3">
                                    {data.recent.users.map((user) => (
                                        <div key={user.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
                                            <div>
                                                <div className="text-xs font-bold text-slate-100">
                                                    {user.firstName ? `${user.firstName} ${user.lastNamePaterno}` : user.email}
                                                </div>
                                                <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                    <Clock size={11} /> {new Date(user.createdAt).toLocaleDateString('es-ES')}
                                                </div>
                                            </div>
                                            <span className={user.role === 'SUPERADMIN' ? styles.badgeApproved : styles.badgePending}>
                                                {user.role}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pending Documents */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>
                                <FileCheck size={18} className="text-amber-400" /> Docs. Pendientes
                            </h2>
                            <Link href="/admin/documents" className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-semibold">
                                Ver todos <ArrowUpRight size={14} />
                            </Link>
                        </div>
                        <div className="max-h-72 overflow-y-auto pr-1">
                            {data.recent.documents.length === 0 ? (
                                <p className="text-slate-500 text-xs py-4 text-center">No hay documentos pendientes</p>
                            ) : (
                                <div className="space-y-3">
                                    {data.recent.documents.map((doc) => (
                                        <div key={doc.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
                                            <div>
                                                <div className="text-xs font-bold text-slate-100">{doc.type}</div>
                                                <div className="text-[11px] text-slate-400 mt-0.5">
                                                    {doc.user.firstName ? `${doc.user.firstName} ${doc.user.lastNamePaterno}` : doc.user.email}
                                                </div>
                                            </div>
                                            <span className={styles.badgePending}>{doc.status}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pending Payments */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>
                                <CreditCard size={18} className="text-purple-400" /> Pagos Pendientes
                            </h2>
                            <Link href="/admin/payments" className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-semibold">
                                Ver todos <ArrowUpRight size={14} />
                            </Link>
                        </div>
                        <div className="max-h-72 overflow-y-auto pr-1">
                            {data.recent.payments.length === 0 ? (
                                <p className="text-slate-500 text-xs py-4 text-center">No hay pagos pendientes</p>
                            ) : (
                                <div className="space-y-3">
                                    {data.recent.payments.map((payment) => (
                                        <div key={payment.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
                                            <div>
                                                <div className="text-xs font-bold text-slate-100">${payment.amount} USD</div>
                                                <div className="text-[11px] text-slate-400 mt-0.5">
                                                    {payment.user.firstName ? `${payment.user.firstName} ${payment.user.lastNamePaterno}` : payment.user.email}
                                                </div>
                                            </div>
                                            <span className={styles.badgePending}>{payment.status}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
