
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@uflp.com';
    const password = await bcrypt.hash('admin123', 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: { role: 'SUPERADMIN' },
        create: {
            email,
            password,
            role: 'SUPERADMIN',
            firstName: 'Admin',
            lastNamePaterno: 'UFLP',
            profileCompleted: true,
            documentsCompleted: true
        }
    });

    console.log(`Created/Updated user ${user.email} with role ${user.role}`);
}

main();
