'use client';

import { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, Loader2, User, Phone, Mail, Shield, MessageCircle, Video, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function CoachAgendaPage() {
    const router = useRouter();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

    // Data states
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);

    // Generate days for the current week view
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

    // Time slots definition (matching the client view)
    const timeSlots = [
        '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'
    ];

    const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
    const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));

    // Fetch appointments with client details
    useEffect(() => {
        const fetchAppointments = async () => {
            setLoading(true);
            try {
                // Check if user is admin/coach
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push('/login');
                    return;
                }

                // Verify role (optional double check, though middleware/layout should handle this ideally)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (!profile || (profile.role !== 'admin' && profile.role !== 'coach')) {
                    router.push('/dashboard');
                    return;
                }

                // Fetch appointments
                const startRange = startDate.toISOString();
                const endRange = addDays(startDate, 7).toISOString();

                // Note: We need client details. 
                // Since Supabase join syntax can be tricky without exact FK setup, we'll try the standard way.
                // If 'profiles' is the table name and there is a FK from client_id to auth.users, getting profile data might require
                // a join on client_id -> profiles.id if they match 1:1.
                // Let's attempt to fetch appointments first, then their profiles manually to be safe and robust.

                const { data: apps, error } = await supabase
                    .from('appointments')
                    .select('*')
                    .gte('date', startRange)
                    .lt('date', endRange)
                    .neq('status', 'cancelled');

                if (error) throw error;

                if (apps && apps.length > 0) {
                    // Fetch profiles for these appointments
                    const clientIds = apps.map(a => a.client_id);
                    const { data: profiles } = await supabase
                        .from('profiles')
                        .select('id, full_name, email, phone') // Include phone
                        .in('id', clientIds);

                    // Merge data
                    const mergedAppointments = apps.map(app => ({
                        ...app,
                        client: profiles?.find(p => p.id === app.client_id) || { full_name: 'Desconocido' }
                    }));

                    setAppointments(mergedAppointments);
                } else {
                    setAppointments([]);
                }

            } catch (error) {
                console.error('Error loading agenda:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, [currentDate, router]);

    const getAppointmentForSlot = (date: Date, time: string) => {
        return appointments.find(app => {
            const appDate = new Date(app.date);
            return isSameDay(appDate, date) && app.time_slot === time;
        });
    };

    const handleCancelAppointment = async () => {
        if (!selectedAppointment) return;

        const confirmed = window.confirm('¿Estás seguro de que deseas cancelar este turno? Esta acción liberará el horario inmediatamente.');
        if (!confirmed) return;

        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status: 'cancelled' })
                .eq('id', selectedAppointment.id);

            if (error) throw error;

            // Remove from local state
            setAppointments(current => current.filter(app => app.id !== selectedAppointment.id));
            setSelectedAppointment(null);
            alert('Turno cancelado correctamente.');

        } catch (error: any) {
            console.error('Error cancelling appointment:', error);
            alert('Error al cancelar el turno: ' + error.message);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8 pb-32 md:pb-8">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Shield className="w-6 h-6 md:w-8 md:h-8 text-indigo-600" />
                            Agenda Profesional
                        </h1>
                        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-1">Gestiona tus sesiones y ve el detalle de tus clientes.</p>
                    </div>

                    <div className="flex items-center gap-4 bg-white dark:bg-gray-900 p-2 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                        <button onClick={handlePrevWeek} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="font-semibold text-gray-900 dark:text-white capitalize min-w-[150px] text-center">
                            {format(currentDate, 'MMMM yyyy', { locale: es })}
                        </span>
                        <button onClick={handleNextWeek} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Calendar Grid */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">

                        {loading && (
                            <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center z-10">
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                            </div>
                        )}

                        {/* Week Header */}
                        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                            {weekDays.map((day) => (
                                <div key={day.toString()}
                                    onClick={() => { setSelectedDate(day); setSelectedAppointment(null); }}
                                    className={`py-3 text-center cursor-pointer transition-colors ${isSameDay(day, selectedDate || new Date()) ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                                    <div className="text-xs font-medium text-gray-500 uppercase mb-1">{format(day, 'EEE', { locale: es })}</div>
                                    <div className={`text-lg font-bold mx-auto w-8 h-8 flex items-center justify-center rounded-full ${isSameDay(day, selectedDate || new Date()) ? 'bg-indigo-600 text-white' :
                                        isSameDay(day, new Date()) ? 'text-indigo-600' : 'text-gray-900 dark:text-white'
                                        }`}>
                                        {format(day, 'd')}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Slots */}
                        <div className="p-6">
                            <h3 className="text-sm font-medium text-gray-500 mb-4 capitalize">
                                {format(selectedDate || currentDate, 'EEEE d MMMM', { locale: es })}
                            </h3>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {timeSlots.map(time => {
                                    const app = selectedDate ? getAppointmentForSlot(selectedDate, time) : null;
                                    const isSelected = selectedAppointment?.id === app?.id && app !== null;

                                    return (
                                        <button
                                            key={time}
                                            onClick={() => app && setSelectedAppointment(app)}
                                            disabled={!app}
                                            className={`
                                                relative p-3 rounded-xl border text-left transition-all
                                                ${!app
                                                    ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 text-gray-400'
                                                    : isSelected
                                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md ring-2 ring-indigo-200 dark:ring-indigo-900'
                                                        : 'bg-white dark:bg-gray-800 border-indigo-200 dark:border-indigo-800 text-gray-900 dark:text-white hover:border-indigo-400'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <Clock className="w-4 h-4" />
                                                <span className="font-bold">{time}</span>
                                            </div>
                                            {app ? (
                                                <div className="text-sm truncate font-medium">
                                                    <div className="flex items-center gap-1.5">
                                                        {app.modality === 'online' ? (
                                                            <Video className="w-3 h-3 text-blue-500" />
                                                        ) : (
                                                            <MapPin className="w-3 h-3 text-emerald-500" />
                                                        )}
                                                        <span className="truncate">{app.client?.full_name || 'Cliente'}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-xs">Disponible</div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Details Panel */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 h-fit">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Detalle del Turno</h3>

                        {selectedAppointment ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 dark:text-white">
                                                {selectedAppointment.client?.full_name || 'Sin Nombre'}
                                            </div>
                                            <div className="text-sm text-indigo-600 dark:text-indigo-400">Cliente</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                        <CalendarIcon className="w-5 h-5 text-gray-400" />
                                        <span className="capitalize">
                                            {format(new Date(selectedAppointment.date), 'EEEE d MMMM, yyyy', { locale: es })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                        <Clock className="w-5 h-5 text-gray-400" />
                                        <span>{selectedAppointment.time_slot} hs</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                        <Mail className="w-5 h-5 text-gray-400" />
                                        <span>{selectedAppointment.client?.email || 'No disponible'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                        {selectedAppointment.modality === 'online' ? (
                                            <Video className="w-5 h-5 text-blue-500" />
                                        ) : (
                                            <MapPin className="w-5 h-5 text-emerald-500" />
                                        )}
                                        <span className="capitalize font-medium">
                                            {selectedAppointment.modality === 'online' ? 'Online (Videollamada)' : 'Presencial (Consultorio)'}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                                    {selectedAppointment.client?.phone ? (
                                        <button
                                            onClick={() => window.open(`https://wa.me/${selectedAppointment.client.phone}`, '_blank')}
                                            className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                                        >
                                            <MessageCircle className="w-4 h-4" /> WhatsApp
                                        </button>
                                    ) : (
                                        <button disabled className="flex-1 py-2.5 bg-gray-100 text-gray-400 rounded-lg font-medium text-sm cursor-not-allowed">
                                            Sin Teléfono
                                        </button>
                                    )}
                                    <button
                                        onClick={handleCancelAppointment}
                                        className="flex-1 py-2.5 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium text-sm transition-colors"
                                    >
                                        Cancelar Turno
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-400">
                                <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>Selecciona un turno ocupado <br /> para ver los detalles del cliente.</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}

