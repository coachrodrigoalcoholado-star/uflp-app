import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    const documents = await prisma.document.findMany({
        include: {
            user: true,
        },
    });

    const dumpPath = path.join(process.cwd(), 'public', 'db_dump.txt');
    let output = "--- DOCUMENTOS EN DB ---\n";

    documents.forEach(doc => {
        output += `ID: ${doc.id}\n`;
        output += `Type: ${doc.type}\n`;
        output += `User Email: ${doc.user.email}\n`;
        output += `URL: ${doc.url}\n`;
        output += `Created At: ${doc.createdAt}\n`;
        output += "-------------------------\n";
    });

    fs.writeFileSync(dumpPath, output);
    console.log(`Dump written to ${dumpPath}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
