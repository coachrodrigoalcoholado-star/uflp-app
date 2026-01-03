import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ message: "No autorizado" }, { status: 401 });
        }

        const notifications = await prisma.notification.findMany({
            where: {
                user: {
                    email: session.user.email
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 20
        });

        return NextResponse.json({ notifications });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    }
}
