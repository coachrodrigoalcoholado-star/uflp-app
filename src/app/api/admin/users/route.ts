import { NextResponse } from 'next/server';
import { requireSuperAdmin, requireAdminView } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
    try {
        await requireAdminView();

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const role = searchParams.get('role') || '';
        const profileCompleted = searchParams.get('profileCompleted');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = (page - 1) * limit;

        const where: any = {};

        if (search) {
            where.OR = [
                { email: { contains: search } },
                { firstName: { contains: search } },
                { lastNamePaterno: { contains: search } },
            ];
        }

        if (role) {
            where.role = role;
        }

        if (profileCompleted === 'true') {
            where.profileCompleted = true;
        } else if (profileCompleted === 'false') {
            where.profileCompleted = false;
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastNamePaterno: true,
                    lastNameMaterno: true,
                    role: true,
                    profileCompleted: true,
                    cohort: {
                        select: {
                            id: true,
                            code: true
                        }
                    },
                    documentsCompleted: true,
                    createdAt: true,
                    _count: {
                        select: {
                            documents: true,
                            payments: true,
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.user.count({ where })
        ]);

        // Custom sort: Users without cohort first, then sorted by cohort code
        users.sort((a, b) => {
            const aHasCohort = !!a.cohort;
            const bHasCohort = !!b.cohort;

            // If one has cohort and the other doesn't
            if (aHasCohort !== bHasCohort) {
                return aHasCohort ? 1 : -1; // Unassigned comes first
            }

            // If both have cohort, sort by code
            if (aHasCohort && bHasCohort) {
                return a.cohort!.code.localeCompare(b.cohort!.code);
            }

            return 0; // Preserve createdAt order for same/no cohort
        });

        return NextResponse.json({
            users,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page,
                limit
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        await requireSuperAdmin();

        const body = await request.json();
        const { userId, password, ...updateData } = body;

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            (updateData as any).password = hashedPassword;
        }

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastNamePaterno: true,
                role: true,
            }
        });

        return NextResponse.json({ user: updatedUser });
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json(
            { error: 'Failed to update user' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        await requireSuperAdmin();

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Delete user's documents, payments, and notifications first
        await prisma.document.deleteMany({ where: { userId } });
        await prisma.payment.deleteMany({ where: { userId } });
        await prisma.notification.deleteMany({ where: { userId } });

        // Then delete the user
        await prisma.user.delete({ where: { id: userId } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json(
            { error: 'Failed to delete user' },
            { status: 500 }
        );
    }
}
