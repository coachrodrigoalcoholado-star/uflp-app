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
        const { status, rejectionReason } = body;

        if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status' },
                { status: 400 }
            );
        }

        // Update payment
        const payment = await prisma.payment.update({
            where: { id },
            data: {
                status,
                rejectionReason: status === 'REJECTED' ? rejectionReason : null,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                    }
                }
            }
        });

        // Create notification for user
        await prisma.notification.create({
            data: {
                userId: payment.userId,
                title: status === 'APPROVED' ? 'Pago Aprobado' : 'Pago Rechazado',
                message: status === 'APPROVED'
                    ? `Tu pago de $${payment.amount} ha sido aprobado.`
                    : `Tu pago de $${payment.amount} ha sido rechazado. Razón: ${rejectionReason}`,
                type: status === 'APPROVED' ? 'SUCCESS' : 'ERROR',
            }
        });

        return NextResponse.json({ payment });
    } catch (error) {
        console.error('Error reviewing payment:', error);
        return NextResponse.json(
            { error: 'Failed to review payment' },
            { status: 500 }
        );
    }
}
