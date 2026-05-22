'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Edit2, Check, X, Loader2, Briefcase, DollarSign, Clock, AlertCircle } from 'lucide-react';

interface Service {
    id: string;
    title: string;
    description: string;
    duration: number;
    price: number;
    currency: string;
    is_active: boolean;
}

export default function ServicesPage() {
    const router = useRouter();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        duration: 60,
        price: 0,
        currency: 'ARS'
    });

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data, error } = await supabase
                .from('services')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setServices(data || []);

        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (service: Service) => {
        setFormData({
            title: service.title,
            description: service.description,
            duration: service.duration,
            price: service.price,
            currency: service.currency
        });
        setEditingId(service.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        setMessage(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuario no autenticado');

            if (editingId) {
                // Update
                const { error } = await supabase
                    .from('services')
                    .update({
                        title: formData.title,
                        description: formData.description,
                        duration: formData.duration,
                        price: formData.price,
                        currency: formData.currency
                    })
                    .eq('id', editingId);

                if (error) throw error;
                setMessage({ type: 'success', text: '¡Servicio actualizado exitosamente!' });
            } else {
                // Create
                const { error } = await supabase
                    .from('services')
                    .insert({
                        coach_id: user.id,
                        title: formData.title,
                        description: formData.description,
                        duration: formData.duration,
                        price: formData.price,
                        currency: formData.currency
                    });

                if (error) throw error;
                setMessage({ type: 'success', text: '¡Servicio creado exitosamente!' });
            }

            setShowForm(false);
            setFormData({ title: '', description: '', duration: 60, price: 0, currency: 'ARS' });
            setEditingId(null);
            fetchServices();

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este servicio?')) return;
        setActionLoading(true);
        try {
            const { error } = await supabase.from('services').delete().eq('id', id);
            if (error) throw error;
            fetchServices();
        } catch (error: any) {
            alert('Error al eliminar: ' + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const toggleActive = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('services')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;

            // Optimistic update
            setServices(services.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s));
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <button
                            onClick={() => router.back()}
                            className="mb-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 flex items-center gap-1 transition-colors"
                        >
                            &larr; Volver
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Briefcase className="w-8 h-8 text-blue-600" />
                            Mis Servicios
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Configura los servicios que ofreces a tus clientes.
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setFormData({ title: '', description: '', duration: 60, price: 0, currency: 'ARS' });
                            setEditingId(null);
                            setShowForm(!showForm);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/30"
                    >
                        {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        {showForm ? 'Cancelar' : 'Nuevo Servicio'}
                    </button>
                </div>

                {/* Mensajes */}
                {
                    message && (
                        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success'
                            ? 'bg-green-50 text-green-800 border-green-200'
                            : 'bg-red-50 text-red-800 border-red-200'
                            } border`}>
                            {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            {message.text}
                        </div>
                    )
                }

                {/* Formulario de Alta / Edición */}
                {
                    showForm && (
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 mb-8 animate-in fade-in slide-in-from-top-4">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                {editingId ? 'Editar Servicio' : 'Crear Nuevo Servicio'}
                            </h2>
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Servicio</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej: Sesión de Coaching Ontológico"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Describe brevemente en qué consiste..."
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duración (minutos)</label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="number"
                                            required
                                            min="15"
                                            step="15"
                                            value={formData.duration}
                                            onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Precio</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={actionLoading}
                                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <SaveIcon />}
                                        {editingId ? 'Actualizar Servicio' : 'Guardar Servicio'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )
                }

                {/* Lista de Servicios */}
                {
                    loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        </div>
                    ) : services.length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                            <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No tienes servicios creados</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-1 mb-6">Comienza creando tu primer servicio para que los clientes puedan reservar.</p>
                            <button
                                onClick={() => setShowForm(true)}
                                className="text-blue-600 font-medium hover:underline"
                            >
                                Crear mi primer servicio
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {services.map((service) => (
                                <div key={service.id} className={`
                                group bg-white dark:bg-gray-900 p-5 rounded-2xl border transition-all hover:shadow-md
                                ${service.is_active ? 'border-gray-200 dark:border-gray-800' : 'border-gray-200 dark:border-gray-800 opacity-60 bg-gray-50'}
                            `}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                                {service.title}
                                                {!service.is_active && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Inactivo</span>}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">{service.description || 'Sin descripción'}</p>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(service)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => toggleActive(service.id, service.is_active)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title={service.is_active ? "Desactivar" : "Activar"}
                                            >
                                                {service.is_active ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(service.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm font-medium pt-3 border-t border-gray-100 dark:border-gray-800">
                                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                                            <Clock className="w-4 h-4 text-blue-500" />
                                            {service.duration} min
                                        </div>
                                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                                            <DollarSign className="w-4 h-4 text-emerald-500" />
                                            {service.price} {service.currency}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                }
            </div >
        </div >
    );
}

function SaveIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
    )
}
