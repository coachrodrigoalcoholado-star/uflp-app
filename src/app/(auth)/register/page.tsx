"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import styles from "./register.module.css";

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        firstName: "",
        lastNamePaterno: "",
        lastNameMaterno: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("Las contraseñas no coinciden");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    firstName: formData.firstName,
                    lastNamePaterno: formData.lastNamePaterno,
                    lastNameMaterno: formData.lastNameMaterno,
                }),
            });

            if (res.ok) {
                router.push("/login");
            } else {
                const data = await res.json();
                setError(data.message || "Error al registrar usuario");
            }
        } catch (err) {
            setError("Ocurrió un error al registrarse");
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

                <h1 className={styles.title}>Crear Cuenta</h1>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && <div className={styles.error}>{error}</div>}

                    <div className={styles.inputGroup}>
                        <label htmlFor="firstName" className={styles.label}>
                            Nombre
                        </label>
                        <input
                            id="firstName"
                            type="text"
                            value={formData.firstName}
                            onChange={handleChange}
                            className={styles.input}
                            required
                            placeholder="Juan"
                        />
                    </div>

                    <div className={styles.row}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="lastNamePaterno" className={styles.label}>
                                Apellido Paterno
                            </label>
                            <input
                                id="lastNamePaterno"
                                type="text"
                                value={formData.lastNamePaterno}
                                onChange={handleChange}
                                className={styles.input}
                                required
                                placeholder="Pérez"
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="lastNameMaterno" className={styles.label}>
                                Apellido Materno
                            </label>
                            <input
                                id="lastNameMaterno"
                                type="text"
                                value={formData.lastNameMaterno}
                                onChange={handleChange}
                                className={styles.input}
                                placeholder="García"
                            />
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="email" className={styles.label}>
                            Correo Electrónico
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={styles.input}
                            required
                            placeholder="juan.perez@ejemplo.com"
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password" className={styles.label}>
                            Contraseña
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={styles.input}
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="confirmPassword" className={styles.label}>
                            Confirmar Contraseña
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className={styles.input}
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    <button type="submit" className={styles.button} disabled={loading}>
                        {loading ? "Registrando..." : "Registrarse"}
                    </button>
                </form>

                <div className={styles.footer}>
                    ¿Ya tienes una cuenta?{" "}
                    <Link href="/login" className={styles.link}>
                        Inicia sesión aquí
                    </Link>
                </div>
            </div>
        </div>
    );
}
