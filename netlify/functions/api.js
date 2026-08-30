const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Prisma - singleton for serverless
let prisma;
if (!global.prisma) {
  global.prisma = new PrismaClient({ log: ['error'] });
}
prisma = global.prisma;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['*'],
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, data: { status: 'ok', db: 'connected' } });
  } catch (error) {
    res.json({ success: true, data: { status: 'ok', db: 'error', message: error.message } });
  }
});

// Auth - Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'يرجى ملء جميع الحقول' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'البريد الإلكتروني مستخدم بالفعل' });
    }

    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return res.status(409).json({ success: false, message: 'اسم المستخدم مستخدم بالفعل' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const apiKey = `sm_${require('crypto').randomBytes(32).toString('hex')}`;

    const user = await prisma.user.create({
      data: { username, email, passwordHash, apiKey },
      select: { id: true, username: true, email: true }
    });

    // Seed delivery rates for 69 wilayas
    const { ALGERIAN_WILAYAS } = require('./wilayas');
    for (const wilaya of ALGERIAN_WILAYAS) {
      await prisma.deliveryRate.upsert({
        where: { userId_wilayaCode: { userId: user.id, wilayaCode: wilaya.code } },
        update: {},
        create: {
          userId: user.id,
          wilayaCode: wilaya.code,
          wilayaName: wilaya.name,
          homeDeliveryPrice: 500,
          deskDeliveryPrice: 350,
        },
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({ success: true, data: { user, token }, message: 'تم إنشاء الحساب بنجاح' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: error.message || 'خطأ في الخادم' });
  }
});

// Auth - Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'يرجى إدخال البريد وكلمة المرور' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      data: {
        user: { id: user.id, username: user.username, email: user.email },
        token
      },
      message: 'تم تسجيل الدخول بنجاح'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message || 'خطأ في الخادم' });
  }
});

// Auth - Google Login
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential is required' });
    }

    // For now, create/find user based on credential
    // In production, verify the Google token properly
    const email = `google_user_${Date.now()}@google.local`;
    const username = `google_user_${Date.now()}`;

    const existingUser = await prisma.user.findFirst({ where: { email } });

    let user;
    if (existingUser) {
      user = existingUser;
    } else {
      const passwordHash = await bcrypt.hash(require('crypto').randomBytes(32).toString('hex'), 10);
      const apiKey = `sm_${require('crypto').randomBytes(32).toString('hex')}`;

      user = await prisma.user.create({
        data: { username, email, passwordHash, apiKey },
        select: { id: true, username: true, email: true }
      });

      // Seed delivery rates
      const { ALGERIAN_WILAYAS } = require('./wilayas');
      for (const wilaya of ALGERIAN_WILAYAS) {
        await prisma.deliveryRate.upsert({
          where: { userId_wilayaCode: { userId: user.id, wilayaCode: wilaya.code } },
          update: {},
          create: {
            userId: user.id,
            wilayaCode: wilaya.code,
            wilayaName: wilaya.name,
            homeDeliveryPrice: 500,
            deskDeliveryPrice: 350,
          },
        });
      }
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      data: { user, token },
      message: 'تم تسجيل الدخول عبر Google بنجاح'
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ success: false, message: error.message || 'خطأ في الخادم' });
  }
});

// Auth - Get Me
app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, username: true, email: true }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// Dashboard
app.get('/api/dashboard', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');

    const [totalProducts, totalOrders, totalRevenue, pendingOrders, recentOrders] = await Promise.all([
      prisma.product.count({ where: { userId: decoded.userId } }),
      prisma.order.count({ where: { userId: decoded.userId } }),
      prisma.order.aggregate({ where: { userId: decoded.userId }, _sum: { totalAmount: true } }),
      prisma.order.count({ where: { userId: decoded.userId, status: 'pending' } }),
      prisma.order.findMany({
        where: { userId: decoded.userId },
        include: { product: true },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ]);

    res.json({
      success: true,
      data: {
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        pendingOrders,
        recentOrders
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: error.message || 'خطأ في الخادم' });
  }
});

// Products - List
app.get('/api/products', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const products = await prisma.product.findMany({
      where: { userId: decoded.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Products list error:', error);
    res.status(500).json({ success: false, message: error.message || 'خطأ في الخادم' });
  }
});

// Products - Create
app.post('/api/products', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const product = await prisma.product.create({
      data: { ...req.body, userId: decoded.userId }
    });
    res.status(201).json({ success: true, data: product, message: 'تم إضافة المنتج بنجاح' });
  } catch (error) {
    console.error('Product create error:', error);
    res.status(500).json({ success: false, message: error.message || 'خطأ في الخادم' });
  }
});

// Products - Update
app.patch('/api/products/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const product = await prisma.product.updateMany({
      where: { id: parseInt(req.params.id), userId: decoded.userId },
      data: req.body
    });
    res.json({ success: true, data: product, message: 'تم تحديث المنتج' });
  } catch (error) {
    console.error('Product update error:', error);
    res.status(500).json({ success: false, message: error.message || 'خطأ في الخادم' });
  }
});

// Products - Delete
app.delete('/api/products/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    await prisma.product.deleteMany({
      where: { id: parseInt(req.params.id), userId: decoded.userId }
    });
    res.json({ success: true, message: 'تم حذف المنتج' });
  } catch (error) {
    console.error('Product delete error:', error);
    res.status(500).json({ success: false, message: error.message || 'خطأ في الخادم' });
  }
});

// Orders - List
app.get('/api/orders', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const orders = await prisma.order.findMany({
      where: { userId: decoded.userId },
      include: { product: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Orders list error:', error);
    res.status(500).json({ success: false, message: error.message || 'خطأ في الخادم' });
  }
});

// Orders - Get by ID
app.get('/api/orders/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const order = await prisma.order.findFirst({
      where: { id: parseInt(req.params.id), userId: decoded.userId },
      include: { product: true }
    });
    if (!order) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Order get error:', error);
    res.status(500).json({ success: false, message: error.message || 'خطأ في الخادم' });
  }
});

// Orders - Update Status
app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const { status } = req.body;
    await prisma.order.updateMany({
      where: { id: parseInt(req.params.id), userId: decoded.userId },
      data: { status }
    });
    res.json({ success: true, message: 'تم تحديث حالة الطلب' });
  } catch (error) {
    console.error('Order status error:', error);
    res.status(500).json({ success: false, message: error.message || 'خطأ في الخادم' });
  }
});

// Delivery - List
app.get('/api/delivery', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const rates = await prisma.deliveryRate.findMany({
      where: { userId: decoded.userId },
      orderBy: { wilayaCode: 'asc' }
    });
    res.json({ success: true, data: rates });
  } catch (error) {
    console.error('Delivery list error:', error);
    res.status(500).json({ success: false, message: error.message || 'خطأ في الخادم' });
  }
});

// Delivery - Update
app.patch('/api/delivery/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    await prisma.deliveryRate.updateMany({
      where: { id: parseInt(req.params.id), userId: decoded.userId },
      data: req.body
    });
    res.json({ success: true, message: 'تم تحديث سعر التوصيل' });
  } catch (error) {
    console.error('Delivery update error:', error);
    res.status(500).json({ success: false, message: error.message || 'خطأ في الخادم' });
  }
});

// Settings - Get API Key
app.get('/api/settings', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { apiKey: true, email: true, username: true }
    });
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Settings error:', error);
    res.status(500).json({ success: false, message: error.message || 'خطأ في الخادم' });
  }
});

// Catch all
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

// Export handler
module.exports.handler = serverless(app);
