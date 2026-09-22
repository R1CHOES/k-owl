const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const dostAgencies = [
  { name: "DOST-STII", description: "Science and Technology Information Institute" },
  { name: "DOST-PCAARRD", description: "Philippine Council for Agriculture, Aquatic and Natural Resources Research and Development" },
  { name: "DOST-PCIEERD", description: "Philippine Council for Industry, Energy and Emerging Technology Research and Development" },
  { name: "DOST-PCHRD", description: "Philippine Council for Health Research and Development" },
  { name: "DOST-ASTI", description: "Advanced Science and Technology Institute" },
  { name: "DOST-FNRI", description: "Food and Nutrition Research Institute" },
  { name: "DOST-FPRDI", description: "Forest Products Research and Development Institute" },
  { name: "DOST-ITDI", description: "Industrial Technology Development Institute" },
  { name: "DOST-MIRDC", description: "Metals Industry Research and Development Center" },
  { name: "DOST-PNRI", description: "Philippine Nuclear Research Institute" },
  { name: "DOST-PTRI", description: "Philippine Textile Research Institute" },
  { name: "DOST-PAGASA", description: "Philippine Atmospheric, Geophysical and Astronomical Services Administration" },
  { name: "DOST-PHIVOLCS", description: "Philippine Institute of Volcanology and Seismology" },
  { name: "DOST-SEI", description: "Science Education Institute" },
  { name: "DOST-TAPI", description: "Technology Application and Promotion Institute" },
  { name: "DOST-NAST", description: "National Academy of Science and Technology" },
  { name: "DOST-NRCP", description: "National Research Council of the Philippines" },
  { name: "DOST-OSEC", description: "Office of the Secretary" }
];

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

    // 2. Create the DOST Agencies
    console.log('Seeding DOST Agencies...');
    for (const agency of dostAgencies) {
        await prisma.agency.upsert({
            where: { name: agency.name },
            update: { description: agency.description },
            create: { name: agency.name, description: agency.description }
        });
    }
    console.log('✅ DOST Agencies seeded successfully.');

    const stiiAgency = await prisma.agency.findUnique({
        where: { name: 'DOST-STII' }
    });

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