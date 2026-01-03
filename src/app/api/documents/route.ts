import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { updateDocumentsCompletion } from "@/lib/userProgress";
import { uploadFileToSupabase } from "@/lib/supabase";
import path from "path";
import { revalidateTag } from 'next/cache';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.email) {
            return NextResponse.json({ message: "No autorizado" }, { status: 401 });
        }

        const documents = await prisma.document.findMany({
            where: {
                user: {
                    email: session.user.email,
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(documents);
    } catch (error: any) {
        console.error("Error obteniendo documentos:", error);
        return NextResponse.json(
            { message: "Error interno del servidor" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.email) {
            return NextResponse.json({ message: "No autorizado" }, { status: 401 });
        }

        // Buscar usuario PRIMERO para tener sus datos para el nombre del archivo
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;
        const type = formData.get("type") as string;

        if (!file || !type) {
            return NextResponse.json(
                { message: "Archivo y tipo son requeridos" },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Obtener extensión original
        const ext = path.extname(file.name);

        // Construir nuevo nombre: TIPO - Nombre Apellido
        // Sanitize para evitar caracteres inválidos
        const userName = `${user.firstName || ''} ${user.lastNamePaterno || ''}`.trim();

        const normalize = (str: string) => {
            return str
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-zA-Z0-9\-]/g, "_")
                .replace(/_+/g, "_")
                .toLowerCase();
        };

        const safeType = normalize(type);
        const safeUserName = normalize(userName);

        const baseFilename = `${safeType}_${safeUserName}`;
        const filename = `${baseFilename}_${Date.now()}${ext}`;

        // Subir a Supabase Storage
        // Content-Type es importante para que el navegador sepa cómo mostrarlo
        const fileUrl = await uploadFileToSupabase(buffer, filename, file.type);

        const newDocument = await prisma.document.create({
            data: {
                type,
                url: fileUrl, // Ahora guardamos la URL pública de Supabase
                userId: user.id,
                status: "PENDING",
            },
        });

        // Actualizar estado de documentos del usuario
        await updateDocumentsCompletion(user.id);

        // Invalidate admin analytics cache
        // @ts-ignore - Next.js version mismatch workaround
        revalidateTag('admin-analytics', undefined);

        return NextResponse.json(newDocument, { status: 201 });
    } catch (error: any) {
        console.error("Error subiendo documento:", error);
        return NextResponse.json(
            { message: "Error interno del servidor: " + error.message },
            { status: 500 }
        );
    }
}
