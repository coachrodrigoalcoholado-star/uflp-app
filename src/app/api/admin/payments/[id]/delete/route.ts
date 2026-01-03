import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

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

        // Delete file if exists
        if (payment.url) {
            try {
                let path: string | undefined;

                if (payment.url.includes('supabase.co')) {
                    const urlParts = payment.url.split('/payments/');
                    if (urlParts.length > 1) {
                        path = urlParts[1];
                    }
                } else if (payment.url.startsWith('/uploads/payments/')) {
                    console.log('Skipping local file deletion for legacy payment:', payment.url);
                }

                if (path) {
                    const { error } = await supabase
                        .storage
                        .from('payments')
                        .remove([path]);

                    if (error) {
                        console.error('Error deleting file from Supabase:', error);
                    }
                }
            } catch (err: any) {
                console.error("Error deleting file:", err);
            }
        }

        // Delete record
        await prisma.payment.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Pago eliminado correctamente" });

    } catch (error) {
        console.error("Error deleting payment:", error);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    }
}
