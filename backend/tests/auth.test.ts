import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import bcrypt from 'bcrypt';
import { generateApiKey } from '../src/utils/apiKey';

// Test database cleanup
beforeAll(async () => {
  await prisma.order.deleteMany({ where: { user: { email: { endsWith: '@test.local' } } } });
  await prisma.product.deleteMany({ where: { user: { email: { endsWith: '@test.local' } } } });
  await prisma.deliveryRate.deleteMany({ where: { user: { email: { endsWith: '@test.local' } } } });
  await prisma.user.deleteMany({ where: { email: { endsWith: '@test.local' } } });
});

afterAll(async () => {
  await prisma.order.deleteMany({ where: { user: { email: { endsWith: '@test.local' } } } });
  await prisma.product.deleteMany({ where: { user: { email: { endsWith: '@test.local' } } } });
  await prisma.deliveryRate.deleteMany({ where: { user: { email: { endsWith: '@test.local' } } } });
  await prisma.user.deleteMany({ where: { email: { endsWith: '@test.local' } } });
  await prisma.$disconnect();
});

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app).post('/api/auth/register').send({
        username: 'testuser_auth',
        email: 'testauth@test.local',
        password: 'TestPass123',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('testauth@test.local');
      // Password should never be in the response
      expect(res.body.data.user.passwordHash).toBeUndefined();
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('should reject duplicate email', async () => {
      await request(app).post('/api/auth/register').send({
        username: 'testuser_dup',
        email: 'dupauth@test.local',
        password: 'TestPass123',
      });

      const res = await request(app).post('/api/auth/register').send({
        username: 'testuser_dup2',
        email: 'dupauth@test.local',
        password: 'TestPass123',
      });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('EMAIL_TAKEN');
    });

    it('should reject weak password', async () => {
      const res = await request(app).post('/api/auth/register').send({
        username: 'testuser_weak',
        email: 'weak@test.local',
        password: '123',
      });

      expect(res.status).toBe(422);
    });

    it('should reject invalid email', async () => {
      const res = await request(app).post('/api/auth/register').send({
        username: 'testuser_bademail',
        email: 'notanemail',
        password: 'TestPass123',
      });

      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/auth/login', () => {
    const loginEmail = 'logintest@test.local';
    const loginPassword = 'LoginTest123';

    beforeAll(async () => {
      await request(app).post('/api/auth/register').send({
        username: 'logintest_user',
        email: loginEmail,
        password: loginPassword,
      });
    });

    it('should login with correct credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: loginEmail,
        password: loginPassword,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(loginEmail);
    });

    it('should reject wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: loginEmail,
        password: 'WrongPassword',
      });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject non-existent email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'ghost@test.local',
        password: 'SomePassword123',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    let token: string;

    beforeAll(async () => {
      const res = await request(app).post('/api/auth/register').send({
        username: 'metest_user',
        email: 'metest@test.local',
        password: 'MeTest123',
      });
      token = res.body.data.token;
    });

    it('should return current user', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('metest@test.local');
    });

    it('should reject request without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');
      expect(res.status).toBe(401);
    });
  });
});
