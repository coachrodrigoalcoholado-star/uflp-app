'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LogIn, Lock, Mail, Loader2, ArrowRight, User, Phone, ChevronLeft, Fingerprint, Star } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();

    // Steps: 'dni' -> 'password' (login fallback) OR 'register' (signup)
    const [step, setStep] = useState<'dni' | 'password' | 'register'>('dni');

    // Data
    const [dni, setDni] = useState('');
    const [userName, setUserName] = useState(''); // For greeting existing users
    const [formData, setFormData] = useState({
        email: '',
        password: '', // Kept for manual entry if needed
        full_name: '',
        phone: ''
    });

    // UI
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // STEP 0: Check DNI
    const handleDniSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Basic validation: Numbers only
        if (!/^\d+$/.test(dni)) {
            setError('Por favor, ingresa solo números, sin puntos ni espacios.');
            setLoading(false);
            return;
        }

        try {
            // Call our custom Postgres function
            const { data, error } = await supabase.rpc('check_user_by_dni', { input_dni: dni });

            if (error) throw error;

            if (data && data.exists) {
                // User exists. Try to login with DNI as password immediately
                const email = data.email;
                setUserName(data.full_name?.split(' ')[0] || 'Hola');

                if (email) {
                    // Attempt Auto-Login with DNI as password
                    const { error: loginError } = await supabase.auth.signInWithPassword({
                        email: email,
                        password: dni,
                    });

                    if (!loginError) {
                        router.push('/dashboard');
                        return;
                    }
                }

                // If auto-login failed (different password) or no email returned, 
                // Fallback to manual password entry.
                if (email) setFormData(prev => ({ ...prev, email }));
                setStep('password');

            } else {
                // User does NOT exist -> Register
                setStep('register');
            }

        } catch (err: any) {
            console.error('RPC Error:', err);
            setError('Hubo un problema verificando tu DNI. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    // STEP 1: Login (Fallback for custom passwords)
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (error) throw error;
            router.push('/dashboard');

        } catch (err: any) {
            setError('Contraseña incorrecta.');
        } finally {
            setLoading(false);
        }
    };

    // STEP 2: Register (New User - Password IS DNI)
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. SignUp using DNI as password
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: dni, // AUTO-SET PASSWORD TO DNI
                options: {
                    data: {
                        full_name: formData.full_name,
                        phone: formData.phone,
                        dni: dni
                    }
                }
            });

            if (error) throw error;

            if (data.user) {
                // 2. Force update profile to ensure DNI is in the table
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({
                        dni: dni,
                        full_name: formData.full_name,
                        phone: formData.phone
                    })
                    .eq('id', data.user.id);

                if (profileError) console.warn('Profile update warning:', profileError);

                router.push('/dashboard');
            }

        } catch (err: any) {
            setError(err.message || 'Error al registrar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 transition-colors duration-500">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 relative">

                {/* Header Graphic */}
                <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

                <div className="p-8">

                    {/* Header Text */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-400 text-white shadow-lg shadow-blue-500/30 mb-4">
                            <Fingerprint className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Acceso Inteligente</h1>
                        <p className="text-gray-500 text-sm mt-1">Gestiona tus turnos al instante.</p>
                    </div>

                    {/* ERROR MESSAGE */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-900/20 flex items-start gap-2 animate-in slide-in-from-top-2">
                            <span className="mt-0.5">⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* --- STEP 0: DNI INPUT --- */}
                    {step === 'dni' && (
                        <form onSubmit={handleDniSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-900 dark:text-white ml-1">
                                    Ingresa tu DNI
                                </label>
                                <input
                                    type="tel" // Numeric
                                    value={dni}
                                    onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                                    className="block w-full px-4 py-4 text-center text-2xl tracking-widest font-bold border border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                    placeholder="00000000"
                                    maxLength={8}
                                    autoFocus
                                    inputMode="numeric"
                                />
                                <p className="text-xs text-center text-gray-400">Sin puntos ni espacios</p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || dni.length < 6}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/20 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> :
                                    <>
                                        Continuar <ArrowRight className="w-5 h-5" />
                                    </>
                                }
                            </button>
                        </form>
                    )}

                    {/* --- STEP 1: PASSWORD FALLBACK (Only displayed if auto-login fails) --- */}
                    {step === 'password' && (
                        <form onSubmit={handleLogin} className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                            <div className="text-center mb-6">
                                <p className="text-lg font-medium text-gray-900 dark:text-white">
                                    👋 ¡Hola, <span className="text-blue-600 font-bold">{userName}</span>!
                                </p>
                                <p className="text-sm text-gray-500">Ingresa tu contraseña para entrar.</p>
                            </div>

                            {/* Email Field (Required because simple DNI login isn't secure without backend mapping) */}
                            <div className="space-y-2">
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="block w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        placeholder="Tu Email"
                                    />
                                </div>
                            </div>


                            <div className="space-y-2">
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="block w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        placeholder="Tu Contraseña"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ingresar'}
                            </button>

                            <button type="button" onClick={() => setStep('dni')} className="w-full text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white py-2">
                                No soy {userName} (Cambiar DNI)
                            </button>
                        </form>
                    )}

                    {/* --- STEP 2: REGISTER (Simplified - NO PASSWORD FIELD) --- */}
                    {step === 'register' && (
                        <form onSubmit={handleRegister} className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-300">
                            <div className="text-center mb-2">
                                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-600 mb-2">
                                    <Star className="w-5 h-5" fill="currentColor" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Crear Cuenta</h3>
                                <p className="text-xs text-gray-500">Es tu primera vez. Completa tus datos.</p>
                            </div>

                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    required
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="block w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 outline-none focus:border-blue-500"
                                    placeholder="Nombre Completo"
                                />
                            </div>

                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="block w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 outline-none focus:border-blue-500"
                                    placeholder="Email"
                                />
                            </div>

                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="block w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 outline-none focus:border-blue-500"
                                    placeholder="WhatsApp (con cód. área)"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2 mt-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Registrarme y Entrar'}
                            </button>

                            <button type="button" onClick={() => setStep('dni')} className="w-full text-xs text-center text-gray-500 hover:text-gray-900 mt-4">
                                Volver a ingresar DNI
                            </button>
                        </form>
                    )}

                </div>
            </div>
            {/* Footer */}
            <div className="absolute bottom-4 text-center w-full text-[10px] text-gray-400 opacity-60">
                🔒 Sistema Seguro • Syncro
            </div>
        </div>
    );
}
