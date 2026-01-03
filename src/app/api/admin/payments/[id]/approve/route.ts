import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        // TODO: Add proper Admin Role check here if needed, currently checking if user exists
        if (!session || !session.user?.email) {
            return NextResponse.json({ message: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;

        const payment = await prisma.payment.findUnique({
            where: { id },
        });

        if (!payment) {
            return NextResponse.json({ message: "Pago no encontrado" }, { status: 404 });
        }

        // Delete file from Supabase if exists and payment method is Transferencia (has URL)
        // If it's effectively deleting the proof on approval as per business rule
        if (payment.url) {
            try {
                // Extract filename from URL
                // URL format: https://[project].supabase.co/storage/v1/object/public/payments/[filename]
                // OR /uploads/payments/[filename] (old local format)

                let path: string | undefined;

                if (payment.url.includes('supabase.co')) {
                    // It's a supabase URL
                    const urlParts = payment.url.split('/payments/');
                    if (urlParts.length > 1) {
                        path = urlParts[1]; // Get the filename part
                    }
                } else if (payment.url.startsWith('/uploads/payments/')) {
                    // Legacy local file URL - cannot delete from cloud, just ignore or log
                    console.log('Skipping local file deletion logic for legacy payment:', payment.url);
                }

                if (path) {
                    const { error } = await supabase
                        .storage
                        .from('payments')
                        .remove([path]);

                    if (error) {
                        console.error('Error deleting file from Supabase:', error);
                    } else {
                        console.log(`Deleted proof file from Supabase: ${path}`);
                    }
                }
            } catch (err: any) {
                console.error("Error evaluating file deletion:", err);
            }
        }

        // Update payment status
        const updatedPayment = await prisma.payment.update({
            where: { id },
            data: {
                status: "APPROVED",
                url: null, // Clear URL to prevent broken links
                rejectionReason: null
            },
        });

        return NextResponse.json(updatedPayment);

    } catch (error) {
        console.error("Error approving payment:", error);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    }
}
