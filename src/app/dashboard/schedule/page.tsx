'use client';

import { useState, useEffect, useRef } from 'react';
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, Loader2, CheckCircle, AlertCircle, Briefcase, ArrowLeft, Check, Sparkles, Zap, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function SchedulePage() {
    const router = useRouter();
    const dateListRef = useRef<HTMLDivElement>(null);

    // Steps: 0 = Service Selection, 1 = Date/Time Selection
    const [step, setStep] = useState(0);

    // Data
    const [services, setServices] = useState<any[]>([]);
    const [selectedService, setSelectedService] = useState<any | null>(null);
    const [availability, setAvailability] = useState<any[]>([]);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [blockedDates, setBlockedDates] = useState<Date[]>([]);
    const [coachName, setCoachName] = useState<string>('');

    // Selection State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [modality, setModality] = useState<'presencial' | 'online'>('presencial');

    // UI State
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Fetch active services on mount
    useEffect(() => {
        const fetchServices = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('services')
                    .select('*')
                    .eq('is_active', true);

                if (error) throw error;
                setServices(data || []);
            } catch (error) {
                console.error('Error fetching services:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, []);

    // Fetch existing appointments when a service is selected to prevent double bookings
    useEffect(() => {
        if (!selectedService) return;

        const fetchAppointments = async () => {
            try {
                const { data, error } = await supabase
                    .from('appointments')
                    .select('*')
                    .eq('coach_id', selectedService.coach_id)
                    .neq('status', 'cancelled');

                if (error) throw error;
                setAppointments(data || []);
            } catch (error) {
                console.error('Error fetching appointments:', error);
            }
        };

        fetchAppointments();
    }, [selectedService]);

    // Rolling 14 days window (excluding Sundays)
    const weekDays = Array.from({ length: 14 })
        .map((_, i) => addDays(new Date(), i))
        .filter(day => day.getDay() !== 0);

    const getSlotsForDate = (date: Date) => {
        // Standard time slots:
        const baseSlots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
        
        // Filter out slots that are already booked for this date and this service's coach
        return baseSlots.filter(slot => {
            const isBooked = appointments.some(app => {
                const appDate = new Date(app.date);
                return isSameDay(appDate, date) && 
                       app.time_slot === slot && 
                       app.coach_id === selectedService?.coach_id &&
                       app.status !== 'cancelled';
            });
            return !isBooked;
        });
    };

    const handleConfirm = async () => {
        if (!selectedDate || !selectedSlot || !selectedService) return;

        setBooking(true);
        setMessage(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setMessage({ type: 'error', text: 'Debes iniciar sesión para reservar.' });
                setBooking(false);
                return;
            }

            const appointmentDate = startOfDay(selectedDate).toISOString();

            const { error } = await supabase
                .from('appointments')
                .insert({
                    client_id: user.id,
                    coach_id: selectedService.coach_id,
                    service_id: selectedService.id,
                    date: appointmentDate,
                    time_slot: selectedSlot,
                    modality: modality, // Include modality
                    status: 'confirmed'
                });

            if (error) throw error;

            setMessage({ type: 'success', text: '¡Reserva confirmada con éxito!' });

            setTimeout(() => {
                setMessage(null);
                setBooking(false);
                setSelectedSlot(null);
                router.push('/dashboard/appointments');
            }, 2000);

        } catch (error: any) {
            setMessage({ type: 'error', text: `Error: ${error.message}` });
            setBooking(false);
        }
    };

    // STEP 0: Select Service
    if (step === 0) {
        return (
            <div className="min-h-screen bg-gray-950 text-white pb-32">
                {/* Background blur */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[100px] opacity-20"></div>
                </div>

                <div className="max-w-4xl mx-auto p-4 md:p-8 relative z-10">
                    <div className="mb-8 flex items-center gap-4">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors -ml-2 text-white"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                                <Sparkles className="w-8 h-8 text-blue-500" />
                                Reservar Turno
                            </h1>
                            <p className="text-gray-400 mt-1">Selecciona el tipo de sesión que deseas programar con tu coach.</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    ) : services.length === 0 ? (
                        <div className="text-center py-16 bg-white/5 rounded-3xl border border-dashed border-white/10">
                            <Briefcase className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                            <h3 className="text-lg font-bold text-white">No hay servicios disponibles</h3>
                            <p className="text-gray-400 mt-1">Actualmente no hay sesiones activas para reservar.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {services.map((service) => (
                                <div
                                    key={service.id}
                                    className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all duration-300 flex flex-col justify-between group hover:border-blue-500/50"
                                >
                                    <div>
                                        <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{service.title}</h3>
                                        <p className="text-gray-400 text-sm mt-2 line-clamp-3">{service.description || 'Sin descripción'}</p>
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-4 text-sm font-semibold">
                                            <span className="flex items-center gap-1 text-gray-300">
                                                <Clock className="w-4 h-4 text-blue-400" />
                                                {service.duration} min
                                            </span>
                                            <span className="flex items-center gap-1 text-gray-300">
                                                <Zap className="w-4 h-4 text-emerald-400" />
                                                ${service.price} {service.currency}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSelectedService(service);
                                                setStep(1);
                                            }}
                                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-xl text-sm transition-all active:scale-95 shadow-md shadow-blue-900/50"
                                        >
                                            Seleccionar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // STEP 1: Select Date & Time
    return (
        <div className="min-h-screen bg-gray-950 text-white pb-32">
            {/* Background blur */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[100px] opacity-20"></div>
            </div>

            {/* Header */}
            <div className="bg-gray-900/80 backdrop-blur-xl sticky top-0 z-30 border-b border-white/10 px-4 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <button onClick={() => setStep(0)} className="p-2 hover:bg-white/10 rounded-full transition-colors -ml-2 text-white">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="text-center">
                        <h2 className="text-sm font-bold text-white">{selectedService.title}</h2>
                        <p className="text-xs text-blue-400">{selectedService.duration} min • ${selectedService.price} {selectedService.currency}</p>
                    </div>
                    <div className="w-10"></div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 relative z-10">

                {/* Modality Selector */}
                <div className="bg-white/5 border border-white/10 p-1.5 rounded-2xl flex relative w-full md:w-96 mx-auto mb-8">
                    <div
                        className={`absolute inset-y-1.5 w-1/2 bg-blue-600 rounded-xl transition-all duration-300 shadow-lg shadow-blue-900/50 ${modality === 'online' ? 'translate-x-full' : 'translate-x-0'}`}
                    ></div>
                    <button
                        onClick={() => setModality('presencial')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl relative z-10 transition-colors ${modality === 'presencial' ? 'text-white font-bold' : 'text-gray-400 hover:text-white'}`}
                    >
                        <User className="w-4 h-4" />
                        Presencial
                    </button>
                    <button
                        onClick={() => setModality('online')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl relative z-10 transition-colors ${modality === 'online' ? 'text-white font-bold' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Zap className="w-4 h-4" />
                        Online
                    </button>
                </div>

                {/* Date Selector */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white px-1">Selecciona un día</h3>
                    <div
                        className="flex overflow-x-auto gap-3 pb-4 snap-x snap-mandatory no-scrollbar"
                        ref={dateListRef}
                    >
                        {weekDays.map((day, i) => {
                            const isBlocked = blockedDates.some(b => isSameDay(b, day));
                            const isDisabled = isBlocked;
                            const isSelected = isSameDay(day, selectedDate || new Date(0));

                            return (
                                <button
                                    key={i}
                                    onClick={() => {
                                        if (!isDisabled) {
                                            setSelectedDate(day);
                                            setSelectedSlot(null);
                                        }
                                    }}
                                    disabled={isDisabled}
                                    className={`
                                        snap-start flex-shrink-0 w-[4.5rem] h-20 rounded-2xl flex flex-col items-center justify-center transition-all border
                                        ${isSelected
                                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/40 scale-105'
                                            : isDisabled
                                                ? 'bg-gray-900/50 border-transparent text-gray-600 cursor-not-allowed'
                                                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
                                        }
                                    `}
                                >
                                    <span className="text-xs font-semibold uppercase opacity-60">{format(day, 'EEE', { locale: es })}</span>
                                    <span className="text-xl font-bold">{format(day, 'd')}</span>
                                    {isBlocked && <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1"></div>}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Time Slots */}
                <div className="space-y-4 animate-in fade-in duration-500">
                    <h3 className="text-lg font-bold text-white px-1 capitalize">
                        Horarios para {selectedDate ? format(selectedDate, 'EEEE d', { locale: es }) : '...'}
                    </h3>

                    {!selectedDate ? (
                        <div className="p-8 text-center text-gray-500 border border-dashed rounded-3xl border-gray-800 bg-white/5">
                            Selecciona un día arriba
                        </div>
                    ) : (
                        getSlotsForDate(selectedDate).length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                {getSlotsForDate(selectedDate).map(time => (
                                    <button
                                        key={time}
                                        onClick={() => setSelectedSlot(time)}
                                        className={`
                                            py-3 px-2 rounded-xl text-sm font-bold transition-all border
                                            ${selectedSlot === time
                                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/40 scale-105'
                                                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-blue-500/50 hover:text-blue-200'
                                            }
                                        `}
                                    >
                                        {time}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-12 bg-white/5 rounded-3xl border border-dashed border-gray-800 text-gray-500">
                                <Clock className="w-10 h-10 mb-3 opacity-20" />
                                <p>No hay turnos disponibles para este día.</p>
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Bottom Floating Action Bar */}
            <div className={`
                fixed bottom-0 left-0 right-0 p-4 bg-gray-950/80 backdrop-blur-xl border-t border-white/10 transition-transform duration-300 z-40
                ${selectedDate && selectedSlot ? 'translate-y-0' : 'translate-y-full'}
            `}>
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                    <div className="hidden sm:block">
                        <p className="text-sm text-gray-400">Estás reservando:</p>
                        <p className="font-bold text-white">
                            {modality === 'online' ? 'Online' : 'Presencial'} • {selectedDate && format(selectedDate, 'd MMM', { locale: es })} a las {selectedSlot} hs
                        </p>
                    </div>

                    <button
                        onClick={handleConfirm}
                        disabled={booking}
                        className="flex-1 sm:flex-none sm:w-64 bg-blue-600 hover:bg-blue-500 text-white py-4 px-6 rounded-2xl font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {booking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                        Confirmar Reserva
                    </button>
                </div>
                {message && (
                    <div className="absolute top-0 left-0 right-0 -mt-20 px-4 pointer-events-none">
                        <div className={`mx-auto max-w-md p-4 rounded-2xl shadow-2xl border border-white/10 flex items-center justify-center gap-3 text-sm font-bold animate-in slide-in-from-bottom-5 ${message.type === 'success' ? 'bg-green-500/90 text-white backdrop-blur-md' : 'bg-red-500/90 text-white backdrop-blur-md'}`}>
                            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            {message.text}
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}
