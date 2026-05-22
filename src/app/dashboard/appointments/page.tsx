'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, X, Loader2, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AppointmentsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // 1. Fetch appointments with service details (Service join is usually safe)
            const { data: apps, error: appError } = await supabase
                .from('appointments')
                .select(`
                    *,
                    services (
                        title,
                        duration,
                        price
                    )
                `)
                .eq('client_id', user.id)
                .order('date', { ascending: true });

            if (appError) {
                console.error('Supabase Error (Apps):', appError);
                throw appError;
            }

            if (!apps || apps.length === 0) {
                setAppointments([]);
                setLoading(false);
                return;
            }

            // 2. Fetch Coach Profiles manually
            const coachIds = Array.from(new Set(apps.map(a => a.coach_id).filter(Boolean)));

            let profilesMap: Record<string, any> = {};

            if (coachIds.length > 0) {
                const { data: profiles, error: profileError } = await supabase
                    .from('profiles')
                    .select('id, full_name, email')
                    .in('id', coachIds);

                if (profileError) {
                    console.error('Supabase Error (Profiles):', profileError);
                    // We don't throw here, just continue without names
                }

                if (profiles) {
                    // profiles.forEach(p => { map[p.id] = p; }); // Remove this error
                    profilesMap = profiles.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
                }
            }

            // 3. Merge
            const merged = apps.map(app => ({
                ...app,
                profiles: profilesMap[app.coach_id] || { full_name: 'Coach', email: '' }
            }));

            setAppointments(merged);

        } catch (error) {
            console.error('Error fetching appointments:', error);
            setMessage({ type: 'error', text: 'Error cargando tus turnos. Intenta recargar.' });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id: string) => {
        if (!confirm('¿Estás seguro que deseas cancelar este turno?')) return;

        setCancellingId(id);
        setMessage(null);

        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status: 'cancelled' })
                .eq('id', id);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Turno cancelado correctamente' });
            fetchAppointments(); // Refresh list

        } catch (error: any) {
            console.error('Error canceling:', error);
            setMessage({ type: 'error', text: 'Error al cancelar el turno' });
        } finally {
            setCancellingId(null);
        }
    };

    // Helper to check if an appointment is in the past, considering the time slot
    const isAppointmentPast = (app: any) => {
        const appDateVal = parseISO(app.date); // This is midnight local or UTC depending on storage
        const [hours, minutes] = app.time_slot.split(':').map(Number);

        // Create a new date object for the appointment time
        const appDateTime = new Date(appDateVal);
        appDateTime.setHours(hours, minutes, 0, 0);

        return isPast(appDateTime);
    };

    // Split into Upcoming and Past
    const upcomingAppointments = appointments.filter(app => !isAppointmentPast(app) && app.status !== 'cancelled');
    const pastAppointments = appointments.filter(app => isAppointmentPast(app) && app.status !== 'cancelled');
    const cancelledAppointments = appointments.filter(app => app.status === 'cancelled');

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mis Turnos</h1>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                        }`}>
                        {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        {message.text}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-8">

                        {/* PRÓXIMOS TURNOS */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-600" />
                                Próximos
                            </h2>

                            {upcomingAppointments.length === 0 ? (
                                <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-center">
                                    <p className="text-gray-500 mb-4">No tienes turnos próximos agendados.</p>
                                    <button
                                        onClick={() => router.push('/dashboard/schedule')}
                                        className="text-blue-600 font-medium hover:underline"
                                    >
                                        Reservar un turno ahora
                                    </button>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {upcomingAppointments.map(app => (
                                        <div key={app.id} className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded uppercase">
                                                        {format(parseISO(app.date), 'MMMM', { locale: es })}
                                                    </span>
                                                    <span className="text-sm text-gray-500">{format(parseISO(app.date), 'yyyy')}</span>
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white capitalize">
                                                    {format(parseISO(app.date), 'EEEE d', { locale: es })}
                                                </h3>
                                                <div className="flex items-center gap-4 mt-2 text-gray-600 dark:text-gray-300 text-sm">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        {app.time_slot} hs
                                                    </div>
                                                    <div className="w-px h-4 bg-gray-300"></div>
                                                    <div>
                                                        {app.services?.title}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1">Con: {app.profiles?.full_name || 'Coach'}</p>
                                            </div>

                                            <button
                                                onClick={() => handleCancel(app.id)}
                                                disabled={cancellingId === app.id}
                                                className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-red-100 flex items-center justify-center gap-2"
                                            >
                                                {cancellingId === app.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                                Cancelar Turno
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* HISTORIAL */}
                        {(pastAppointments.length > 0 || cancelledAppointments.length > 0) && (
                            <section className="pt-8 border-t border-gray-200 dark:border-gray-800">
                                <h2 className="text-lg font-bold text-gray-500 mb-4">Historial</h2>
                                <div className="space-y-4 opacity-70">
                                    {[...pastAppointments, ...cancelledAppointments].map(app => (
                                        <div key={app.id} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl flex items-center justify-between border border-transparent">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white capitalize">
                                                    {format(parseISO(app.date), 'EEEE d MMMM', { locale: es })} - {app.time_slot}
                                                </p>
                                                <p className="text-sm text-gray-500">{app.services?.title}</p>
                                            </div>
                                            <div>
                                                {app.status === 'cancelled' ? (
                                                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-medium">Cancelado</span>
                                                ) : (
                                                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded font-medium">Finalizado</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                    </div>
                )}
            </div>
        </div>
    );
}
