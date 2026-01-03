import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Intentando crear usuario...');
        const user = await prisma.user.create({
            data: {
                email: 'debug_script_v2@test.com',
                password: 'hashed_password_placeholder',
                firstName: 'Debug',
                lastNamePaterno: 'Script',
                role: 'STUDENT',
            },
        });
        console.log('Usuario creado:', user);
    } catch (e: any) {
        console.error('Error al crear usuario (message):', e.message);
        console.error('Error al crear usuario (full):', JSON.stringify(e, null, 2));
    } finally {
        await prisma.$disconnect();
    }
}

main();
