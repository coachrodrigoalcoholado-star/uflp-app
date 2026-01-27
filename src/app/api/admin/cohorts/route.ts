// @ts-nocheck
import { NextResponse } from 'next/server';
import { requireSuperAdmin, requireAdminView } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        await requireAdminView();

        const cohorts = await prisma.cohort.findMany({
            orderBy: { startDate: 'desc' },
            include: {
                _count: {
                    select: { users: true }
                }
            }
        });

        return NextResponse.json({ cohorts });
    } catch (error) {
        console.error('Error fetching cohorts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch cohorts' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        await requireSuperAdmin();
        const body = await request.json();
        const { code, startDate, endDate } = body;

        if (!code || !startDate || !endDate) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const existing = await prisma.cohort.findUnique({
            where: { code }
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Cohort code already exists' },
                { status: 400 }
            );
        }

        const cohort = await prisma.cohort.create({
            data: {
                code,
                startDate: new Date(startDate),
                endDate: new Date(endDate)
            }
        });

        return NextResponse.json({ cohort });
    } catch (error) {
        console.error('Error creating cohort:', error);
        return NextResponse.json(
            { error: 'Failed to create cohort' },
            { status: 500 }
        );
    }
}
