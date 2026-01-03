"use client";

import DeleteDocumentButton from "@/components/DeleteDocumentButton";
import styles from "./DocumentsTable.module.css";

interface Document {
    id: string;
    type: string;
    url: string;
    status: string;
    createdAt: string;
}

interface DocumentsTableProps {
    documents: Document[];
}

export default function DocumentsTable({ documents }: DocumentsTableProps) {
    if (documents.length === 0) {
        return <p>No has subido ningún documento aún.</p>;
    }

    return (
        <table className={styles.table}>
            <thead className={styles.thead}>
                <tr>
                    <th className={styles.th}>Tipo</th>
                    <th className={styles.th}>URL</th>
                    <th className={styles.th}>Estado</th>
                    <th className={styles.th}>Fecha</th>
                    <th className={styles.th}>Acciones</th>
                </tr>
            </thead>
            <tbody className={styles.tbody}>
                {documents.map((doc) => (
                    <tr key={doc.id} className={styles.tr}>
                        <td className={styles.td} data-label="Tipo">{doc.type}</td>
                        <td className={styles.td} data-label="URL">
                            {doc.status !== 'APPROVED' ? (
                                <a href={doc.url} target="_blank" rel="noopener noreferrer" className={styles.link}>
                                    Ver Documento
                                </a>
                            ) : (
                                <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                                    Archivado
                                </span>
                            )}
                        </td>
                        <td className={styles.td} data-label="Estado">
                            <span className={`${styles.badge} ${doc.status === "APPROVED" ? styles.approved :
                                doc.status === "REJECTED" ? styles.rejected :
                                    styles.pending
                                }`}>
                                {doc.status === "APPROVED" ? "Aprobado" : doc.status === "REJECTED" ? "Rechazado" : "Pendiente"}
                            </span>
                        </td>
                        <td className={styles.td} data-label="Fecha">
                            {new Date(doc.createdAt).toLocaleDateString()}
                        </td>
                        <td className={styles.td} data-label="Acciones">
                            {doc.status !== 'APPROVED' && (
                                <DeleteDocumentButton id={doc.id} />
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
