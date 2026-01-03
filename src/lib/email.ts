import nodemailer from 'nodemailer';

// Simulador de envío de correos (logs en consola o Ethereal)
export async function sendPaymentApprovalEmail(to: string, userName: string, amount: number, date: Date) {
    if (process.env.NODE_ENV === 'development') {
        console.log("==========================================");
        console.log(`📧 [SIMULACIÓN EMAIL] Aprobación de Pago`);
        console.log(`Para: ${to}`);
        console.log(`Hola ${userName}, tu pago de $${amount} ha sido aprobado exitosamente.`);
        console.log(`Fecha: ${date.toLocaleDateString()}`);
        console.log("==========================================");
        return;
    }

    // Configuración real para Producción (requiere SMTP)
    /*
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    await transporter.sendMail({
        from: '"UFLP Gestión" <admin@uflp.com>',
        to,
        subject: "Pago Aprobado - UFLP",
        text: `Hola ${userName}, ...`,
        html: `<p>Hola <b>${userName}</b>...</p>`,
    });
    */
}
