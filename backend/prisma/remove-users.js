const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find the superadmin
  const superadmin = await prisma.user.findFirst({
    where: { username: 'superadmin' }
  });

  if (!superadmin) {
    console.error("Superadmin not found! Aborting.");
    process.exit(1);
  }

  // 1. Reassign documents to superadmin
  await prisma.document.updateMany({
    where: { userId: { not: superadmin.id } },
    data: { userId: superadmin.id }
  });

  // 2. Reassign document versions to superadmin
  await prisma.documentVersion.updateMany({
    where: { uploaderId: { not: superadmin.id } },
    data: { uploaderId: superadmin.id }
  });

  // 3. Reassign content versions to superadmin
  await prisma.contentVersion.updateMany({
    where: { editorId: { not: superadmin.id } },
    data: { editorId: superadmin.id }
  });

  // 4. Delete all users except superadmin
  const deleteResult = await prisma.user.deleteMany({
    where: {
      id: { not: superadmin.id }
    }
  });

  console.log(`Successfully reassigned records and deleted ${deleteResult.count} users.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
