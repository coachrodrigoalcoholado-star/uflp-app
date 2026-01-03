"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./ProfileForm.module.css";

interface UserProfile {
    firstName: string;
    lastNamePaterno: string;
    lastNameMaterno: string;
    dob: string;
    sex: string;
    age: number;
    birthPlace: string;
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    phone: string;
    landline: string;
    email: string;
    alternativeEmail: string;
    profession: string;
    educationLevel: string;
    institution: string;
    currentOccupation: string;
    sedeNombre: string;
    entrenadorNombre: string;
    entrenadorCelular: string;
}

interface ProfileFormProps {
    isCompleted: boolean;
}

export default function ProfileForm({ isCompleted }: ProfileFormProps) {
    const [showNext, setShowNext] = useState(isCompleted);
    const [profile, setProfile] = useState<UserProfile>({
        firstName: "",
        lastNamePaterno: "",
        lastNameMaterno: "",
        dob: "",
        sex: "",
        age: 0,
        birthPlace: "",
        address: "",
        city: "",
        state: "",
        country: "",
        zipCode: "",
        phone: "",
        landline: "",
        email: "",
        alternativeEmail: "",
        profession: "",
        educationLevel: "",
        institution: "",
        currentOccupation: "",
        sedeNombre: "",
        entrenadorNombre: "",
        entrenadorCelular: "",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });
    const router = useRouter();

    useEffect(() => {
        fetch("/api/profile")
            .then((res) => {
                if (!res.ok) throw new Error("Error cargando perfil");
                return res.json();
            })
            .then((data) => {
                // Formatear fecha para input date (YYYY-MM-DD)
                if (data.dob) {
                    data.dob = new Date(data.dob).toISOString().split('T')[0];
                }
                setProfile((prev) => ({ ...prev, ...data }));
            })
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProfile((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ text: "", type: "" });

        // Validación de campos obligatorios
        const requiredFields = [
            "firstName", "lastNamePaterno", "lastNameMaterno", "dob", "sex", "age",
            "birthPlace", "address", "city", "state", "country", "zipCode",
            "phone", "landline", "alternativeEmail", "profession",
            "educationLevel", "institution", "currentOccupation",
            "sedeNombre", "entrenadorNombre", "entrenadorCelular"
        ];

        const missingFields = requiredFields.filter(field => {
            const value = profile[field as keyof UserProfile];
            return !value || (field === "age" && value === 0);
        });

        if (missingFields.length > 0) {
            setMessage({ text: "Por favor, completa todos los campos obligatorios.", type: "error" });
            setSaving(false);
            // Scroll al inicio para ver el mensaje
            window.scrollTo(0, 0);
            return;
        }

        try {
            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profile),
            });

            if (res.ok) {
                setMessage({ text: "Perfil actualizado correctamente", type: "success" });
                router.refresh();
                window.scrollTo(0, 0);
                setShowNext(true);
            } else {
                setMessage({ text: "Error al actualizar perfil", type: "error" });
            }
        } catch (error) {
            setMessage({ text: "Error de conexión", type: "error" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <p>Cargando perfil...</p>;

    return (
        <>
            <form onSubmit={handleSubmit} className={styles.formContainer}>
                {message.text && (
                    <div className={`${styles.message} ${message.type === "success" ? styles.success : styles.error}`}>
                        {message.text}
                    </div>
                )}

                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Datos Personales</h3>
                    <div className={styles.gridTwoCols}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Nombre(s) *</label>
                            <input type="text" name="firstName" value={profile.firstName || ""} onChange={handleChange} className={styles.input} required />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Apellido Paterno *</label>
                            <input type="text" name="lastNamePaterno" value={profile.lastNamePaterno || ""} onChange={handleChange} className={styles.input} required />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Apellido Materno *</label>
                            <input type="text" name="lastNameMaterno" value={profile.lastNameMaterno || ""} onChange={handleChange} className={styles.input} required />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Fecha de Nacimiento *</label>
                            <input type="date" name="dob" value={profile.dob || ""} onChange={handleChange} className={styles.input} required />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Edad *</label>
                            <input type="number" name="age" value={profile.age || ""} onChange={handleChange} className={styles.input} required min="1" />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Sexo *</label>
                            <select name="sex" value={profile.sex || ""} onChange={handleChange} className={styles.select} required>
                                <option value="">Seleccionar</option>
                                <option value="Masculino">Masculino</option>
                                <option value="Femenino">Femenino</option>
                            </select>
                        </div>
                        <div className={`${styles.fieldGroup} ${styles.gridFull}`}>
                            <label className={styles.label}>Lugar de Nacimiento *</label>
                            <input type="text" name="birthPlace" value={profile.birthPlace || ""} onChange={handleChange} className={styles.input} required />
                        </div>
                    </div>
                </div>

                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Domicilio y Contacto</h3>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Domicilio (Calle, Número, Depto) *</label>
                        <input type="text" name="address" value={profile.address || ""} onChange={handleChange} className={styles.input} required />
                    </div>
                    <div className={styles.gridTwoCols}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Municipio o Localidad *</label>
                            <input type="text" name="city" value={profile.city || ""} onChange={handleChange} className={styles.input} required />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Estado o Provincia *</label>
                            <input type="text" name="state" value={profile.state || ""} onChange={handleChange} className={styles.input} required />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>País *</label>
                            <input type="text" name="country" value={profile.country || ""} onChange={handleChange} className={styles.input} required />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Código Postal *</label>
                            <input type="text" name="zipCode" value={profile.zipCode || ""} onChange={handleChange} className={styles.input} required />
                        </div>
                    </div>
                    <div className={styles.gridTwoCols} style={{ marginTop: "1rem" }}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Teléfono Celular / Personal *</label>
                            <input type="text" name="phone" value={profile.phone || ""} onChange={handleChange} className={styles.input} required />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Teléfono Fijo *</label>
                            <input type="text" name="landline" value={profile.landline || ""} onChange={handleChange} className={styles.input} required />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Email Personal (No editable)</label>
                            <input type="email" name="email" value={profile.email || ""} readOnly className={`${styles.input} ${styles.readOnly}`} />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Email de Amigo o Familiar *</label>
                            <input type="email" name="alternativeEmail" value={profile.alternativeEmail || ""} onChange={handleChange} className={styles.input} required />
                        </div>
                    </div>
                </div>

                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Información Profesional y Académica</h3>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Ocupación o Área Profesional *</label>
                        <input type="text" name="profession" value={profile.profession || ""} onChange={handleChange} className={styles.input} required />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Escolaridad Máxima Alcanzada *</label>
                        <select name="educationLevel" value={profile.educationLevel || ""} onChange={handleChange} className={styles.select} required>
                            <option value="">Seleccionar</option>
                            <option value="Secundario completo">Secundario completo</option>
                            <option value="Terciario completo">Terciario completo</option>
                            <option value="Universitario completo">Universitario completo</option>
                            <option value="Postgrado completo">Postgrado completo</option>
                        </select>
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Instituto que otorga el título *</label>
                        <input type="text" name="institution" value={profile.institution || ""} onChange={handleChange} className={styles.input} required />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Ocupación Actual *</label>
                        <input type="text" name="currentOccupation" value={profile.currentOccupation || ""} onChange={handleChange} className={styles.input} required />
                    </div>
                </div>

                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Datos de la Sede</h3>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Nombre de la Sede donde se recibió (ej: Sede Córdoba) *</label>
                        <input type="text" name="sedeNombre" value={profile.sedeNombre || ""} onChange={handleChange} className={styles.input} required />
                    </div>
                    <div className={styles.gridTwoCols}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Nombre de Entrenador *</label>
                            <input type="text" name="entrenadorNombre" value={profile.entrenadorNombre || ""} onChange={handleChange} className={styles.input} required />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Número de Cel Entrenador *</label>
                            <input type="text" name="entrenadorCelular" value={profile.entrenadorCelular || ""} onChange={handleChange} className={styles.input} required />
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className={styles.submitButton}
                >
                    {saving ? "Guardando..." : "Guardar Cambios"}
                </button>
            </form>

            {
                showNext && (
                    <div className={styles.nextStepCard}>
                        <h3 className={styles.nextStepTitle}>¡Perfil Completado!</h3>
                        <button
                            onClick={() => router.push("/dashboard/documents")}
                            className={styles.nextStepButton}
                        >
                            IR A MIS DOCUMENTOS →
                        </button>
                    </div>
                )
            }
        </>
    );
}
