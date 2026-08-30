const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['*'],
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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

    const passwordHash = await bcrypt.hash(password, 10);
    const apiKey = `sm_${require('crypto').randomBytes(32).toString('hex')}`;

    const user = await prisma.user.create({
      data: { username, email, passwordHash, apiKey },
      select: { id: true, username: true, email: true }
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Auth - Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({
      user: { id: user.id, username: user.username, email: user.email },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Auth - Get Me
app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token' });
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

// Products
app.get('/api/products', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    const products = await prisma.product.findMany({
      where: { userId: decoded.userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    const product = await prisma.product.create({
      data: { ...req.body, userId: decoded.userId }
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    await prisma.product.deleteMany({
      where: { id: parseInt(req.params.id), userId: decoded.userId }
    });

    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Orders
app.get('/api/orders', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    const orders = await prisma.order.findMany({
      where: { userId: decoded.userId },
      include: { product: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Dashboard
app.get('/api/dashboard', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
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
    res.status(500).json({ message: 'Server error' });
  }
});

// Delivery Rates
app.get('/api/delivery', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    const rates = await prisma.deliveryRate.findMany({
      where: { userId: decoded.userId },
      orderBy: { wilayaCode: 'asc' }
    });

    res.json(rates);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Catch all
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// Export handler
module.exports.handler = serverless(app);
