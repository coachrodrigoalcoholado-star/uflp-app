import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || (session.user.role !== 'SUPERADMIN' && session.user.role !== 'AUDITOR' && session.user.role !== 'ADMIN')) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { uflpSent } = body;

        // const updatedUser = await prisma.user.update({
        //     where: { id },
        //     data: { uflpSent },
        // });

        // MOCK SUCCESS for visual update only
        return NextResponse.json({ id, uflpSent });
    } catch (error) {
        console.error("Error updating UFLP status:", error);
        return NextResponse.json(
            { message: "Error updating UFLP status" },
            { status: 500 }
        );
    }
}
