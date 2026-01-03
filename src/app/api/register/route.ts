import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { revalidateTag } from 'next/cache';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password, firstName, lastNamePaterno, lastNameMaterno } = body;

        console.log("Recibida petición de registro:", { email, firstName });

        if (!email || !password) {
            return NextResponse.json(
                { message: "Email y contraseña son requeridos" },
                { status: 400 }
            );
        }

        console.log("Verificando usuario existente...");
        const existingUser = await prisma.user.findUnique({
            where: {
                email,
            },
        });

        if (existingUser) {
            console.log("Usuario ya existe");
            return NextResponse.json(
                { message: "El usuario ya existe" },
                { status: 400 }
            );
        }

        console.log("Hasheando contraseña...");
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log("Creando usuario en DB...");
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastNamePaterno,
                lastNameMaterno,
                role: "STUDENT", // Default role
            },
        });
        console.log("Usuario creado:", user.id);

        // Invalidate admin analytics cache
        // @ts-ignore - Next.js version mismatch workaround
        revalidateTag('admin-analytics', undefined);

        return NextResponse.json(
            { message: "Usuario creado exitosamente", user: { id: user.id, email: user.email } },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Error en registro:", error);
        return NextResponse.json(
            { message: error.message || "Error interno del servidor" },
            { status: 500 }
        );
    }
}
