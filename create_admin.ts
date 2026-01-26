
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const prisma = new PrismaClient();

async function main() {
    try {
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
    } catch (error) {
        console.error("Critical error in create_admin:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
