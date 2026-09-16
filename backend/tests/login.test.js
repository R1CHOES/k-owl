const request = require('supertest');
const app = require('../src/index');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// This ensures Prisma disconnects after tests so Jest doesn't hang
afterAll(async () => {
    await prisma.$disconnect();
});

describe('Authentication API - Login Tests', () => {

    it('1. Should login successfully with correct credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@stii.dost.gov.ph',
                password: 'admin123'
            });

        // Expect a 200 OK status
        expect(res.statusCode).toEqual(200);
        // Expect the response to have a token
        expect(res.body).toHaveProperty('token');
        // Expect it to return the correct user email
        expect(res.body.user.email).toEqual('admin@stii.dost.gov.ph');
    });

    it('2. Should fail to login with a wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@stii.dost.gov.ph',
                password: 'wrongpassword'
            });

        // Expect an error status (usually 400 or 401)
        expect(res.statusCode).toBeGreaterThanOrEqual(400);
    });

    it('3. Should fail to login with an email that does not exist', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'nobody@dost.gov.ph',
                password: 'admin123'
            });

        expect(res.statusCode).toBeGreaterThanOrEqual(400);
    });

    it('4. Should fail if email and password are empty', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({});

        expect(res.statusCode).toBeGreaterThanOrEqual(400);
    });

});