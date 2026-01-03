import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';
import { deleteFileFromSupabase } from '@/lib/supabase';
import { revalidateTag } from 'next/cache';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireSuperAdmin();
        const { id } = await params;

        const body = await request.json();
        const { status, rejectionReason } = body;

        if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status' },
                { status: 400 }
            );
        }

        // If approving, we need to delete the file from storage
        if (status === 'APPROVED') {
            const currentDoc = await prisma.document.findUnique({
                where: { id },
                select: { url: true }
            });

            if (currentDoc?.url) {
                try {
                    await deleteFileFromSupabase(currentDoc.url);
                } catch (error) {
                    console.error('Error deleting file from storage:', error);
                    // Continue with status update even if deletion fails?
                    // Ideally yes, but maybe warn. For now, we log and proceed.
                }
            }
        }

        // Update document
        const document = await prisma.document.update({
            where: { id },
            data: {
                status,
                rejectionReason: status === 'REJECTED' ? rejectionReason : null,
                // We keep the URL in DB for reference? Or clear it?
                // Request says "ELIMINI del store". It doesn't explicitly say clear DB URL.
                // But if the file is gone, the URL is dead.
                // However, the user might want to know a file WAS there.
                // I'll keep the URL but maybe mark it? Or just leave it.
                // The requirement says "ocultar VER DOCUMENTOS".
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                    }
                }
            }
        });

        // Create notification for user
        await prisma.notification.create({
            data: {
                userId: document.userId,
                title: status === 'APPROVED' ? 'Documento Aprobado' : 'Documento Rechazado',
                message: status === 'APPROVED'
                    ? `Tu documento "${document.type}" ha sido aprobado.`
                    : `Tu documento "${document.type}" ha sido rechazado. Razón: ${rejectionReason}`,
                type: status === 'APPROVED' ? 'SUCCESS' : 'ERROR',
            }
        });

        // Invalidate admin analytics cache
        // @ts-ignore - Next.js version mismatch workaround
        revalidateTag('admin-analytics', undefined);

        return NextResponse.json({ document });
    } catch (error) {
        console.error('Error reviewing document:', error);
        return NextResponse.json(
            { error: 'Failed to review document' },
            { status: 500 }
        );
    }
}
