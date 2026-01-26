import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || (session.user.role !== 'SUPERADMIN' && session.user.role !== 'AUDITOR' && session.user.role !== 'ADMIN')) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const students = await prisma.user.findMany({
            where: {
                role: "STUDENT"
            },
            include: {
                documents: true,
                payments: true
            },
            orderBy: {
                lastNamePaterno: 'asc'
            }
        });

        // Transform data for the dashboard if necessary, or return as is
        // For now, returning as is to let the frontend handle the logic
        return NextResponse.json(students);

    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
