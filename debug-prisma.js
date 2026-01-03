const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'file:c:/Users/coach/.gemini/antigravity/scratch/uflp-app/dev.db',
        },
    },
    log: ['query', 'info', 'warn', 'error'],
});

async function main() {
    try {
        console.log('Intentando crear usuario...');
        const user = await prisma.user.create({
            data: {
                email: 'debug_js_v3@test.com',
                password: 'hashed_password_placeholder',
                firstName: 'Debug',
                lastNamePaterno: 'JS',
                role: 'STUDENT',
            },
        });
        console.log('Usuario creado:', user);
    } catch (e) {
        console.error('Error al crear usuario (message):', e.message);
        try {
            console.error('Error al crear usuario (full):', JSON.stringify(e, null, 2));
        } catch (err) {
            console.error('Error al stringify:', err);
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
