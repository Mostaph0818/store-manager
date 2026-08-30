import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';

// Shared test state
let userAToken: string;
let userAApiKey: string;
let userBToken: string;
let userBApiKey: string;
let userAProductId: number;
let userBProductId: number;

beforeAll(async () => {
  // Clean up
  await prisma.order.deleteMany({ where: { user: { email: { endsWith: '@tenant.local' } } } });
  await prisma.product.deleteMany({ where: { user: { email: { endsWith: '@tenant.local' } } } });
  await prisma.deliveryRate.deleteMany({ where: { user: { email: { endsWith: '@tenant.local' } } } });
  await prisma.user.deleteMany({ where: { email: { endsWith: '@tenant.local' } } });

  // Register User A
  const resA = await request(app).post('/api/auth/register').send({
    username: 'tenant_user_a',
    email: 'usera@tenant.local',
    password: 'UserAPass123',
  });
  userAToken = resA.body.data.token;

  // Register User B
  const resB = await request(app).post('/api/auth/register').send({
    username: 'tenant_user_b',
    email: 'userb@tenant.local',
    password: 'UserBPass123',
  });
  userBToken = resB.body.data.token;

  // Get API keys
  const settingsA = await request(app)
    .get('/api/settings')
    .set('Authorization', `Bearer ${userAToken}`);
  userAApiKey = settingsA.body.data.apiKey;

  const settingsB = await request(app)
    .get('/api/settings')
    .set('Authorization', `Bearer ${userBToken}`);
  userBApiKey = settingsB.body.data.apiKey;

  // Create product for User A
  const prodA = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${userAToken}`)
    .send({
      name: 'User A Exclusive Product',
      costPrice: 100,
      sellingPrice: 200,
      stockQuantity: 50,
    });
  userAProductId = prodA.body.data.id;

  // Create product for User B
  const prodB = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${userBToken}`)
    .send({
      name: 'User B Exclusive Product',
      costPrice: 150,
      sellingPrice: 300,
      stockQuantity: 30,
    });
  userBProductId = prodB.body.data.id;
});

afterAll(async () => {
  await prisma.order.deleteMany({ where: { user: { email: { endsWith: '@tenant.local' } } } });
  await prisma.product.deleteMany({ where: { user: { email: { endsWith: '@tenant.local' } } } });
  await prisma.deliveryRate.deleteMany({ where: { user: { email: { endsWith: '@tenant.local' } } } });
  await prisma.user.deleteMany({ where: { email: { endsWith: '@tenant.local' } } });
  await prisma.$disconnect();
});

describe('Multi-Tenant Isolation', () => {
  describe('Product Isolation', () => {
    it('User A cannot access User B product by ID via JWT', async () => {
      const res = await request(app)
        .get(`/api/products/${userBProductId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      // Must return 404, not 403, to not reveal that the resource exists
      expect(res.status).toBe(404);
    });

    it('User B cannot access User A product by ID via JWT', async () => {
      const res = await request(app)
        .get(`/api/products/${userAProductId}`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(404);
    });

    it('User A product list does not contain User B products', async () => {
      const res = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      const productIds = res.body.data.map((p: { id: number }) => p.id);
      expect(productIds).toContain(userAProductId);
      expect(productIds).not.toContain(userBProductId);
    });

    it('User A cannot update User B product', async () => {
      const res = await request(app)
        .put(`/api/products/${userBProductId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ name: 'Hacked Product' });

      expect(res.status).toBe(404);

      // Verify the product name was NOT changed
      const verifyRes = await request(app)
        .get(`/api/products/${userBProductId}`)
        .set('Authorization', `Bearer ${userBToken}`);
      expect(verifyRes.body.data.name).toBe('User B Exclusive Product');
    });

    it('User A cannot delete User B product', async () => {
      const res = await request(app)
        .delete(`/api/products/${userBProductId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(404);

      // Verify product still exists for User B
      const verifyRes = await request(app)
        .get(`/api/products/${userBProductId}`)
        .set('Authorization', `Bearer ${userBToken}`);
      expect(verifyRes.status).toBe(200);
    });
  });

  describe('API Key Isolation', () => {
    it("User A's API key can only access their own products", async () => {
      const res = await request(app)
        .get('/api/v1/products/check?name=Exclusive+Product')
        .set('x-api-key', userAApiKey);

      expect(res.status).toBe(200);
      // Should find User A's product
      expect(res.body.data.product.name).toContain('User A');
    });

    it("User B's API key cannot see User A products by name check", async () => {
      const res = await request(app)
        .get('/api/v1/products/check?name=User+A+Exclusive')
        .set('x-api-key', userBApiKey);

      // Product name contains 'User A' but should not be found with User B's key
      expect(res.status).toBe(404);
    });

    it('Invalid API key is rejected', async () => {
      const res = await request(app)
        .get('/api/v1/products/check?name=test')
        .set('x-api-key', 'sm_invalid_fake_key');

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_API_KEY');
    });

    it('Missing API key is rejected', async () => {
      const res = await request(app)
        .get('/api/v1/products/check?name=test');

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('API_KEY_REQUIRED');
    });
  });

  describe('Order Isolation', () => {
    let userADeliveryRateExists: boolean;

    beforeAll(async () => {
      // Check if User A has delivery rates set up
      const ratesRes = await request(app)
        .get('/api/delivery/rates')
        .set('Authorization', `Bearer ${userAToken}`);
      userADeliveryRateExists = ratesRes.body.data?.length > 0;
    });

    it('User A order list does not include User B orders', async () => {
      const resA = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${userAToken}`);

      const resB = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${userBToken}`);

      const orderIdsA = resA.body.data?.orders?.map((o: { id: number }) => o.id) || [];
      const orderIdsB = resB.body.data?.orders?.map((o: { id: number }) => o.id) || [];

      // No overlap between user A's and user B's orders
      const overlap = orderIdsA.filter((id: number) => orderIdsB.includes(id));
      expect(overlap).toHaveLength(0);
    });
  });

  describe('Cross-Tenant Order Creation Prevention', () => {
    it("User A's API key cannot create an order for User B's product", async () => {
      // Try to use User A's API key to order User B's product by ID
      const res = await request(app)
        .post('/api/v1/orders')
        .set('x-api-key', userAApiKey)
        .send({
          customer_name: 'Test Customer',
          customer_phone: '0550000000',
          wilaya_code: '16',
          address: 'Test Address',
          product_id: userBProductId, // User B's product
          quantity: 1,
          delivery_type: 'home',
        });

      // Must fail — User A cannot order User B's product
      expect([404, 422]).toContain(res.status);
      if (res.status === 404) {
        expect(res.body.code).toBe('PRODUCT_NOT_FOUND');
      }
    });
  });
});
