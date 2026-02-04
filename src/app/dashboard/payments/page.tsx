"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";

interface Payment {
    id: string;
    amount: number;
    date: string;
    status: string;
    method: string;
    location: string;
    url: string | null;
    payerName?: string;
    rejectionReason?: string;
}

export default function PaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [accessBlocked, setAccessBlocked] = useState(false);
    const [blockMessage, setBlockMessage] = useState("");
    const [totalCost, setTotalCost] = useState(390.00); // Default, updated from API

    // Form states
    const [location, setLocation] = useState("");
    const [method, setMethod] = useState("");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState("");
    const [payerName, setPayerName] = useState("");
    const [file, setFile] = useState<File | null>(null);

    const [message, setMessage] = useState({ text: "", type: "" });
    const router = useRouter();

    // Verificar acceso al cargar la página
    useEffect(() => {
        checkAccess();
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings');
            if (res.ok) {
                const data = await res.json();
                if (data.diploma_total_cost) {
                    setTotalCost(Number(data.diploma_total_cost));
                }
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const checkAccess = async () => {
        try {
            const res = await fetch('/api/user/progress');
            if (res.ok) {
                const data = await res.json();
                if (!data.canAccessPayments) {
                    setAccessBlocked(true);
                    if (!data.profileCompleted) {
                        setBlockMessage("Primero debes completar tu perfil.");
                    } else if (!data.documentsCompleted) {
                        setBlockMessage("Primero debes completar la carga de todos tus documentos.");
                    }
                    setLoading(false);
                } else {
                    fetchPayments();
                }
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error("Error verificando acceso:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!accessBlocked) {
            fetchPayments();
        }
    }, [accessBlocked]);

    const fetchPayments = async () => {
        try {
            const res = await fetch("/api/payments");
            if (res.ok) {
                const data = await res.json();
                setPayments(data);
            }
        } catch (error) {
            console.error("Error cargando pagos:", error);
        } finally {
            setLoading(false);
        }
    };

    // Calcular saldo
    const totalPaid = payments
        .filter(p => p.status !== "REJECTED")
        .reduce((sum, p) => sum + p.amount, 0);

    const balanceDue = Math.max(0, Math.round((totalCost - totalPaid) * 100) / 100);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ text: "", type: "" });

        if (!location || !method || !amount || !date) {
            setMessage({ text: "Por favor completa todos los campos obligatorios.", type: "error" });
            return;
        }

        const inputAmount = Number(amount);
        if (inputAmount > balanceDue) {
            setMessage({ text: `El monto no puede superar el saldo restante (U$S ${balanceDue.toFixed(2)}).`, type: "error" });
            return;
        }

        if ((method === "Transferencia o Deposito bancarío en cuenta USD" || method === "Transferencia por PAYPAL") && !file) {
            setMessage({ text: "Debes subir el comprobante para transferencias/Paypal.", type: "error" });
            return;
        }

        if (method === "Efectivo" && !payerName) {
            setMessage({ text: "Debes indicar quién entregó el dinero.", type: "error" });
            return;
        }

        setSubmitting(true);
        const formData = new FormData();
        formData.append("location", location);
        formData.append("method", method);
        formData.append("amount", amount);
        formData.append("date", date);
        if (payerName) formData.append("payerName", payerName);
        if (file) formData.append("file", file);

        try {
            const res = await fetch("/api/payments", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                setMessage({ text: "Pago registrado correctamente.", type: "success" });
                setFile(null);
                setLocation("");
                setMethod("");
                setAmount("");
                setDate("");
                setPayerName("");
                fetchPayments();
                router.refresh();
            } else {
                const errorData = await res.json();
                setMessage({ text: errorData.message || "Error al registrar pago.", type: "error" });
            }
        } catch (error) {
            setMessage({ text: "Error de conexión.", type: "error" });
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "APPROVED":
                return <span style={{ backgroundColor: "#d4edda", color: "#155724", padding: "0.25rem 0.5rem", borderRadius: "4px" }}>Aprobado</span>;
            case "REJECTED":
                return <span style={{ backgroundColor: "#f8d7da", color: "#721c24", padding: "0.25rem 0.5rem", borderRadius: "4px" }}>Rechazado</span>;
            default:
                return <span style={{ backgroundColor: "#fff3cd", color: "#856404", padding: "0.25rem 0.5rem", borderRadius: "4px" }}>Pendiente</span>;
        }
    };

    if (accessBlocked) {
        return (
            <>
                <AppHeader />
                <div style={{ padding: "100px 2rem 2rem 2rem", maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
                    <div style={{
                        background: "#FFF3CD",
                        border: "1px solid #FFC107",
                        borderRadius: "12px",
                        padding: "2rem",
                        marginTop: "3rem"
                    }}>
                        <h1 style={{ color: "#856404", marginBottom: "1rem" }}>🔒 Acceso Bloqueado</h1>
                        <p style={{ color: "#856404", fontSize: "1.1rem", marginBottom: "1.5rem" }}>
                            {blockMessage}
                        </p>
                        <Link
                            href={blockMessage.includes("perfil") ? "/dashboard/profile" : "/dashboard/documents"}
                            style={{
                                display: "inline-block",
                                padding: "0.75rem 1.5rem",
                                background: "#0B5394",
                                color: "white",
                                borderRadius: "8px",
                                textDecoration: "none",
                                fontWeight: "600"
                            }}
                        >
                            {blockMessage.includes("perfil") ? "Ir a Mi Perfil" : "Ir a Mis Documentos"}
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <AppHeader />
            <div style={{ padding: "100px 2rem 2rem 2rem", maxWidth: "800px", margin: "0 auto" }}>
                <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h1>Mis Pagos</h1>
                    <Link href="/" style={{ textDecoration: "underline", color: "#0070f3" }}>Volver al Inicio</Link>
                </div>

                <div style={{ marginBottom: "2rem", padding: "1.5rem", backgroundColor: "#e6f7ff", borderRadius: "8px", border: "1px solid #91d5ff" }}>
                    <h2 style={{ marginTop: 0 }}>Estado de Cuenta</h2>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", textAlign: "center" }}>
                        <div>
                            <p style={{ margin: "0 0 0.5rem 0", color: "#666" }}>Costo Total</p>
                            <p style={{ fontSize: "1.25rem", fontWeight: "bold", margin: 0 }}>U$S {totalCost.toFixed(2)}</p>
                        </div>
                        <div>
                            <p style={{ margin: "0 0 0.5rem 0", color: "#666" }}>Abonado / Pendiente</p>
                            <p style={{ fontSize: "1.25rem", fontWeight: "bold", margin: 0, color: "#0070f3" }}>U$S {totalPaid.toFixed(2)}</p>
                        </div>
                        <div>
                            <p style={{ margin: "0 0 0.5rem 0", color: "#666" }}>Saldo Restante</p>
                            <p style={{ fontSize: "1.25rem", fontWeight: "bold", margin: 0, color: balanceDue > 0 ? "#d32f2f" : "#388e3c" }}>
                                U$S {balanceDue.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>

                {balanceDue <= 0 ? (
                    <div style={{ marginBottom: "3rem", padding: "2rem", backgroundColor: "#d4edda", borderRadius: "8px", border: "1px solid #c3e6cb", textAlign: "center" }}>
                        <h2 style={{ color: "#155724", marginTop: 0 }}>¡Pago Completado!</h2>
                        <p style={{ fontSize: "1.1rem", color: "#155724" }}>Has cubierto el costo total de la diplomatura. No es necesario realizar más pagos.</p>
                    </div>
                ) : (
                    <div style={{ marginBottom: "3rem", padding: "1.5rem", backgroundColor: "#f9f9f9", borderRadius: "8px", border: "1px solid #eee" }}>
                        <h3>Registrar Nuevo Pago</h3>
                        {message.text && (
                            <div style={{
                                padding: "1rem",
                                marginBottom: "1rem",
                                borderRadius: "4px",
                                backgroundColor: message.type === "success" ? "#d4edda" : "#f8d7da",
                                color: message.type === "success" ? "#155724" : "#721c24",
                                fontWeight: "bold"
                            }}>
                                {message.text}
                            </div>
                        )}
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                                <div>
                                    <label htmlFor="location" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>¿Dónde resides? *</label>
                                    <select
                                        id="location"
                                        name="location"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                                        required
                                    >
                                        <option value="">Seleccionar ubicación</option>
                                        <option value="Argentina">Argentina</option>
                                        <option value="Exterior">Exterior</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="method" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Método de Pago *</label>
                                    <select
                                        id="method"
                                        name="method"
                                        value={method}
                                        onChange={(e) => setMethod(e.target.value)}
                                        style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                                        required
                                    >
                                        <option value="">Seleccionar método</option>
                                        <option value="Efectivo">Efectivo</option>
                                        <option value="Transferencia o Deposito bancarío en cuenta USD">Transferencia o Deposito bancarío en cuenta USD</option>
                                        <option value="Transferencia por PAYPAL">Transferencia por PAYPAL</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="amount" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Monto (U$S) *</label>
                                    <input
                                        type="number"
                                        id="amount"
                                        name="amount"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                        style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="date" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Fecha del Pago *</label>
                                    <input
                                        type="date"
                                        id="date"
                                        name="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Logic for Efectivo - WhatsApp Link */}
                            {(method === "Efectivo") && (
                                <div style={{ marginBottom: "1rem" }}>
                                    <a
                                        href={`https://wa.me/5492614194014?text=${encodeURIComponent(
                                            `¡Hola! Quiero abonar mi trámite de la DIPLOMATURA DE COACHING EN UFLP de ECOA en ${method}. Por favor necesito recibir más información. Saludos!`
                                        )}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display: "block",
                                            width: "100%",
                                            padding: "0.75rem",
                                            backgroundColor: "#25D366",
                                            color: "white",
                                            textAlign: "center",
                                            borderRadius: "4px",
                                            textDecoration: "none",
                                            fontWeight: "bold"
                                        }}
                                    >
                                        <span style={{ marginRight: "0.5rem" }}>📱</span>
                                        Comunicarse por WhatsApp (+54 9 261 419-4014)
                                    </a>
                                </div>
                            )}

                            {/* Logic for Bank Transfer info */}
                            {method === "Transferencia o Deposito bancarío en cuenta USD" && (
                                <div style={{
                                    marginBottom: "1.5rem",
                                    padding: "1rem",
                                    backgroundColor: "#f0f8ff",
                                    border: "1px solid #b3e5fc",
                                    borderRadius: "8px",
                                    fontSize: "0.95rem",
                                    lineHeight: "1.6"
                                }}>
                                    <h4 style={{ marginTop: 0, color: "#0277bd", marginBottom: "0.5rem" }}>Datos Bancarios:</h4>
                                    <p style={{ margin: 0 }}><strong>Constancia de Clave Bancaria Uniforme (CBU)</strong></p>
                                    <p style={{ margin: 0 }}><strong>CAJA DE AHORROS EN DOLARES</strong></p>
                                    <p style={{ margin: 0 }}><strong>Nro.:</strong> 231309521132375</p>
                                    <p style={{ margin: 0 }}><strong>ALIAS:</strong> pablo.lema.dolares</p>
                                    <p style={{ margin: 0 }}><strong>CBU:</strong> 2850313220095211323754</p>
                                    <p style={{ margin: 0 }}><strong>BANCO:</strong> Banco Macro S.A</p>
                                    <p style={{ margin: 0 }}><strong>SUCURSAL:</strong> 313 - CERRO DE LAS ROSAS</p>
                                    <p style={{ margin: 0 }}><strong>TITULAR:</strong> PABLO JAVIER LEMA</p>
                                    <p style={{ margin: 0 }}><strong>CUIT:</strong> 20-25754890-3</p>
                                </div>
                            )}

                            {/* Logic for PayPal Link */}
                            {method === "Transferencia por PAYPAL" && (
                                <div style={{ marginBottom: "1.5rem" }}>
                                    <a
                                        href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=C282ZTSEHNFEA"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display: "block",
                                            width: "100%",
                                            padding: "0.75rem",
                                            backgroundColor: "#003087",
                                            color: "white",
                                            textAlign: "center",
                                            borderRadius: "4px",
                                            textDecoration: "none",
                                            fontWeight: "bold"
                                        }}
                                    >
                                        <span style={{ marginRight: "0.5rem" }}>💳</span>
                                        Ir a Pagar con PayPal
                                    </a>
                                </div>
                            )}

                            {method === "Efectivo" && (
                                <div style={{ marginBottom: "1rem" }}>
                                    <label htmlFor="payerName" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Nombre de quien entregó el dinero *</label>
                                    <input
                                        type="text"
                                        id="payerName"
                                        name="payerName"
                                        value={payerName}
                                        onChange={(e) => setPayerName(e.target.value)}
                                        placeholder="Nombre completo"
                                        style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                                        required
                                    />
                                </div>
                            )}

                            {(method === "Transferencia o Deposito bancarío en cuenta USD" || method === "Transferencia por PAYPAL") && (
                                <div style={{ marginBottom: "1rem" }}>
                                    <label htmlFor="file" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Comprobante de Pago *</label>
                                    <input
                                        type="file"
                                        id="file"
                                        name="file"
                                        onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                                        accept="image/*,.pdf"
                                        style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                                        required
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    backgroundColor: submitting ? "#ccc" : "#0070f3",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    fontSize: "1rem",
                                    fontWeight: "bold",
                                    cursor: submitting ? "not-allowed" : "pointer",
                                    marginTop: "1rem"
                                }}
                            >
                                {submitting ? "Registrando..." : "Registrar Pago"}
                            </button>
                        </form>
                    </div>
                )}

                <div style={{ marginTop: "3rem" }}>
                    <h3>Historial de Pagos</h3>
                    {loading ? (
                        <p>Cargando historial...</p>
                    ) : payments.length === 0 ? (
                        <p style={{ color: "#666" }}>No hay pagos registrados.</p>
                    ) : (
                        <div style={{ display: "grid", gap: "1rem" }}>
                            {payments.map((payment) => (
                                <div key={payment.id} style={{ padding: "1rem", border: "1px solid #ddd", borderRadius: "8px", backgroundColor: "white" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                                        <div>
                                            <span style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{payment.method}</span>
                                            <span style={{ marginLeft: "0.5rem", fontSize: "0.9rem", color: "#666" }}>({payment.location})</span>
                                        </div>
                                        {getStatusBadge(payment.status)}
                                    </div>
                                    <div style={{ fontSize: "0.9rem", color: "#555" }}>
                                        <p style={{ margin: "0.25rem 0" }}><strong>Fecha:</strong> {new Date(payment.date).toLocaleDateString()}</p>
                                        <p style={{ margin: "0.25rem 0" }}><strong>Monto:</strong> U$S {payment.amount.toFixed(2)}</p>
                                        {payment.payerName && (
                                            <p style={{ margin: "0.25rem 0" }}><strong>Entregado por:</strong> {payment.payerName}</p>
                                        )}
                                        {payment.url && (
                                            <a href={payment.url} target="_blank" rel="noopener noreferrer" style={{ color: "#0070f3", textDecoration: "underline", display: "inline-block", marginTop: "0.25rem" }}>
                                                Ver Comprobante
                                            </a>
                                        )}
                                    </div>
                                    {payment.rejectionReason && (
                                        <div style={{ marginTop: "0.5rem", padding: "0.5rem", backgroundColor: "#ffebee", color: "#c62828", borderRadius: "4px", fontSize: "0.9rem" }}>
                                            <strong>Motivo de rechazo:</strong> {payment.rejectionReason}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
