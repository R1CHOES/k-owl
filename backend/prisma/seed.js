const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Starting to seed database...');

    // 1. Create the 5 core Roles
    const roles = [
        { roleName: 'Super Administrator', slug: 'super-admin' },
        { roleName: 'Knowledge Base Manager', slug: 'knowledge-base-manager' },
        { roleName: 'Agency Focal Person', slug: 'agency-focal-person' },
        { roleName: 'QA Reviewer', slug: 'qa-reviewer' },
        { roleName: 'Content Approver', slug: 'content-approver' }
    ];

    for (const role of roles) {
        await prisma.role.upsert({
            where: { slug: role.slug },
            update: {},
            create: role,
        });
    }
    console.log('✅ Roles seeded successfully.');

    // 2. Create the STII Agency
    const stiiAgency = await prisma.agency.upsert({
        where: { name: 'STII' },
        update: {},
        create: {
            name: 'STII',
            description: 'Science and Technology Information Institute'
        }
    });
    console.log('✅ STII Agency seeded successfully.');

    // 3. Create the first Super Admin User
    const superAdminRole = await prisma.role.findUnique({
        where: { slug: 'super-admin' }
    });

    const hashedPassword = await bcrypt.hash('admin123', 10);

    await prisma.user.upsert({
        where: { email: 'admin@stii.dost.gov.ph' },
        update: {},
        create: {
            username: 'superadmin',
            email: 'admin@stii.dost.gov.ph',
            passwordHash: hashedPassword,
            designation: 'System Administrator',
            roleId: superAdminRole.id,
            agencyId: stiiAgency.id
        }
    });

    console.log('✅ Super Admin account created!');
    console.log('-------------------------------------------');
    console.log('Email:    admin@stii.dost.gov.ph');
    console.log('Password: admin123');
    console.log('-------------------------------------------');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });