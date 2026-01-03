import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import DocumentUploadForm from "@/components/DocumentUploadForm";
import DocumentsTable from "@/components/DocumentsTable";
import Link from "next/link";
import { DOCUMENT_TYPES } from "@/lib/constants";
import AppHeader from "@/components/AppHeader";

export const dynamic = 'force-dynamic';

async function getDocuments(email: string) {
    return await prisma.document.findMany({
        where: {
            user: {
                email: email,
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}

export default async function DocumentsPage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        redirect("/login");
    }

    // Obtener el usuario completo para verificar progreso
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, profileCompleted: true }
    });

    if (!user) {
        redirect("/login");
    }

    // Verificar si el perfil está completo
    if (!user.profileCompleted) {
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
                            Primero debes completar tu perfil para acceder a esta sección.
                        </p>
                        <Link
                            href="/dashboard/profile"
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
                            Ir a Mi Perfil
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    const documents = await getDocuments(session.user.email);
    const existingTypes = documents.map(doc => doc.type);

    // Calcular progreso
    const uploadedRequiredTypes = existingTypes.filter(type => DOCUMENT_TYPES.includes(type));
    const uniqueUploadedCount = new Set(uploadedRequiredTypes).size;
    const totalTypes = DOCUMENT_TYPES.length;
    const progressPercentage = Math.round((uniqueUploadedCount / totalTypes) * 100);

    const approvedDocuments = documents.filter(doc => doc.status === 'APPROVED' && DOCUMENT_TYPES.includes(doc.type));
    const uniqueApprovedCount = new Set(approvedDocuments.map(doc => doc.type)).size;
    const isAllApproved = uniqueApprovedCount === totalTypes;

    return (
        <div style={{ padding: "100px 2rem 2rem 2rem", maxWidth: "800px", margin: "0 auto" }}>
            <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h1>Gestión de Documentos</h1>
                <Link href="/" style={{ textDecoration: "underline", color: "#0070f3" }}>Volver al Inicio</Link>
            </div>

            <div style={{ marginBottom: "2rem", padding: "1rem", backgroundColor: "#f0f0f0", borderRadius: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ fontWeight: "bold" }}>Progreso de Documentación</span>
                    <span>{progressPercentage}% ({uniqueUploadedCount}/{totalTypes})</span>
                </div>
                <div style={{ width: "100%", height: "10px", backgroundColor: "#ccc", borderRadius: "5px", overflow: "hidden" }}>
                    <div style={{
                        width: `${progressPercentage}%`,
                        height: "100%",
                        backgroundColor: progressPercentage === 100 ? "#10b981" : "#0070f3",
                        transition: "width 0.5s ease-in-out"
                    }} />
                </div>
            </div>

            {progressPercentage === 100 && (
                <div style={{ marginBottom: "2rem", textAlign: "center", padding: "1rem", background: "#dcfce7", borderRadius: "8px", border: "1px solid #166534" }}>
                    <h3 style={{ color: "#166534", marginBottom: "1rem" }}>¡Documentación Completada!</h3>
                    <div style={{ marginBottom: "1rem", color: "#166534" }}>
                        El administrador controlará los documentos enviados. Puedes avanzar a la sección de pagos.
                    </div>
                    <Link
                        href="/dashboard/payments"
                        style={{
                            display: "inline-block",
                            padding: "1rem 2rem",
                            backgroundColor: "#166534",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "1.1rem",
                            fontWeight: "bold",
                            textDecoration: "none",
                            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                        }}
                    >
                        IR A MIS PAGOS →
                    </Link>
                </div>
            )}

            <DocumentUploadForm existingTypes={existingTypes} />

            <div style={{ marginTop: "2rem" }}>
                <h2>Mis Documentos</h2>
                <DocumentsTable documents={documents.map(doc => ({
                    ...doc,
                    createdAt: doc.createdAt.toISOString()
                }))} />
            </div>
        </div>
    );
}
