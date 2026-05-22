'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2, Search, User, Mail, Phone, Calendar, Shield, FileText, Video, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ClientListPage() {
    const router = useRouter();
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchClients = async () => {
            try {
                // Auth Check
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push('/login');
                    return;
                }

                // Role Check
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (!profile || (profile.role !== 'admin' && profile.role !== 'coach')) {
                    router.push('/dashboard');
                    return;
                }

                // Fetch Clients (Profiles) with their Appointments
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*, appointments(date, status, modality)')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (data) {
                    // Process data to find last session per client
                    const clientsWithHistory = data.map((client: any) => {
                        const confirmedAppointments = client.appointments?.filter((app: any) => app.status === 'confirmed') || [];

                        // Sort by date descending
                        confirmedAppointments.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

                        const lastSession = confirmedAppointments.length > 0 ? confirmedAppointments[0].date : null;

                        return {
                            ...client,
                            lastSession: confirmedAppointments.length > 0 ? confirmedAppointments[0] : null
                        };
                    });

                    setClients(clientsWithHistory);
                }

            } catch (error) {
                console.error('Error fetching clients:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchClients();
    }, [router]);

    // Filter Logic
    const filteredClients = clients.filter(client => {
        const searchLower = searchTerm.toLowerCase();
        return (
            (client.full_name?.toLowerCase() || '').includes(searchLower) ||
            (client.email?.toLowerCase() || '').includes(searchLower) ||
            (client.dni?.toString() || '').includes(searchLower)
        );
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8 pb-32">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <User className="w-8 h-8 text-indigo-600" />
                            Lista de Clientes
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Administra y visualiza la información de tus alumnos registrados.
                        </p>
                    </div>

                    <div className="relative w-full md:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o DNI..."
                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl leading-5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </header>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                                <thead className="bg-gray-50 dark:bg-gray-800/50">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Cliente
                                        </th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Contacto
                                        </th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            DNI / Identificación
                                        </th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Fecha Registro
                                        </th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Última Sesión
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                    {filteredClients.length > 0 ? (
                                        filteredClients.map((client) => (
                                            <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                                                                {client.full_name?.charAt(0).toUpperCase() || <User className="w-5 h-5" />}
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {client.full_name || 'Sin nombre'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                            <Mail className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                            {client.email}
                                                        </div>
                                                        {client.phone && (
                                                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                                <Phone className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                                {client.phone}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center text-sm text-gray-900 dark:text-white font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded w-fit">
                                                        <FileText className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                        {client.dni || '---'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    <div className="flex items-center">
                                                        <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                        {client.created_at ? format(new Date(client.created_at), 'd MMM yyyy', { locale: es }) : '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {client.lastSession ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                                {format(new Date(client.lastSession.date), 'd MMM yyyy', { locale: es })}
                                                            </span>
                                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 capitalize">
                                                                {client.lastSession.modality === 'online' ? (
                                                                    <Video className="w-3 h-3 text-blue-500" />
                                                                ) : (
                                                                    <MapPin className="w-3 h-3 text-emerald-500" />
                                                                )}
                                                                {format(new Date(client.lastSession.date), 'EEEE', { locale: es })}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
                                                            Sin historial
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                                No se encontraron clientes con esa búsqueda.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-3 border-t border-gray-200 dark:border-gray-800">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Mostrando {filteredClients.length} usuarios registrados.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
