import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

describe('API (e2e)', () => {
  let app: INestApplication;
  let token: string;
  const TENANT_ID = 'cmqini6wm0000124cijgio06a';

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, transformOptions: { enableImplicitConversion: true } }));
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();
  }, 30000);

  afterAll(async () => { await app.close(); });

  const http = () => request(app.getHttpServer());

  describe('Health', () => {
    it('GET /health', async () => {
      const res = await http().get('/health').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ok');
    });
  });

  describe('Auth flow', () => {
    const email = `e2e${Date.now()}@test.com`;

    it('register creates new user', async () => {
      const res = await http().post('/auth/register').send({
        firstName: 'E2E', lastName: 'Test', email, password: 'test123', tenantId: TENANT_ID,
      }).expect(201);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.firstName).toBe('E2E');
      token = res.body.data.accessToken;
    });

    it('login with correct password', async () => {
      const res = await http().post('/auth/login').send({ email, password: 'test123' }).expect(200);
      expect(res.body.data.accessToken).toBeDefined();
      token = res.body.data.accessToken;
    });

    it('login with wrong password returns 401', async () => {
      await http().post('/auth/login').send({ email, password: 'wrong' }).expect(401);
    });

    it('profile with valid token', async () => {
      const res = await http().get('/auth/profile').set('Authorization', `Bearer ${token}`).expect(200);
      expect(res.body.data.email).toBe(email);
    });

    it('profile without token returns 401', async () => {
      await http().get('/auth/profile').expect(401);
    });
  });

  describe('Courses (auth required)', () => {
    it('GET /courses returns list', async () => {
      const res = await http().get('/courses').set('Authorization', `Bearer ${token}`).expect(200);
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it('POST /courses requires admin role (returns 403 for MEMBER)', async () => {
      await http().post('/courses')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'E2E Course', slug: `e2e-${Date.now()}`, description: 'Test course' })
        .expect(403);
    });

    it('POST /courses with admin token creates course', async () => {
      const adminLogin = await http().post('/auth/login').send({ email: 'admin@muslim-bot.com', password: 'admin123' }).expect(200);
      const adminToken = adminLogin.body.data.accessToken;
      const uniqueSlug = `test-course-${Math.random().toString(36).slice(2, 8)}`;
      const res = await http().post('/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: `Test Course ${uniqueSlug}`, slug: uniqueSlug, description: 'Test' })
        .expect(201);
      expect(res.body.data).toHaveProperty('id');
    });
  });

  describe('Memberships (auth required)', () => {
    it('GET /memberships returns plans', async () => {
      const res = await http().get('/memberships').set('Authorization', `Bearer ${token}`).expect(200);
      expect(res.body.data.data.length).toBeGreaterThan(0);
    });
  });

  describe('Analytics (auth required)', () => {
    it('GET /analytics/dashboard requires admin', async () => {
      const adminLogin = await http().post('/auth/login').send({ email: 'admin@muslim-bot.com', password: 'admin123' }).expect(200);
      const adminToken = adminLogin.body.data.accessToken;
      const res = await http().get('/analytics/dashboard').set('Authorization', `Bearer ${adminToken}`).expect(200);
      expect(res.body.data).toHaveProperty('totalUsers');
      expect(res.body.data).toHaveProperty('totalRevenue');
    });

    it('GET /analytics/dashboard returns 403 for MEMBER', async () => {
      await http().get('/analytics/dashboard').set('Authorization', `Bearer ${token}`).expect(403);
    });
  });

  describe('Unauthorized access', () => {
    it('GET /courses without token returns 401', async () => {
      await http().get('/courses').expect(401);
    });

    it('GET /memberships without token returns 401', async () => {
      await http().get('/memberships').expect(401);
    });
  });
});
