
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'auditor@uflp.com';
    const password = await bcrypt.hash('auditor123', 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: { role: 'AUDITOR' },
        create: {
            email,
            password,
            role: 'AUDITOR',
            firstName: 'Auditor',
            lastNamePaterno: 'Test',
            profileCompleted: true,
            documentsCompleted: true
        }
    });

    console.log(`Created/Updated user ${user.email} with role ${user.role}`);
}

main();
