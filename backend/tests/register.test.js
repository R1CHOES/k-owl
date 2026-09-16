const request = require('supertest');
const app = require('../src/index');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Store our tokens and IDs to use across tests
let superAdminToken = '';
let focalPersonToken = '';
let roles = {};
let stiiAgency;

beforeAll(async () => {
    // 1. Grab the dynamic IDs for roles and the agency from the database
    const allRoles = await prisma.role.findMany();
    allRoles.forEach(r => roles[r.slug] = r.id);
    stiiAgency = await prisma.agency.findUnique({ where: { name: 'STII' } });

    // 2. Clean up test users if they exist from previous test runs
    await prisma.user.deleteMany({
        where: { email: { in: ['test-kb@stii.dost.gov.ph', 'test-focal@stii.dost.gov.ph'] } }
    });

    // 3. Login as the seeded Super Admin to get our master token
    const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@stii.dost.gov.ph', password: 'admin123' });

    superAdminToken = loginRes.body.token;
});

afterAll(async () => {
    await prisma.$disconnect();
});

describe('Authentication API - Register (Create User) Tests', () => {

    it('1. Should block registration if NO token is provided', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'hacker',
                email: 'hacker@dost.gov.ph',
                password: 'password123',
                roleId: roles['qa-reviewer'],
                agencyId: stiiAgency.id
            });

        // 401 Unauthorized
        expect(res.statusCode).toBe(401);
    });

    it('2. Super Admin can successfully create a new user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .set('Authorization', `Bearer ${superAdminToken}`)
            .send({
                username: 'test-kb-manager',
                email: 'test-kb@stii.dost.gov.ph',
                password: 'password123',
                designation: 'Head Tester',
                roleId: roles['knowledge-base-manager'],
                agencyId: stiiAgency.id
            });

        // Expect success (200 or 201)
        expect(res.statusCode).toBeLessThan(300);
        expect(res.body.email).toBe('test-kb@stii.dost.gov.ph');

        // Security check: Make sure the passwordHash is NOT returned to the frontend!
        expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('3. Security Check: Focal Person CANNOT create a Super Admin', async () => {
        // Step A: Use our Super Admin token to create a Focal Person
        await request(app)
            .post('/api/auth/register')
            .set('Authorization', `Bearer ${superAdminToken}`)
            .send({
                username: 'test-focal',
                email: 'test-focal@stii.dost.gov.ph',
                password: 'password123',
                roleId: roles['agency-focal-person'],
                agencyId: stiiAgency.id
            });

        // Step B: Login as that new Focal Person to get their token
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test-focal@stii.dost.gov.ph', password: 'password123' });
        focalPersonToken = loginRes.body.token;

        // Step C: Try to create a Super Admin using the Focal Person's token (This MUST fail)
        const hackRes = await request(app)
            .post('/api/auth/register')
            .set('Authorization', `Bearer ${focalPersonToken}`)
            .send({
                username: 'sneaky-admin',
                email: 'sneaky@stii.dost.gov.ph',
                password: 'password123',
                roleId: roles['super-admin'],
                agencyId: stiiAgency.id
            });

        // 403 Forbidden - Role-Based Access Control blocked them!
        expect(hackRes.statusCode).toBe(403);
    });

});