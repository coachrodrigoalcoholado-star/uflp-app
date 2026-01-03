import { NextResponse } from 'next/server';
import { requireSuperAdmin, requireAdminView } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        await requireAdminView();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || '';
        const type = searchParams.get('type') || '';
        const search = searchParams.get('search') || '';

        const where: any = {};

        if (status) {
            where.status = status;
        }

        if (type) {
            where.type = type;
        }

        if (search) {
            where.user = {
                OR: [
                    { firstName: { contains: search } }, // Check casing in Prisma (usually insensitive in SQLite/Postgres depends)
                    { lastNamePaterno: { contains: search } },
                    { email: { contains: search } },
                ]
            };
        }

        const documents = await prisma.document.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastNamePaterno: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ documents });
    } catch (error) {
        console.error('Error fetching documents:', error);
        return NextResponse.json(
            { error: 'Failed to fetch documents' },
            { status: 500 }
        );
    }
}
