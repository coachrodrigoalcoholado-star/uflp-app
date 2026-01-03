import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidateTag } from 'next/cache';
import { supabase } from "@/lib/supabase";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.email) {
            return NextResponse.json({ message: "No autorizado" }, { status: 401 });
        }

        const payments = await prisma.payment.findMany({
            where: {
                user: {
                    email: session.user.email,
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(payments);
    } catch (error) {
        console.error("Error obteniendo pagos:", error);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.email) {
            return NextResponse.json({ message: "No autorizado" }, { status: 401 });
        }

        const formData = await req.formData();
        const location = formData.get("location") as string;
        const method = formData.get("method") as string;
        const amountStr = formData.get("amount") as string;
        const dateStr = formData.get("date") as string;
        const payerName = formData.get("payerName") as string | null;
        const file = formData.get("file") as File | null;

        if (!location || !method || !amountStr || !dateStr) {
            return NextResponse.json({ message: "Faltan datos requeridos" }, { status: 400 });
        }

        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) {
            return NextResponse.json({ message: "Monto inválido" }, { status: 400 });
        }

        let fileUrl = null;

        console.log(`[Payment API] Processing payment. Method: '${method}', File: ${file ? file.name : 'No file'}`);

        if (method.includes("Transferencia") || method.includes("PAYPAL")) {
            if (!file) {
                return NextResponse.json({ message: "Comprobante requerido para transferencia/Paypal" }, { status: 400 });
            }

            const buffer = Buffer.from(await file.arrayBuffer());
            const filename = `${Date.now()}_${file.name.replace(/\s/g, "_")}`;

            // Upload to Supabase Storage ('payments' bucket)
            const { data, error } = await supabase
                .storage
                .from('payments')
                .upload(filename, buffer, {
                    contentType: file.type || 'application/octet-stream',
                    upsert: true
                });

            if (error) {
                console.error("Supabase Upload Error:", error);
                return NextResponse.json({ message: `Error de almacenamiento: ${error.message}` }, { status: 500 });
            }

            // Get Public URL
            const { data: { publicUrl } } = supabase
                .storage
                .from('payments')
                .getPublicUrl(filename);

            fileUrl = publicUrl;

        } else if (method === "Efectivo") {
            if (!payerName) {
                return NextResponse.json({ message: "Nombre de quien entrega es requerido para efectivo" }, { status: 400 });
            }
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
        }

        const payment = await prisma.payment.create({
            data: {
                userId: user.id,
                amount: amount,
                date: new Date(dateStr),
                location,
                method,
                payerName,
                url: fileUrl,
                status: "PENDING"
            },
        });

        // Invalidate admin analytics cache
        // @ts-ignore - Next.js version mismatch workaround
        revalidateTag('admin-analytics');

        return NextResponse.json(payment);
    } catch (error) {
        console.error("Error creando pago:", error);
        return NextResponse.json({ message: "Error interno al procesar pago" }, { status: 500 });
    }
}
