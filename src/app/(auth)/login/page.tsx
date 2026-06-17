"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import styles from "./login.module.css";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Credenciales inválidas");
            } else {
                router.push("/");
            }
        } catch (err) {
            setError("Ocurrió un error al iniciar sesión");
        } finally {
            setLoading(false);
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

                <h1 className={styles.title}>Iniciar Sesión</h1>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && <div className={styles.error}>{error}</div>}

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

                    <div className={styles.inputGroup}>
                        <label htmlFor="password" className={styles.label}>
                            Contraseña
                        </label>
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

                    <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
                        <Link href="/forgot-password" style={{ color: '#0B5394', fontSize: '0.9rem', textDecoration: 'none' }}>
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>

                    <button type="submit" className={styles.button} disabled={loading}>
                        {loading ? "Ingresando..." : "Ingresar"}
                    </button>
                </form>

                <div className={styles.footer}>
                    ¿No tienes una cuenta?{" "}
                    <Link href="/register" className={styles.link}>
                        Regístrate aquí
                    </Link>
                </div>
            </div>
        </div>
    );
}
