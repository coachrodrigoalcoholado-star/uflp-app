const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const password = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@uflp.com' },
        update: { role: 'SUPERADMIN' },
        create: {
            email: 'admin@uflp.com',
            password,
            role: 'SUPERADMIN',
            firstName: 'Super',
            lastNamePaterno: 'Admin',
            profileCompleted: true,
            documentsCompleted: true,
        },
    });

    console.log('Admin user ready:', admin.email);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
