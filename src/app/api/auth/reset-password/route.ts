import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const { token, password } = await req.json();

        if (!token || !password) {
            return NextResponse.json({ message: "Datos incompletos" }, { status: 400 });
        }

        // Find user with valid token
        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: {
                    gt: new Date()
                }
            }
        });

        if (!user) {
            return NextResponse.json({ message: "Token inválido o expirado" }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Update user
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null
            }
        });

        return NextResponse.json({ message: "Contraseña actualizada" });

    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    }
}
