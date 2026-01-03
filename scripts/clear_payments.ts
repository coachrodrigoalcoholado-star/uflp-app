import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const deleted = await prisma.payment.deleteMany({});
        console.log(`Se eliminaron ${deleted.count} pagos.`);
    } catch (error) {
        console.error('Error eliminando pagos:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
