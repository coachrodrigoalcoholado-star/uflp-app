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
        const userId = id;
        const body = await request.json();

        // Extract allowed fields
        const {
            distributionUFLP,
            distributionUFLPDate,
            distributionECOA,
            distributionECOADate,
            distributionCommission,
            distributionCommissionDate
        } = body;

        const updateData: any = {};

        if (distributionUFLP !== undefined) updateData.distributionUFLP = distributionUFLP;
        if (distributionECOA !== undefined) updateData.distributionECOA = distributionECOA;
        if (distributionCommission !== undefined) updateData.distributionCommission = distributionCommission;

        // Handle dates
        if (distributionUFLPDate !== undefined) {
            updateData.distributionUFLPDate = distributionUFLPDate ? new Date(distributionUFLPDate) : null;
        }
        if (distributionECOADate !== undefined) {
            updateData.distributionECOADate = distributionECOADate ? new Date(distributionECOADate) : null;
        }
        if (distributionCommissionDate !== undefined) {
            updateData.distributionCommissionDate = distributionCommissionDate ? new Date(distributionCommissionDate) : null;
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error updating user financials:', error);
        return NextResponse.json(
            { error: 'Failed to update user financials' },
            { status: 500 }
        );
    }
}
