// @ts-nocheck
import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireSuperAdmin();
        const { id } = await params;
        const body = await request.json();
        const { code, startDate, endDate } = body;

        // Check if code exists for other cohort
        if (code) {
            const existing = await prisma.cohort.findFirst({
                where: {
                    code,
                    NOT: { id }
                }
            });
            if (existing) {
                return NextResponse.json(
                    { error: 'Code already in use' },
                    { status: 400 }
                );
            }
        }

        const cohort = await prisma.cohort.update({
            where: { id },
            data: {
                ...(code && { code }),
                ...(startDate && { startDate: new Date(startDate) }),
                ...(endDate && { endDate: new Date(endDate) }),
            }
        });

        return NextResponse.json({ cohort });
    } catch (error) {
        console.error('Error updating cohort:', error);
        return NextResponse.json(
            { error: 'Failed to update cohort' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireSuperAdmin();
        const { id } = await params;

        // Check if has users
        const count = await prisma.user.count({
            where: { cohortId: id }
        });

        if (count > 0) {
            return NextResponse.json(
                { error: 'Cannot delete cohort with assigned users' },
                { status: 400 }
            );
        }

        await prisma.cohort.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting cohort:', error);
        return NextResponse.json(
            { error: 'Failed to delete cohort' },
            { status: 500 }
        );
    }
}
