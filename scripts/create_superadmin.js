const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@uflp.com';
    const password = 'admin123';

    try {
        // Check if superadmin already exists
        const existingAdmin = await prisma.user.findUnique({
            where: { email }
        });

        if (existingAdmin) {
            console.log('✅ Superadmin ya existe con email:', email);

            // Update to SUPERADMIN role if not already
            if (existingAdmin.role !== 'SUPERADMIN') {
                await prisma.user.update({
                    where: { id: existingAdmin.id },
                    data: { role: 'SUPERADMIN' }
                });
                console.log('✅ Usuario actualizado a SUPERADMIN');
            }

            console.log('');
            console.log('📧 Email:', email);
            console.log('🔑 Password:', password);
            console.log('');
            console.log('🌐 Panel de admin: http://localhost:3000/admin');
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hashSync(password, 10);

        // Create superadmin
        const superadmin = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: 'SUPERADMIN',
                firstName: 'Super',
                lastNamePaterno: 'Admin',
                profileCompleted: true,
            }
        });

        console.log('');
        console.log('✅ Superadmin creado exitosamente!');
        console.log('📧 Email:', email);
        console.log('🔑 Password:', password);
        console.log('');
        console.log('🌐 Puedes acceder al panel de admin en: http://localhost:3000/admin');
        console.log('');
    } catch (error) {
        console.error('❌ Error al crear superadmin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
