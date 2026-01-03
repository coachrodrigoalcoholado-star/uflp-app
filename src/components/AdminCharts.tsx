"use client";

import dynamic from 'next/dynamic';

const AdminChartsContent = dynamic(() => import('./AdminChartsContent'), {
    loading: () => <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando gráficos...</div>,
    ssr: false
});

interface AdminChartsProps {
    growthData: { date: string; count: number }[];
    paymentData: { name: string; value: number; color: string }[];
    documentData: { name: string; value: number; color: string }[];
}

export default function AdminCharts({ growthData, paymentData, documentData }: AdminChartsProps) {
    return <AdminChartsContent growthData={growthData} paymentData={paymentData} documentData={documentData} />;
}
