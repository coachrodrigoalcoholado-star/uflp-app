import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import JSZip from "jszip";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // 1. Auth Check
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== 'SUPERADMIN' && session.user.role !== 'AUDITOR')) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const resolvedParams = await params;
        const userId = resolvedParams.id;

        // 2. Fetch User & Documents
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { documents: true }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        if (!user.documents || user.documents.length === 0) {
            return new NextResponse("No documents found for this user", { status: 404 });
        }

        // 3. Initialize JSZip
        const zip = new JSZip();
        const userNameNormalized = `${user.lastNamePaterno || 'Apellido'}_${user.firstName || 'Nombre'}`
            .replace(/ /g, '_')
            .replace(/[^\w\s-]/gi, ''); // Remove special chars

        // 4. Download and add files
        const downloadPromises = user.documents.map(async (doc) => {
            try {
                // Fetch file from Supabase URL
                const response = await fetch(doc.url);
                if (!response.ok) throw new Error(`Failed to fetch ${doc.url}`);

                const arrayBuffer = await response.arrayBuffer();

                // Determine extension (from URL or fallback)
                // doc.url might be ".../filename.pdf?token=..."
                const urlPath = new URL(doc.url).pathname;
                const ext = urlPath.split('.').pop() || 'file';

                // Filename: TIPO_Apellido_Nombre.ext
                const safeType = doc.type.replace(/ /g, '_');
                const filename = `${safeType}_${userNameNormalized}.${ext}`;

                zip.file(filename, arrayBuffer);
            } catch (err) {
                console.error(`Error downloading document ${doc.id}:`, err);
                // We might skip this file but continue ZIP generation
                zip.file(`ERROR_${doc.type}.txt`, `Could not download file: ${err}`);
            }
        });

        await Promise.all(downloadPromises);

        // 5. Generate ZIP
        const zipContent = await zip.generateAsync({ type: "uint8array" });

        // 6. Return Response
        const zipFilename = `Documentos_${userNameNormalized}.zip`;

        return new NextResponse(new Blob([zipContent as any]), {
            status: 200,
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${zipFilename}"`
            }
        });

    } catch (error) {
        console.error("Error generating ZIP:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
