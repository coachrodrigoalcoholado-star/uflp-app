import { NextResponse } from 'next/server';
import { requireSuperAdmin, requireAdminView } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        await requireAdminView();

        // Run all count queries in parallel
        const [
            totalUsers,
            studentCount,
            superadminCount,
            totalDocuments,
            pendingDocuments,
            approvedDocuments,
            rejectedDocuments,
            totalPayments,
            pendingPayments,
            approvedPayments,
            rejectedPayments,
            recentUsers,
            recentDocuments,
            recentPayments
        ] = await Promise.all([
            // User counts
            prisma.user.count(),
            prisma.user.count({ where: { role: 'STUDENT' } }),
            prisma.user.count({ where: { role: 'SUPERADMIN' } }),

            // Document counts
            prisma.document.count(),
            prisma.document.count({ where: { status: 'PENDING' } }),
            prisma.document.count({ where: { status: 'APPROVED' } }),
            prisma.document.count({ where: { status: 'REJECTED' } }),

            // Payment counts
            prisma.payment.count(),
            prisma.payment.count({ where: { status: 'PENDING' } }),
            prisma.payment.count({ where: { status: 'APPROVED' } }),
            prisma.payment.count({ where: { status: 'REJECTED' } }),

            // Recent items
            prisma.user.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastNamePaterno: true,
                    role: true,
                    createdAt: true,
                }
            }),
            prisma.document.findMany({
                take: 10,
                where: { status: 'PENDING' },
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            email: true,
                            firstName: true,
                            lastNamePaterno: true,
                        }
                    }
                }
            }),
            prisma.payment.findMany({
                take: 10,
                where: { status: 'PENDING' },
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            email: true,
                            firstName: true,
                            lastNamePaterno: true,
                        }
                    }
                }
            })
        ]);

        return NextResponse.json({
            users: {
                total: totalUsers,
                students: studentCount,
                superadmins: superadminCount,
            },
            documents: {
                total: totalDocuments,
                pending: pendingDocuments,
                approved: approvedDocuments,
                rejected: rejectedDocuments,
            },
            payments: {
                total: totalPayments,
                pending: pendingPayments,
                approved: approvedPayments,
                rejected: rejectedPayments,
            },
            recent: {
                users: recentUsers,
                documents: recentDocuments,
                payments: recentPayments,
            }
        });
    } catch (error) {
        console.error('Analytics error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        );
    }
}
