import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        await requireSuperAdmin();

        const body = await request.json();
        const { userId, title, message, type } = body;

        if (!userId || !title || !message) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const notification = await prisma.notification.create({
            data: {
                userId,
                title,
                message,
                type: type || 'INFO',
            },
        });

        return NextResponse.json({ notification });
    } catch (error) {
        console.error('Error creating notification:', error);
        return NextResponse.json(
            { error: 'Failed to create notification' },
            { status: 500 }
        );
    }
}
