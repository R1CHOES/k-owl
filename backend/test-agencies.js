const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const a = await prisma.agency.findMany();
    console.log(a);
}

main().finally(() => prisma.$disconnect());
