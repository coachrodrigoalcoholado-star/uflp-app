import { NextResponse } from 'next/server';
import { requireSuperAdmin, requireAdminView } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        await requireAdminView();

        const { searchParams } = new URL(request.url);
        // We will repurpose filters.
        // status: now refers to distribution status? Or validation status?
        // Let's assume User filter.
        const search = searchParams.get('search') || '';
        const uflpDateParam = searchParams.get('uflpDate');
        const ecoaDateParam = searchParams.get('ecoaDate');
        const commissionDateParam = searchParams.get('commissionDate');

        const where: any = {
            // Only users with at least one payment? Or all users?
            // "mostrar solo cuando pago el 100%" -> we need to fetch payments to know this.
            // So we fetch all users who have payments.
            payments: {
                some: {} // At least one payment
            }
        };

        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastNamePaterno: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Date filters for distribution (fields now on User)
        if (uflpDateParam) {
            const dateOnly = new Date(uflpDateParam);
            const nextDay = new Date(dateOnly);
            nextDay.setDate(dateOnly.getDate() + 1);
            where.distributionUFLPDate = { gte: dateOnly, lt: nextDay };
        }
        if (ecoaDateParam) {
            const dateOnly = new Date(ecoaDateParam);
            const nextDay = new Date(dateOnly);
            nextDay.setDate(dateOnly.getDate() + 1);
            where.distributionECOADate = { gte: dateOnly, lt: nextDay };
        }
        if (commissionDateParam) {
            const dateOnly = new Date(commissionDateParam);
            const nextDay = new Date(dateOnly);
            nextDay.setDate(dateOnly.getDate() + 1);
            where.distributionCommissionDate = { gte: dateOnly, lt: nextDay };
        }

        const users = await prisma.user.findMany({
            where,
            include: {
                cohort: { select: { code: true } },
                payments: {
                    select: {
                        amount: true,
                        status: true,
                        date: true,
                        method: true,
                        url: true
                    },
                    where: { status: 'APPROVED' } // Only count approved payments
                }
            },
            orderBy: { lastNamePaterno: 'asc' }
        });

        // Transform to Financial Records
        const financials = users.map((user: any) => {
            const totalPaid = user.payments.reduce((sum: number, p: any) => sum + p.amount, 0);

            return {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastNamePaterno: user.lastNamePaterno,
                    cohort: user.cohort
                },
                totalPaid,
                payments: user.payments, // Send details if needed for tooltip/expand
                distributionUFLP: user.distributionUFLP,
                distributionUFLPDate: user.distributionUFLPDate,
                distributionECOA: user.distributionECOA,
                distributionECOADate: user.distributionECOADate,
                distributionCommission: user.distributionCommission,
                distributionCommissionDate: user.distributionCommissionDate,
            };
        });

        return NextResponse.json({ payments: financials }); // Keep key 'payments' to avoid breaking frontend completely immediately? No, confusing. But safe for now.
    } catch (error) {
        console.error('Error fetching financials:', error);
        return NextResponse.json(
            { error: 'Failed to fetch financials' },
            { status: 500 }
        );
    }
}
