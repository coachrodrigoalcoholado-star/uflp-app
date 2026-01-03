"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
    return (
        <button
            onClick={() => signOut()}
            style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#ff4444",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
            }}
        >
            Cerrar Sesión
        </button>
    );
}
