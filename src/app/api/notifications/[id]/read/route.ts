import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ message: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;

        await prisma.notification.updateMany({
            where: {
                id: id,
                user: {
                    email: session.user.email
                }
            },
            data: {
                read: true
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    }
}
