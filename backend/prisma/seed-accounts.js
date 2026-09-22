const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Resetting and seeding STII Accounts...');

  // 1. Lock in the official Roles
  const roles = [
    { roleName: 'Super Administrator', slug: 'superadmin' },
    { roleName: 'Knowledge Base Manager', slug: 'kbm' },
    { roleName: 'Agency Admin', slug: 'agency_admin' },
    { roleName: 'Focal Person', slug: 'focal_person' },
    { roleName: 'QA Specialist', slug: 'qa' },
    { roleName: 'Content Approver', slug: 'content_approver' }
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { slug: role.slug },
      update: { roleName: role.roleName },
      create: role
    });
  }

  // 2. Fetch DOST-STII Agency and Global Roles
  const stiiAgency = await prisma.agency.findUnique({ where: { name: 'DOST-STII' } });
  if (!stiiAgency) throw new Error("DOST-STII agency not found! Run the agency seed first.");

  const superadminRole = await prisma.role.findUnique({ where: { slug: 'superadmin' } });
  const kbmRole = await prisma.role.findUnique({ where: { slug: 'kbm' } });

  // 3. Soft-Reset: Deactivate all old test users
  await prisma.user.updateMany({ data: { isActive: false } });
  console.log('Deactivated old test accounts to prevent document corruption.');

  // 4. Create Official STII Accounts
  const defaultPassword = await bcrypt.hash('password123', 10);
  const stiiUsers = [
    {
      username: 'stii_superadmin',
      email: 'superadmin@stii.dost.gov.ph',
      passwordHash: defaultPassword,
      designation: 'System Administrator',
      roleId: superadminRole.id,
      agencyId: stiiAgency.id,
      isActive: true
    },
    {
      username: 'stii_kbm',
      email: 'kbm@stii.dost.gov.ph',
      passwordHash: defaultPassword,
      designation: 'Knowledge Base Manager',
      roleId: kbmRole.id,
      agencyId: stiiAgency.id,
      isActive: true
    }
  ];

  for (const user of stiiUsers) {
    const createdUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        passwordHash: defaultPassword,
        roleId: user.roleId,
        agencyId: user.agencyId,
        isActive: true
      },
      create: user
    });
    console.log(`Created account: ${createdUser.email} (Password: password123)`);
  }
  console.log('✅ STII Accounts successfully reset and seeded!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
