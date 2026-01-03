// @ts-nocheck
import { NextResponse } from 'next/server';
import { requireSuperAdmin, requireAdminView } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        await requireAdminView();

        // @ts-ignore
        const cohorts = await prisma.cohort.findMany({
            orderBy: { startDate: 'desc' },
            include: {
                users: {
                    select: {
                        id: true,
                        firstName: true,
                        lastNamePaterno: true,
                        lastNameMaterno: true,
                        email: true
                    },
                    orderBy: { lastNamePaterno: 'asc' }
                },
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
                { error: 'Code, start date, and end date are required' },
                { status: 400 }
            );
        }

        // @ts-ignore
        const existingCohort = await prisma.cohort.findUnique({
            where: { code }
        });

        if (existingCohort) {
            return NextResponse.json(
                { error: 'Cohort with this code already exists' },
                { status: 400 }
            );
        }

        // @ts-ignore
        const cohort = await prisma.cohort.create({
            data: {
                code,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
            }
        });

        return NextResponse.json({ cohort }, { status: 201 });
    } catch (error) {
        console.error('Error creating cohort:', error);
        return NextResponse.json(
            { error: 'Failed to create cohort' },
            { status: 500 }
        );
    }
}
