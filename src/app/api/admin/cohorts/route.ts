// @ts-nocheck
import { NextResponse } from 'next/server';
import { requireSuperAdmin, requireAdminView } from '@/lib/adminAuth';
// import prisma from '@/lib/prisma'; // Prisma client doesn't have Cohort model anymore

export async function GET(request: Request) {
    try {
        await requireAdminView();
        // Stubbed response
        return NextResponse.json({ cohorts: [] });
    } catch (error) {
        console.error('Error fetching cohorts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch cohorts' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    return NextResponse.json(
        { error: 'Cohort creation disabled due to maintenance' },
        { status: 503 }
    );
}
