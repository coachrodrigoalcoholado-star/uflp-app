
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DOCUMENT_TYPES = [
    "PDF DNI FRENTE",
    "PDF DNI DORSO",
    "PDF TITULO SECUNDARIO O DE GRADO",
    "PDF TITULO DE COACH",
    "PDF CURRICULUM VITAE",
    "PDF PARTIDA DE NACIMINENTO",
    "FOTO TIPO CARNET - FONDO BLANCO",
    "PDF INSCRIPCIÓN UNIVERSIDAD FRAY LUCAS PACCIOLI - FIRMADO"
];

async function areDocumentsComplete(userId) {
    const documents = await prisma.document.findMany({
        where: { userId },
        select: { type: true },
    });

    const uploadedTypes = documents.map(doc => doc.type);

    // Check if every required type is included in uploaded types
    return DOCUMENT_TYPES.every(requiredType => uploadedTypes.includes(requiredType));
}

async function main() {
    console.log("Starting document completion check...");

    // Get all students
    const users = await prisma.user.findMany({
        where: { role: 'STUDENT' } // Optional: filter by role
    });

    console.log(`Found ${users.length} users.`);

    for (const user of users) {
        const isComplete = await areDocumentsComplete(user.id);

        if (user.documentsCompleted !== isComplete) {
            console.log(`Updating user ${user.email}: ${user.documentsCompleted} -> ${isComplete}`);
            await prisma.user.update({
                where: { id: user.id },
                data: { documentsCompleted: isComplete }
            });
        } else {
            console.log(`User ${user.email} is already up to date (${isComplete}).`);
        }
    }

    console.log("Done.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
