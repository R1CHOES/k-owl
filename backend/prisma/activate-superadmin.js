const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`UPDATE "User" SET status = 'APPROVED', "isActive" = true WHERE username = 'superadmin';`);
  console.log('Successfully activated superadmin');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
