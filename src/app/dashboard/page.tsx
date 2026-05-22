'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, Briefcase, GraduationCap, ArrowRight, ShieldCheck } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import ProgressMap from '@/components/ProgressMap';

interface UserProfile {
    id: string;
    email: string;
    role: string;
    firstName: string | null;
    lastNamePaterno: string | null;
    profileCompleted: boolean;
    documentsCompleted: boolean;
    cohortId: string | null;
    cohort?: {
        code: string;
    };
}

export default function Dashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [paymentsCompleted, setPaymentsCompleted] = useState(false);

    useEffect(() => {
        const getData = async () => {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();

                if (!authUser) {
                    router.push('/login');
                    return;
                }

                // 1. Get User Profile with Cohort
                const { data: userData, error: userError } = await supabase
                    .from('User')
                    .select('*, cohort:Cohort(code)')
                    .eq('id', authUser.id)
                    .single();

                if (userError) {
                    console.error('Profile Error:', userError);
                }

                setUser(userData);

                // 2. Check Payments Completion
                const resPayments = await fetch("/api/payments");
                if (resPayments.ok) {
                    const payments = await resPayments.json();
                    const resSettings = await fetch('/api/settings');
                    let totalCost = 390.00;
                    if (resSettings.ok) {
                        const settings = await resSettings.json();
                        if (settings.diploma_total_cost) totalCost = Number(settings.diploma_total_cost);
                    }

                    const totalPaid = payments
                        .filter((p: any) => p.status !== "REJECTED")
                        .reduce((sum: number, p: any) => sum + p.amount, 0);

                    if (totalPaid >= totalCost) {
                        setPaymentsCompleted(true);
                    }
                }

            } catch (err: any) {
                console.error('General Error:', err);
            } finally {
                setLoading(false);
            }
        };

        getData();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    const isAdmin = user.role === 'SUPERADMIN' || user.role === 'AUDITOR';
    const firstName = user.firstName || 'Alumno';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <AppHeader />

            <main className="pt-24 pb-12 px-6 max-w-5xl mx-auto space-y-10">

                {/* Greeting Section */}
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                        ¡Hola, <span className="text-blue-600 dark:text-blue-500">{firstName}</span>! 👋
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                        Sigue tu camino para completar tu inscripción en la Diplomatura.
                    </p>
                </div>

                {/* Cohort Info Card */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-2xl text-blue-600 dark:text-blue-400">
                            <GraduationCap className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Diplomatura activa</p>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                Tu Camada: <span className="text-blue-600">{user.cohort?.code || 'Pendiente'}</span>
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Hero's Journey / Progress Map */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <ProgressMap
                        profileCompleted={user.profileCompleted}
                        documentsCompleted={user.documentsCompleted}
                        paymentsCompleted={paymentsCompleted}
                    />
                </div>

                {/* Admin Quick Link (If applicable) */}
                {isAdmin && (
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
                        <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <Briefcase className="w-48 h-48" />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-sm font-medium backdrop-blur-sm">
                                    <ShieldCheck className="w-4 h-4" /> Acceso Administrativo
                                </div>
                                <h3 className="text-2xl font-bold">Panel de Administración</h3>
                                <p className="text-blue-100 text-sm max-w-md">
                                    Como administrador, puedes gestionar alumnos, validar documentos y revisar reportes de pagos en tiempo real.
                                </p>
                            </div>
                            <button
                                onClick={() => router.push('/admin/dashboard')}
                                className="px-8 py-4 bg-white text-blue-700 rounded-2xl font-bold shadow-lg hover:bg-blue-50 transition-all flex items-center gap-2 group-hover:gap-3 shrink-0"
                            >
                                Ir al Panel <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
