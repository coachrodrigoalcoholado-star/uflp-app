import { NextResponse } from 'next/server';
import { requireAdminView } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAdminView();
        const { id } = await params;

        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                documents: {
                    orderBy: { createdAt: 'desc' }
                },
                payments: {
                    orderBy: { createdAt: 'desc' }
                },
                notifications: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                }
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Don't send password
        const { password, ...userWithoutPassword } = user;

        return NextResponse.json({ user: userWithoutPassword });
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user' },
            { status: 500 }
        );
    }
}
