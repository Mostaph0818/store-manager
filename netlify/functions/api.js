const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['*'],
  credentials: true
}));
app.use(express.json());

// Helper: execute query
async function query(text, params) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

// Helper: generate JWT
function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// Helper: verify JWT
function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
}

// Health check
app.get('/health', async (req, res) => {
  try {
    await query('SELECT 1');
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

    // Check existing email
    const existingEmail = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingEmail.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'البريد الإلكتروني مستخدم بالفعل' });
    }

    // Check existing username
    const existingUsername = await query('SELECT id FROM users WHERE username = $1', [username]);
    if (existingUsername.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'اسم المستخدم مستخدم بالفعل' });
    }

    // Create user
    const passwordHash = await bcrypt.hash(password, 10);
    const apiKey = `sm_${crypto.randomBytes(32).toString('hex')}`;

    const result = await query(
      'INSERT INTO users (username, email, password_hash, api_key) VALUES ($1, $2, $3, $4) RETURNING id, username, email',
      [username, email, passwordHash, apiKey]
    );

    const user = result.rows[0];

    // Seed 69 wilayas delivery rates
    const wilayas = [
      { code: '01', name: 'أدرار' }, { code: '02', name: 'الشلف' }, { code: '03', name: 'الأغواط' },
      { code: '04', name: 'أم البواقي' }, { code: '05', name: 'باتنة' }, { code: '06', name: 'بجاية' },
      { code: '07', name: 'بسكرة' }, { code: '08', name: 'بشار' }, { code: '09', name: 'البليدة' },
      { code: '10', name: 'البويرة' }, { code: '11', name: 'تمنراست' }, { code: '12', name: 'تبسة' },
      { code: '13', name: 'تلمسان' }, { code: '14', name: 'تيارت' }, { code: '15', name: 'تيزي وزو' },
      { code: '16', name: 'الجزائر' }, { code: '17', name: 'الجلفة' }, { code: '18', name: 'جيجل' },
      { code: '19', name: 'سطيف' }, { code: '20', name: 'سعيدة' }, { code: '21', name: 'سكيكدة' },
      { code: '22', name: 'سيدي بلعباس' }, { code: '23', name: 'عنابة' }, { code: '24', name: 'قالمة' },
      { code: '25', name: 'قسنطينة' }, { code: '26', name: 'المدية' }, { code: '27', name: 'مستغانم' },
      { code: '28', name: 'المسيلة' }, { code: '29', name: 'معسكر' }, { code: '30', name: 'ورقلة' },
      { code: '31', name: 'وهران' }, { code: '32', name: 'البيض' }, { code: '33', name: 'إليزي' },
      { code: '34', name: 'برج بوعريريج' }, { code: '35', name: 'بومرداس' }, { code: '36', name: 'الطارف' },
      { code: '37', name: 'تندوف' }, { code: '38', name: 'تسمسيلت' }, { code: '39', name: 'الوادي' },
      { code: '40', name: 'خنشلة' }, { code: '41', name: 'سوق أهراس' }, { code: '42', name: 'تيبازة' },
      { code: '43', name: 'ميلة' }, { code: '44', name: 'عين الدفلى' }, { code: '45', name: 'النعامة' },
      { code: '46', name: 'عين تموشنت' }, { code: '47', name: 'غرداية' }, { code: '48', name: 'غليزان' },
      { code: '49', name: 'تيميمون' }, { code: '50', name: 'برج باجي مختار' }, { code: '51', name: 'أولاد جلال' },
      { code: '52', name: 'بني عباس' }, { code: '53', name: 'إن صالح' }, { code: '54', name: 'إن قزام' },
      { code: '55', name: 'تقرت' }, { code: '56', name: 'جانيت' }, { code: '57', name: 'المغير' },
      { code: '58', name: 'المنيعة' }, { code: '59', name: 'أفلو' }, { code: '60', name: 'بريكة' },
      { code: '61', name: 'القنطرة' }, { code: '62', name: 'بئر العاتر' }, { code: '63', name: 'العريشة' },
      { code: '64', name: 'قصر الشلالة' }, { code: '65', name: 'عين وسارة' }, { code: '66', name: 'مسعد' },
      { code: '67', name: 'قصر البخاري' }, { code: '68', name: 'بوسعادة' }, { code: '69', name: 'الأبيض سيدي الشيخ' }
    ];

    for (const w of wilayas) {
      await query(
        'INSERT INTO delivery_rates (user_id, wilaya_code, wilaya_name, home_delivery_price, desk_delivery_price, created_at, updated_at) VALUES ($1, $2, $3, 500, 350, NOW(), NOW()) ON CONFLICT (user_id, wilaya_code) DO NOTHING',
        [user.id, w.code, w.name]
      );
    }

    const token = generateToken(user);

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

    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    const token = generateToken({ id: user.id, email: user.email });

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

// Auth - Get Me
app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token' });

    const decoded = verifyToken(token);
    const result = await query('SELECT id, username, email FROM users WHERE id = $1', [decoded.userId]);
    if (result.rows.length === 0) return res.status(401).json({ success: false, message: 'User not found' });

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// Dashboard
app.get('/api/dashboard', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token' });

    const decoded = verifyToken(token);
    const uid = decoded.userId;

    const [products, orders, revenue, pending, recent] = await Promise.all([
      query('SELECT COUNT(*) as count FROM products WHERE user_id = $1', [uid]),
      query('SELECT COUNT(*) as count FROM orders WHERE user_id = $1', [uid]),
      query('SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE user_id = $1', [uid]),
      query("SELECT COUNT(*) as count FROM orders WHERE user_id = $1 AND status = 'pending'", [uid]),
      query('SELECT o.*, p.name as product_name FROM orders o LEFT JOIN products p ON o.product_id = p.id WHERE o.user_id = $1 ORDER BY o.created_at DESC LIMIT 5', [uid])
    ]);

    res.json({
      success: true,
      data: {
        totalProducts: parseInt(products.rows[0].count),
        totalOrders: parseInt(orders.rows[0].count),
        totalRevenue: parseFloat(revenue.rows[0].total),
        pendingOrders: parseInt(pending.rows[0].count),
        recentOrders: recent.rows
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

    const decoded = verifyToken(token);
    const result = await query('SELECT * FROM products WHERE user_id = $1 ORDER BY created_at DESC', [decoded.userId]);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'خطأ في الخادم' });
  }
});

// Products - Create
app.post('/api/products', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token' });

    const decoded = verifyToken(token);
    const { name, description, costPrice, sellingPrice, stockQuantity, barcode, category } = req.body;

    const result = await query(
      'INSERT INTO products (user_id, name, description, cost_price, selling_price, stock_quantity, barcode, category, is_out_of_stock, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) RETURNING *',
      [decoded.userId, name, description || null, costPrice, sellingPrice, stockQuantity || 0, barcode || null, category || null, (stockQuantity || 0) === 0]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'تم إضافة المنتج بنجاح' });
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

    const decoded = verifyToken(token);
    const { name, description, costPrice, sellingPrice, stockQuantity } = req.body;

    const result = await query(
      'UPDATE products SET name = COALESCE($1, name), description = COALESCE($2, description), cost_price = COALESCE($3, cost_price), selling_price = COALESCE($4, selling_price), stock_quantity = COALESCE($5, stock_quantity), updated_at = NOW() WHERE id = $6 AND user_id = $7 RETURNING *',
      [name, description, costPrice, sellingPrice, stockQuantity, parseInt(req.params.id), decoded.userId]
    );

    res.json({ success: true, data: result.rows[0], message: 'تم تحديث المنتج' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'خطأ في الخادم' });
  }
});

// Products - Delete
app.delete('/api/products/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token' });

    const decoded = verifyToken(token);
    await query('DELETE FROM products WHERE id = $1 AND user_id = $2', [parseInt(req.params.id), decoded.userId]);
    res.json({ success: true, message: 'تم حذف المنتج' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'خطأ في الخادم' });
  }
});

// Orders - List
app.get('/api/orders', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token' });

    const decoded = verifyToken(token);
    const result = await query(
      'SELECT o.*, p.name as product_name FROM orders o LEFT JOIN products p ON o.product_id = p.id WHERE o.user_id = $1 ORDER BY o.created_at DESC',
      [decoded.userId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'خطأ في الخادم' });
  }
});

// Orders - Update Status
app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token' });

    const decoded = verifyToken(token);
    const { status } = req.body;
    await query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3',
      [status, parseInt(req.params.id), decoded.userId]);
    res.json({ success: true, message: 'تم تحديث حالة الطلب' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'خطأ في الخادم' });
  }
});

// Delivery - List
app.get('/api/delivery', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token' });

    const decoded = verifyToken(token);
    const result = await query('SELECT * FROM delivery_rates WHERE user_id = $1 ORDER BY wilaya_code ASC', [decoded.userId]);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'خطأ في الخادم' });
  }
});

// Delivery - Update
app.patch('/api/delivery/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token' });

    const decoded = verifyToken(token);
    const { homeDeliveryPrice, deskDeliveryPrice } = req.body;
    await query('UPDATE delivery_rates SET home_delivery_price = COALESCE($1, home_delivery_price), desk_delivery_price = COALESCE($2, desk_delivery_price), updated_at = NOW() WHERE id = $3 AND user_id = $4',
      [homeDeliveryPrice, deskDeliveryPrice, parseInt(req.params.id), decoded.userId]);
    res.json({ success: true, message: 'تم تحديث سعر التوصيل' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'خطأ في الخادم' });
  }
});

// Settings - Get API Key
app.get('/api/settings', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token' });

    const decoded = verifyToken(token);
    const result = await query('SELECT api_key, email, username FROM users WHERE id = $1', [decoded.userId]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'خطأ في الخادم' });
  }
});

// Catch all
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

// Export handler
module.exports.handler = serverless(app);
