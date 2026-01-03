"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteDocumentButtonProps {
  id: string;
}

export default function DeleteDocumentButton({ id }: DeleteDocumentButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar este documento?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.refresh();
        window.location.reload();
      } else {
        const data = await res.json();
        alert(`Error al eliminar el documento: ${data.message || res.statusText}`);
      }
    } catch (error) {
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      style={{
        padding: "0.25rem 0.5rem",
        backgroundColor: "#e53e3e",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: loading ? "not-allowed" : "pointer",
        fontSize: "0.875rem"
      }}
    >
      {loading ? "Eliminando..." : "Eliminar"}
    </button>
  );
}
