const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    console.log('Testing Prisma connection...');
    try {
        const users = await prisma.user.findMany({
            take: 1
        });
        console.log('Successfully queried database! Users count (max 1):', users.length);
    } catch (error) {
        console.error('Prisma connection error:', error.message || error);
    } finally {
        await prisma.$disconnect();
    }
}

test();
