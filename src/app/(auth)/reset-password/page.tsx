"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import styles from "../login/login.module.css";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setStatus('error');
            setMessage("Las contraseñas no coinciden.");
            return;
        }

        if (password.length < 6) {
            setStatus('error');
            setMessage("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        setStatus('loading');
        setMessage("");

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus('success');
                setMessage("Contraseña actualizada correctamente.");
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            } else {
                setStatus('error');
                setMessage(data.message || "Error al restablecer contraseña.");
            }
        } catch (error) {
            setStatus('error');
            setMessage("Error de conexión.");
        }
    };

    if (!token) {
        return (
            <div className={styles.error}>
                Token inválido o faltante. Por favor solicita un nuevo enlace.
                <div style={{ marginTop: '10px' }}>
                    <Link href="/forgot-password" className={styles.link}>Volver a intentar</Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.logoHeader}>
                    <Image src="/images/logo-uflp.png" alt="UFLP" width={100} height={40} style={{ objectFit: 'contain' }} />
                    <Image src="/images/logo-ecoa.png" alt="ECOA" width={100} height={40} style={{ objectFit: 'contain' }} />
                </div>

                <h1 className={styles.title}>Restablecer Contraseña</h1>

                {status === 'success' ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            backgroundColor: '#dcfce7',
                            color: '#166534',
                            padding: '1rem',
                            borderRadius: '8px',
                            marginBottom: '1.5rem',
                            border: '1px solid #86efac'
                        }}>
                            {message}
                        </div>
                        <p>Redirigiendo al login...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className={styles.form}>
                        {status === 'error' && <div className={styles.error}>{message}</div>}

                        <div className={styles.inputGroup}>
                            <label htmlFor="password" className={styles.label}>Nueva Contraseña</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={styles.input}
                                required
                                placeholder="••••••••"
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="confirmPassword" className={styles.label}>Confirmar Contraseña</label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={styles.input}
                                required
                                placeholder="••••••••"
                            />
                        </div>

                        <button type="submit" className={styles.button} disabled={status === 'loading'}>
                            {status === 'loading' ? "Actualizando..." : "Cambiar Contraseña"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}
