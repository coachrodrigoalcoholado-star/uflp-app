"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { DOCUMENT_TYPES } from "@/lib/constants";
import styles from "./DocumentUploadForm.module.css";

interface DocumentUploadFormProps {
    existingTypes: string[];
}

export default function DocumentUploadForm({ existingTypes }: DocumentUploadFormProps) {
    // Filtrar tipos disponibles
    const availableTypes = DOCUMENT_TYPES.filter(type => !existingTypes.includes(type));

    // Estado inicial: primer tipo disponible o cadena vacía si no hay
    const [type, setType] = useState(availableTypes[0] || "");
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const router = useRouter();

    // Actualizar el tipo seleccionado cuando cambian los tipos disponibles
    useEffect(() => {
        if (availableTypes.length > 0 && !availableTypes.includes(type)) {
            setType(availableTypes[0]);
        }
    }, [availableTypes, type]);

    const compressImage = async (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            // Only compress images
            if (!file.type.startsWith('image/')) {
                resolve(file);
                return;
            }

            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = document.createElement('img');
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Max dimensions
                    const MAX_WIDTH = 1920;
                    const MAX_HEIGHT = 1920;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (blob) {
                            const newFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });
                            resolve(newFile);
                        } else {
                            reject(new Error('Canvas to Blob failed'));
                        }
                    }, 'image/jpeg', 0.7); // 0.7 quality
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const originalFile = e.target.files[0];

            // Validate size (e.g., 10MB limit for non-images, images get compressed)
            if (originalFile.size > 10 * 1024 * 1024 && !originalFile.type.startsWith('image/')) {
                setMessage("El archivo es demasiado grande (máx 10MB).");
                setFile(null);
                e.target.value = "";
                return;
            }

            setMessage("Procesando archivo...");
            try {
                const processedFile = await compressImage(originalFile);
                setFile(processedFile);
                setMessage(""); // Clear processing message
            } catch (error) {
                console.error("Error compressing image:", error);
                setMessage("Error al procesar la imagen. Intenta con otro archivo.");
                setFile(null);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setMessage("Por favor selecciona un archivo");
            return;
        }
        if (!type) {
            setMessage("No hay tipos de documentos disponibles para subir");
            return;
        }

        setLoading(true);
        setMessage("");

        const formData = new FormData();
        formData.append("type", type);
        formData.append("file", file);

        try {
            const res = await fetch("/api/documents", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                setMessage("Documento subido con éxito");
                setFile(null);
                const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                if (fileInput) fileInput.value = "";

                router.refresh();
            } else {
                const data = await res.json();
                setMessage(`Error: ${data.message}`);
            }
        } catch (error) {
            setMessage("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    if (availableTypes.length === 0) {
        return (
            <div style={{ marginBottom: "2rem", padding: "1rem", border: "1px solid #ccc", borderRadius: "8px", backgroundColor: "#f9f9f9" }}>
                <h3>¡Todo listo!</h3>
                <p>Has subido todos los documentos requeridos.</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Subir Nuevo Documento</h3>
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                    <label className={styles.label}>Tipo de Documento:</label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className={styles.select}
                    >
                        {availableTypes.map((t) => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>

                {/* Conditional Instructions for Photo */}
                {type === "FOTO TIPO CARNET - FONDO BLANCO" && (
                    <div className={styles.instructionsCard}>
                        <div className={styles.instructionsContent}>
                            <div className={styles.instructionsText}>
                                <h4 className={styles.instructionTitle}>
                                    ⚠️ IMPRESCINDIBLE
                                </h4>
                                <p style={{ fontSize: '0.9rem', color: '#4b5563', marginBottom: '1rem', fontStyle: 'italic' }}>
                                    Que respetes estas condiciones para que el trámite salga en tiempo y forma.
                                </p>

                                <ul className={styles.instructionList}>
                                    <li><strong>Blanco y negro.</strong></li>
                                    <li>
                                        <strong>Ropa formal clara:</strong> No usar blanco, negro ni colores oscuros.
                                        Únicamente tonos claros (beige, celeste, rosa, gris claro).
                                        Sin estampados. Saco y corbata también claros.
                                    </li>
                                    <li>
                                        <strong>Mujeres:</strong> Cabello recogido, frente descubierta, sin maquillaje,
                                        sin retoque, sin aretes/cadenas.
                                    </li>
                                    <li>
                                        <strong>Hombres:</strong> Cabello arreglado, cara despejada, sin barba,
                                        sin bigote, sin retoque.
                                    </li>
                                </ul>
                            </div>

                            <div className={styles.exampleImage}>
                                <div style={{ fontSize: '0.8rem', textAlign: 'center', background: '#f3f4f6', padding: '0.25rem', color: '#6b7280' }}>
                                    Ejemplo de Referencia
                                </div>
                                <Image
                                    src="/images/foto-carnet-ejemplo.png"
                                    alt="Ejemplo Foto Carnet"
                                    width={150}
                                    height={200}
                                    style={{ objectFit: 'contain' }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className={styles.formGroup}>
                    <label className={styles.label}>Archivo (PDF o Imagen):</label>
                    <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        required
                        className={styles.fileInput}
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className={styles.submitButton}
                >
                    {loading ? "Subiendo..." : "Subir Documento"}
                </button>
                {message && (
                    <p className={`${styles.message} ${message.includes("Error") ? styles.error : styles.success}`}>
                        {message}
                    </p>
                )}
            </form>
        </div>
    );
}
