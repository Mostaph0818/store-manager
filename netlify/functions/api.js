const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Prisma - singleton for serverless (reuse across warm invocations)
let prisma;
if (!global.prisma) {
  global.prisma = new PrismaClient({
    log: ['error'],
  });
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
    res.json({ status: 'ok', timestamp: new Date().toISOString(), db: 'connected' });
  } catch (error) {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), db: 'error', message: error.message });
  }
});

// Auth - Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return res.status(409).json({ message: 'Username already exists' });
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

    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Auth - Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      user: { id: user.id, username: user.username, email: user.email },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Auth - Get Me
app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, username: true, email: true }
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Dashboard
app.get('/api/dashboard', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });

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
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      pendingOrders,
      recentOrders
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Products - List
app.get('/api/products', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const products = await prisma.product.findMany({
      where: { userId: decoded.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(products);
  } catch (error) {
    console.error('Products list error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Products - Create
app.post('/api/products', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const product = await prisma.product.create({
      data: { ...req.body, userId: decoded.userId }
    });
    res.status(201).json(product);
  } catch (error) {
    console.error('Product create error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Products - Update
app.patch('/api/products/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const product = await prisma.product.updateMany({
      where: { id: parseInt(req.params.id), userId: decoded.userId },
      data: req.body
    });
    res.json(product);
  } catch (error) {
    console.error('Product update error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Products - Delete
app.delete('/api/products/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    await prisma.product.deleteMany({
      where: { id: parseInt(req.params.id), userId: decoded.userId }
    });
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Product delete error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Orders - List
app.get('/api/orders', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const orders = await prisma.order.findMany({
      where: { userId: decoded.userId },
      include: { product: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    console.error('Orders list error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Orders - Get by ID
app.get('/api/orders/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const order = await prisma.order.findFirst({
      where: { id: parseInt(req.params.id), userId: decoded.userId },
      include: { product: true }
    });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    console.error('Order get error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Orders - Update Status
app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const { status } = req.body;
    const order = await prisma.order.updateMany({
      where: { id: parseInt(req.params.id), userId: decoded.userId },
      data: { status }
    });
    res.json(order);
  } catch (error) {
    console.error('Order status error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Delivery - List
app.get('/api/delivery', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const rates = await prisma.deliveryRate.findMany({
      where: { userId: decoded.userId },
      orderBy: { wilayaCode: 'asc' }
    });
    res.json(rates);
  } catch (error) {
    console.error('Delivery list error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Delivery - Update
app.patch('/api/delivery/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const rate = await prisma.deliveryRate.updateMany({
      where: { id: parseInt(req.params.id), userId: decoded.userId },
      data: req.body
    });
    res.json(rate);
  } catch (error) {
    console.error('Delivery update error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Settings - Get API Key
app.get('/api/settings', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { apiKey: true, email: true, username: true }
    });
    res.json(user);
  } catch (error) {
    console.error('Settings error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Catch all
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// Export handler
module.exports.handler = serverless(app);
