import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { updateDocumentsCompletion } from "@/lib/userProgress";
import { supabase } from "@/lib/supabase";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || (session.user.role !== 'SUPERADMIN' && session.user.role !== 'AUDITOR')) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const resolvedParams = await params;
        const userId = resolvedParams.id;

        // 1. Fetch pending documents to get their URLs
        const pendingDocs = await prisma.document.findMany({
            where: {
                userId: userId,
                status: 'PENDING'
            }
        });

        if (pendingDocs.length === 0) {
            return NextResponse.json({ message: "No pending documents to approve", count: 0 });
        }

        // 2. Delete files from Supabase Storage
        // We do this in parallel and don't block if one fails, just log error
        await Promise.all(pendingDocs.map(async (doc) => {
            try {
                // Extract filename from URL
                // URL: .../documents/filename.ext
                const filename = doc.url.split('/documents/').pop();
                if (filename) {
                    const { error } = await supabase.storage
                        .from('documents')
                        .remove([filename]);

                    if (error) console.error(`Error deleting file ${filename}:`, error);
                    else console.log(`Deleted file for doc ${doc.id}`);
                }
            } catch (err) {
                console.error(`Error processing deletion for doc ${doc.id}:`, err);
            }
        }));

        // 3. Update all PENDING documents to APPROVED
        const updateResult = await prisma.document.updateMany({
            where: {
                userId: userId,
                status: 'PENDING'
            },
            data: {
                status: 'APPROVED',
                rejectionReason: null
            }
        });

        // 2. Check and update user completion status
        await updateDocumentsCompletion(userId);

        return NextResponse.json({
            message: "Documents approved successfully",
            count: updateResult.count
        });

    } catch (error) {
        console.error("Error approving documents:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
