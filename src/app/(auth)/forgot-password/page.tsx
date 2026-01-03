"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "../login/login.module.css"; // Reuse login styles

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setMessage("");

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus('success');
                setMessage("Si el correo existe, recibirás un enlace para restablecer tu contraseña.");
            } else {
                setStatus('error');
                setMessage(data.message || "Ocurrió un error.");
            }
        } catch (error) {
            setStatus('error');
            setMessage("Error de conexión.");
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.logoHeader}>
                    <Image
                        src="/images/logo-uflp.png"
                        alt="UFLP"
                        width={100}
                        height={40}
                        style={{ objectFit: 'contain' }}
                    />
                    <Image
                        src="/images/logo-ecoa.png"
                        alt="ECOA"
                        width={100}
                        height={40}
                        style={{ objectFit: 'contain' }}
                    />
                </div>

                <h1 className={styles.title}>Recuperar Contraseña</h1>

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
                        <Link href="/login" className={styles.button} style={{ display: 'inline-block', textDecoration: 'none' }}>
                            Volver al Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className={styles.form}>
                        {status === 'error' && (
                            <div className={styles.error}>{message}</div>
                        )}

                        <p style={{ marginBottom: '1.5rem', color: '#4b5563', fontSize: '0.95rem', textAlign: 'center' }}>
                            Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.
                        </p>

                        <div className={styles.inputGroup}>
                            <label htmlFor="email" className={styles.label}>
                                Correo Electrónico
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={styles.input}
                                required
                                placeholder="ejemplo@correo.com"
                            />
                        </div>

                        <button type="submit" className={styles.button} disabled={status === 'loading'}>
                            {status === 'loading' ? "Enviando..." : "Enviar enlace"}
                        </button>

                        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                            <Link href="/login" style={{ color: '#0B5394', fontSize: '0.9rem', textDecoration: 'none' }}>
                                Cancelar y volver
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
