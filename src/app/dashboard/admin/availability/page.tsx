'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Clock, Calendar, Check, Save, Loader2, AlertCircle, ChevronLeft, ChevronRight, Ban } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

interface DaySchedule {
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
}

const DAYS = [
    { id: 1, name: 'Lunes' },
    { id: 2, name: 'Martes' },
    { id: 3, name: 'Miércoles' },
    { id: 4, name: 'Jueves' },
    { id: 5, name: 'Viernes' },
    { id: 6, name: 'Sábado' },
    { id: 0, name: 'Domingo' },
];

export default function AvailabilityPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [schedule, setSchedule] = useState<{ [key: number]: DaySchedule }>({});
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Blocked Dates State
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [blockedDates, setBlockedDates] = useState<Date[]>([]);
    const [loadingBlocked, setLoadingBlocked] = useState(false);

    useEffect(() => {
        fetchAvailability();
        fetchBlockedDates();
    }, []);

    const fetchAvailability = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data, error } = await supabase
                .from('availability')
                .select('*')
                .eq('coach_id', user.id);

            if (error) throw error;

            // Transform array to map for easier UI handling
            const scheduleMap: { [key: number]: DaySchedule } = {};

            // Initialize defaults
            DAYS.forEach(day => {
                scheduleMap[day.id] = {
                    day_of_week: day.id,
                    start_time: '09:00',
                    end_time: '17:00',
                    is_active: false
                };
            });

            // Merge DB data
            data?.forEach((item: any) => {
                scheduleMap[item.day_of_week] = {
                    day_of_week: item.day_of_week,
                    start_time: item.start_time,
                    end_time: item.end_time,
                    is_active: item.is_active
                };
            });

            setSchedule(scheduleMap);

        } catch (error) {
            console.error('Error fetching availability:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuario no autenticado');

            // Prepare upsert data
            const upsertData = Object.values(schedule).map(item => ({
                coach_id: user.id, // RLS would check this anyway, but good for upsert matching if we had unique keys
                day_of_week: item.day_of_week,
                start_time: item.start_time,
                end_time: item.end_time,
                is_active: item.is_active
            }));

            // Since we don't have a unique constraint on (coach_id, day_of_week) in the simple schema created,
            // we should probably delete existing and re-insert, OR ensure the table has that constraint.
            // For safety and simplicity with the current schema, let's delete and insert.
            // A better production approach is a composite unique key and upsert.

            // 1. Delete all for this coach
            const { error: deleteError } = await supabase
                .from('availability')
                .delete()
                .eq('coach_id', user.id);

            if (deleteError) throw deleteError;

            // 2. Insert active ones (or all if we want to store inactive status too, which we do)
            const { error: insertError } = await supabase
                .from('availability')
                .insert(upsertData.map(d => ({ ...d, coach_id: user.id })));

            if (insertError) throw insertError;

            setMessage({ type: 'success', text: 'Disponibilidad actualizada correctamente.' });

        } catch (error: any) {
            setMessage({ type: 'error', text: `Error al guardar: ${error.message}` });
        } finally {
            setSaving(false);
        }
    };

    const fetchBlockedDates = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('blocked_dates')
                .select('date')
                .eq('coach_id', user.id);

            if (error) {
                // Ignore error if table doesn't exist yet (graceful degradation)
                if (error.code !== '42P01') console.error('Error fetching blocked dates:', error);
                return;
            }

            if (data) {
                setBlockedDates(data.map((item: any) => new Date(item.date + 'T12:00:00'))); // Add time to avoid timezone offsets to previous day
            }
        } catch (error) {
            console.error(error);
        }
    };

    const toggleBlockedDate = async (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const isBlocked = blockedDates.some(d => isSameDay(d, date));

        // Optimistic Update
        let newBlockedDates;
        if (isBlocked) {
            newBlockedDates = blockedDates.filter(d => !isSameDay(d, date));
        } else {
            newBlockedDates = [...blockedDates, date];
        }
        setBlockedDates(newBlockedDates);
        setMessage(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuario no autenticado");

            if (isBlocked) {
                // Unblock (Delete)
                const { error } = await supabase
                    .from('blocked_dates')
                    .delete()
                    .eq('coach_id', user.id)
                    .eq('date', dateStr);

                if (error) throw error;
            } else {
                // Block (Insert)
                const { error } = await supabase
                    .from('blocked_dates')
                    .insert({
                        coach_id: user.id,
                        date: dateStr,
                        reason: 'User blocked'
                    });

                if (error) throw error;
            }
        } catch (error: any) {
            console.error('Error toggling date:', error);
            setMessage({ type: 'error', text: `Error al guardar fecha: ${error.message || error.code}` });
            // Revert on error
            fetchBlockedDates();
        }
    };

    const updateDay = (dayId: number, field: keyof DaySchedule, value: any) => {
        setSchedule(prev => ({
            ...prev,
            [dayId]: {
                ...prev[dayId],
                [field]: value
            }
        }));
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8 pb-32">
            <div className="max-w-4xl mx-auto">

                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="mb-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 flex items-center gap-1 transition-colors"
                    >
                        &larr; Volver
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Calendar className="w-8 h-8 text-blue-600" />
                        Mi Disponibilidad Semanal
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Define tu horario laboral recurrente. Los turnos se generarán automáticamente en base a esto.
                    </p>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success'
                        ? 'bg-green-50 text-green-800 border-green-200'
                        : 'bg-red-50 text-red-800 border-red-200'
                        } border`}>
                        {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        {message.text}
                    </div>
                )}

                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                    {DAYS.map((day) => {
                        const dayData = schedule[day.id];
                        return (
                            <div key={day.id} className={`p-4 md:p-6 border-b border-gray-100 dark:border-gray-800 last:border-0 flex flex-col md:flex-row md:items-center gap-4 transition-colors ${dayData.is_active ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-900/50'}`}>

                                {/* Toggle & Name */}
                                <div className="flex items-center gap-4 min-w-[200px]">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={dayData.is_active}
                                            onChange={(e) => updateDay(day.id, 'is_active', e.target.checked)}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                    </label>
                                    <span className={`font-semibold ${dayData.is_active ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                                        {day.name}
                                    </span>
                                </div>

                                {/* Times */}
                                <div className={`flex items-center gap-4 flex-1 transition-opacity ${dayData.is_active ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <input
                                            type="time"
                                            value={dayData.start_time}
                                            onChange={(e) => updateDay(day.id, 'start_time', e.target.value)}
                                            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <span className="text-gray-400">-</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="time"
                                            value={dayData.end_time}
                                            onChange={(e) => updateDay(day.id, 'end_time', e.target.value)}
                                            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Status Label */}
                                <div className="hidden md:block w-32 text-right">
                                    <span className={`text-sm ${dayData.is_active ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                                        {dayData.is_active ? 'Abierto' : 'Cerrado'}
                                    </span>
                                </div>

                            </div>
                        );
                    })}
                </div>

            </div>

            <div className="mt-6 flex justify-end mb-12">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Guardar Disponibilidad Semanal
                </button>
            </div>

            {/* Blocked Dates Section */}
            <div className="border-t border-gray-200 dark:border-gray-800 pt-10">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Ban className="w-6 h-6 text-red-500" />
                        Días Bloqueados (Feriados / Vacaciones)
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Haz clic en un día del calendario para bloquearlo o desbloquearlo. Estos días NO se ofrecerán turnos.
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 max-w-md mx-auto md:mx-0">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h3 className="text-lg font-bold capitalize text-gray-900 dark:text-white">
                            {format(currentMonth, 'MMMM yyyy', { locale: es })}
                        </h3>
                        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map(d => (
                            <div key={d} className="text-xs font-medium text-gray-500 py-1">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {/* Empty cells for previous month padding */}
                        {Array.from({ length: (startOfMonth(currentMonth).getDay() + 6) % 7 }).map((_, i) => (
                            <div key={`empty-${i}`} className="aspect-square"></div>
                        ))}

                        {eachDayOfInterval({
                            start: startOfMonth(currentMonth),
                            end: endOfMonth(currentMonth)
                        }).map((day, idx) => {
                            const isBlocked = blockedDates.some(d => isSameDay(d, day));
                            return (
                                <button
                                    key={day.toISOString()}
                                    onClick={() => toggleBlockedDate(day)}
                                    className={`
                                            aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all
                                            ${!isSameMonth(day, currentMonth) ? 'opacity-20' : ''}
                                            ${isBlocked
                                            ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-bold border-2 border-red-500' // Blocked style
                                            : isToday(day)
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' // Today style
                                                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300' // Default
                                        }
                                        `}
                                >
                                    {format(day, 'd')}
                                </button>
                            );
                        })}
                    </div>                    <div className="mt-4 flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-red-100 border border-red-500 rounded"></div>
                            <span className="text-gray-500">Bloqueado</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-gray-400 italic">Los cambios se guardan automáticamente.</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
