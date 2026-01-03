import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { deleteFileFromSupabase } from "@/lib/supabase";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.email) {
            return NextResponse.json({ message: "No autorizado" }, { status: 401 });
        }

        const { id: documentId } = await params;

        // Buscar el documento y verificar que pertenezca al usuario
        const document = await prisma.document.findUnique({
            where: { id: documentId },
            include: { user: true },
        });

        if (!document) {
            return NextResponse.json({ message: "Documento no encontrado" }, { status: 404 });
        }

        if (document.user.email !== session.user.email && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'SUPERADMIN' && session.user.role !== 'ADMIN') {
            return NextResponse.json({ message: "Prohibido" }, { status: 403 });
        }

        // Eliminar archivo de Supabase si es una URL remota
        if (document.url.startsWith("http")) {
            try {
                await deleteFileFromSupabase(document.url);
            } catch (err) {
                console.error(`Error eliminando archivo de Supabase: ${err}`);
            }
        }

        // Eliminar registro de la base de datos
        await prisma.document.delete({
            where: { id: documentId },
        });

        return NextResponse.json({ message: "Documento eliminado" });
    } catch (error: any) {
        console.error("API DELETE: Error interno:", error);
        return NextResponse.json(
            { message: "Error interno del servidor: " + error.message },
            { status: 500 }
        );
    }
}
