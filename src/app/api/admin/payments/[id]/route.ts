
import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireSuperAdmin();
        const { id: paymentId } = await params;
        const body = await request.json();
        const {
            amount, date, status, rejectionReason,
            distributionUFLP, distributionECOA, distributionCommission,
            distributionCommissionDate, distributionUFLPDate, distributionECOADate
        } = body;

        const data: any = {};
        if (amount !== undefined) data.amount = parseFloat(amount);
        if (date !== undefined) data.date = new Date(date);
        if (status !== undefined) data.status = status;
        if (rejectionReason !== undefined) data.rejectionReason = rejectionReason;

        if (distributionUFLP !== undefined) data.distributionUFLP = distributionUFLP;
        if (distributionECOA !== undefined) data.distributionECOA = distributionECOA;
        if (distributionCommission !== undefined) data.distributionCommission = distributionCommission;
        if (distributionCommissionDate !== undefined) {
            data.distributionCommissionDate = distributionCommissionDate ? new Date(distributionCommissionDate) : null;
        }
        if (distributionUFLPDate !== undefined) {
            data.distributionUFLPDate = distributionUFLPDate ? new Date(distributionUFLPDate) : null;
        }
        if (distributionECOADate !== undefined) {
            data.distributionECOADate = distributionECOADate ? new Date(distributionECOADate) : null;
        }

        const payment = await prisma.payment.update({
            where: { id: paymentId },
            data,
            include: { user: true }
        });

        // Enviar email si se aprueba
        if (body.status === 'APPROVED' && payment.user) {
            const { sendPaymentApprovalEmail } = await import('@/lib/email');
            await sendPaymentApprovalEmail(
                payment.user.email,
                payment.user.firstName || 'Alumno',
                payment.amount,
                payment.date
            );
        }

        return NextResponse.json(payment);
    } catch (error) {
        console.error('Error updating payment:', error);
        return NextResponse.json(
            { error: 'Failed to update payment' },
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

        await prisma.payment.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting payment:', error);
        return NextResponse.json(
            { error: 'Failed to delete payment' },
            { status: 500 }
        );
    }
}
