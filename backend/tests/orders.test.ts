import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';

let token: string;
let apiKey: string;
let userId: number;
let productId: number;

const WILAYAS = [
  { code: '16', name: 'Alger' },
  { code: '19', name: 'Sétif' },
];

beforeAll(async () => {
  // Clean up test data
  await prisma.order.deleteMany({ where: { user: { email: 'orders_test@test.local' } } });
  await prisma.product.deleteMany({ where: { user: { email: 'orders_test@test.local' } } });
  await prisma.deliveryRate.deleteMany({ where: { user: { email: 'orders_test@test.local' } } });
  await prisma.user.deleteMany({ where: { email: 'orders_test@test.local' } });

  // Register user
  const regRes = await request(app).post('/api/auth/register').send({
    username: 'orders_test_user',
    email: 'orders_test@test.local',
    password: 'OrdersTest123',
  });
  token = regRes.body.data.token;
  userId = regRes.body.data.user.id;

  // Get API key
  const settings = await request(app)
    .get('/api/settings')
    .set('Authorization', `Bearer ${token}`);
  apiKey = settings.body.data.apiKey;

  // Create test product
  const prodRes = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Order Test Product',
      costPrice: 100,
      sellingPrice: 500,
      stockQuantity: 10,
    });
  productId = prodRes.body.data.id;

  // Create delivery rates for test wilayas
  for (const wilaya of WILAYAS) {
    await prisma.deliveryRate.upsert({
      where: { userId_wilayaCode: { userId, wilayaCode: wilaya.code } },
      update: {},
      create: {
        userId,
        wilayaCode: wilaya.code,
        wilayaName: wilaya.name,
        homeDeliveryPrice: 600,
        deskDeliveryPrice: 400,
      },
    });
  }
});

afterAll(async () => {
  await prisma.order.deleteMany({ where: { user: { email: 'orders_test@test.local' } } });
  await prisma.product.deleteMany({ where: { user: { email: 'orders_test@test.local' } } });
  await prisma.deliveryRate.deleteMany({ where: { user: { email: 'orders_test@test.local' } } });
  await prisma.user.deleteMany({ where: { email: 'orders_test@test.local' } });
  await prisma.$disconnect();
});

describe('Orders API', () => {
  describe('POST /api/v1/orders - Create order and stock deduction', () => {
    it('should create an order and deduct stock', async () => {
      // Get initial stock
      const beforeProd = await prisma.product.findUnique({ where: { id: productId } });
      const initialStock = beforeProd!.stockQuantity;

      const res = await request(app)
        .post('/api/v1/orders')
        .set('x-api-key', apiKey)
        .send({
          customer_name: 'Test Customer',
          customer_phone: '0550123456',
          wilaya_code: '16',
          address: 'Test Address 123',
          product_id: productId,
          quantity: 3,
          delivery_type: 'home',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('pending');

      // Verify stock was deducted
      const afterProd = await prisma.product.findUnique({ where: { id: productId } });
      expect(afterProd!.stockQuantity).toBe(initialStock - 3);
    });

    it('should use DB price, not client-provided price', async () => {
      // The API should ignore any price sent from the client
      const res = await request(app)
        .post('/api/v1/orders')
        .set('x-api-key', apiKey)
        .send({
          customer_name: 'Price Test Customer',
          customer_phone: '0550123456',
          wilaya_code: '16',
          address: 'Test Address 123',
          product_id: productId,
          quantity: 1,
          delivery_type: 'home',
          // These should be completely ignored:
          selling_price: 1,
          delivery_fee: 0,
          total_amount: 1,
        });

      expect(res.status).toBe(201);
      // Price should be 500 (from DB), not 1
      expect(parseFloat(res.body.data.productUnitPrice)).toBe(500);
      // Delivery should be 600 (home rate for wilaya 16)
      expect(parseFloat(res.body.data.deliveryFee)).toBe(600);
      // Total = 500 * 1 + 600 = 1100
      expect(parseFloat(res.body.data.totalAmount)).toBe(1100);
    });

    it('should reject order with insufficient stock', async () => {
      const prod = await prisma.product.findUnique({ where: { id: productId } });
      const currentStock = prod!.stockQuantity;

      const res = await request(app)
        .post('/api/v1/orders')
        .set('x-api-key', apiKey)
        .send({
          customer_name: 'Overflow Customer',
          customer_phone: '0550123456',
          wilaya_code: '16',
          address: 'Test Address',
          product_id: productId,
          quantity: currentStock + 100, // Way more than available
          delivery_type: 'home',
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('INSUFFICIENT_STOCK');
    });

    it('should mark product as out-of-stock when stock reaches 0', async () => {
      // Get remaining stock
      const prod = await prisma.product.findUnique({ where: { id: productId } });
      const remaining = prod!.stockQuantity;

      if (remaining > 0) {
        const res = await request(app)
          .post('/api/v1/orders')
          .set('x-api-key', apiKey)
          .send({
            customer_name: 'Last Stock Customer',
            customer_phone: '0550123456',
            wilaya_code: '16',
            address: 'Test Address',
            product_id: productId,
            quantity: remaining,
            delivery_type: 'home',
          });

        expect(res.status).toBe(201);

        const updatedProd = await prisma.product.findUnique({ where: { id: productId } });
        expect(updatedProd!.stockQuantity).toBe(0);
        expect(updatedProd!.isOutOfStock).toBe(true);
      }
    });

    it('should reject order for out-of-stock product', async () => {
      // Ensure product is out of stock
      await prisma.product.update({
        where: { id: productId },
        data: { stockQuantity: 0, isOutOfStock: true },
      });

      const res = await request(app)
        .post('/api/v1/orders')
        .set('x-api-key', apiKey)
        .send({
          customer_name: 'OOS Customer',
          customer_phone: '0550123456',
          wilaya_code: '16',
          address: 'Test Address',
          product_id: productId,
          quantity: 1,
          delivery_type: 'home',
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('INSUFFICIENT_STOCK');
    });
  });

  describe('Cancel order and stock restore', () => {
    let orderId: number;

    beforeAll(async () => {
      // Reset stock for this test
      await prisma.product.update({
        where: { id: productId },
        data: { stockQuantity: 10, isOutOfStock: false },
      });

      const res = await request(app)
        .post('/api/v1/orders')
        .set('x-api-key', apiKey)
        .send({
          customer_name: 'Cancel Test',
          customer_phone: '0550123456',
          wilaya_code: '16',
          address: 'Test Address',
          product_id: productId,
          quantity: 3,
          delivery_type: 'home',
        });
      orderId = res.body.data.id;
    });

    it('should restore stock when order is cancelled', async () => {
      const beforeProd = await prisma.product.findUnique({ where: { id: productId } });
      const stockBeforeCancel = beforeProd!.stockQuantity; // Should be 7

      const res = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'cancelled' });

      expect(res.status).toBe(200);

      const afterProd = await prisma.product.findUnique({ where: { id: productId } });
      expect(afterProd!.stockQuantity).toBe(stockBeforeCancel + 3);
    });

    it('should NOT restore stock again if order is already cancelled', async () => {
      const beforeProd = await prisma.product.findUnique({ where: { id: productId } });
      const stockBefore = beforeProd!.stockQuantity;

      const res = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'cancelled' });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('ALREADY_CANCELLED');

      // Stock must remain unchanged
      const afterProd = await prisma.product.findUnique({ where: { id: productId } });
      expect(afterProd!.stockQuantity).toBe(stockBefore);
    });
  });

  describe('Stock check via n8n API', () => {
    beforeAll(async () => {
      await prisma.product.update({
        where: { id: productId },
        data: { stockQuantity: 5, isOutOfStock: false },
      });
    });

    it('should report product as available with correct stock', async () => {
      const res = await request(app)
        .get('/api/v1/products/check?name=Order+Test+Product')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      expect(res.body.data.product.available).toBe(true);
      expect(res.body.data.product.stock_quantity).toBe(5);
    });

    it('should report product as unavailable when out of stock', async () => {
      await prisma.product.update({
        where: { id: productId },
        data: { stockQuantity: 0, isOutOfStock: true },
      });

      const res = await request(app)
        .get('/api/v1/products/check?name=Order+Test+Product')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(200);
      expect(res.body.data.product.available).toBe(false);
      expect(res.body.data.product.stock_quantity).toBe(0);
      expect(res.body.data.product.selling_price).toBeDefined();
    });
  });
});
