import { NextResponse } from 'next/server';
import { requireSuperAdmin, requireAdminView } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        await requireAdminView();

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';
        const type = searchParams.get('type') || '';

        let results: any = {
            users: [],
            documents: [],
            payments: [],
        };

        if (!query && !type) {
            return NextResponse.json(results);
        }

        // Search users
        if (!type || type === 'users') {
            results.users = await prisma.user.findMany({
                where: {
                    OR: [
                        { email: { contains: query } },
                        { firstName: { contains: query } },
                        { lastNamePaterno: { contains: query } },
                    ],
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastNamePaterno: true,
                    role: true,
                    createdAt: true,
                },
                take: 20,
            });
        }

        // Search documents
        if (!type || type === 'documents') {
            results.documents = await prisma.document.findMany({
                where: {
                    OR: [
                        { type: { contains: query } },
                        { user: { email: { contains: query } } },
                    ],
                },
                include: {
                    user: {
                        select: {
                            email: true,
                            firstName: true,
                            lastNamePaterno: true,
                        },
                    },
                },
                take: 20,
            });
        }

        // Search payments
        if (!type || type === 'payments') {
            results.payments = await prisma.payment.findMany({
                where: {
                    OR: [
                        { payerName: { contains: query } },
                        { user: { email: { contains: query } } },
                    ],
                },
                include: {
                    user: {
                        select: {
                            email: true,
                            firstName: true,
                            lastNamePaterno: true,
                        },
                    },
                },
                take: 20,
            });
        }

        return NextResponse.json(results);
    } catch (error) {
        console.error('Error searching:', error);
        return NextResponse.json(
            { error: 'Failed to search' },
            { status: 500 }
        );
    }
}
