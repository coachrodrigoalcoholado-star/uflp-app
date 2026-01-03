import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            // Return OK even if user doesn't exist to prevent enumeration
            return NextResponse.json({ message: "Si el correo existe, se envió el enlace." });
        }

        // Generate Token
        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 3600000); // 1 hour

        // Save to DB
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: token,
                resetTokenExpiry: expiry
            }
        });

        // Email Transport Configuration
        // Try to get env vars, otherwise fallback to Ethereal or just logging for now
        const transportConfig = {
            host: process.env.SMTP_HOST || 'smtp.ethereal.email',
            port: Number(process.env.SMTP_PORT) || 587,
            auth: {
                user: process.env.SMTP_USER || 'ethereal_user',
                pass: process.env.SMTP_PASS || 'ethereal_pass'
            }
        };

        const transporter = nodemailer.createTransport(transportConfig);

        const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

        // Just log the link for development if no real SMTP
        console.log(`\n=== PASSWORD RESET LINK ===\nTo: ${email}\nLink: ${resetLink}\n===========================\n`);

        try {
            await transporter.sendMail({
                from: '"Sistema UFLP" <no-reply@uflp.com>',
                to: email,
                subject: 'Restablecer Contraseña',
                html: `
                    <h1>Restablecer Contraseña</h1>
                    <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
                    <a href="${resetLink}">${resetLink}</a>
                    <p>Este enlace expira en 1 hora.</p>
                    <p>Si no solicitaste esto, ignora este correo.</p>
                `
            });
        } catch (mailError) {
            console.error("Error sending email (likely no SMTP configured):", mailError);
            return NextResponse.json({ message: "Error al enviar correo. Configure SMTP." }, { status: 500 });
        }

        return NextResponse.json({ message: "Email enviado" });

    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    }
}
