# Store Manager (نظام إدارة المتجر والمبيعات والمخزون)

تطبيق متكامل وقابل للتشغيل الفوري لإدارة **المبيعات والمخزون والطلبات وأسعار التوصيل (69 ولاية جزائرية)**، مع لوحة تحكم Web حديثة ومتجاوبة باللغة العربية (RTL)، وREST API مؤمن مخصص للربط المباشر مع أتمتة **n8n**.

---

## ✨ المميزات الرئيسية

1. **Multi-Tenant Architecture**: عزل تام وكامل لبيانات كل مستخدم (منتجات، طلبات، أسعار توصيل، مفاتيح API).
2. **REST API Versioned (`/api/v1/`)**: مخصص للربط مع n8n ويعمل عبر الـ Header `x-api-key`.
3. **Database Transactions**: خصم المخزون وحساب المجموع بأسعار قاعدة البيانات الحقيقية فقط لمنع التلاعب وتجنب الـ Race Conditions.
4. **نظام إلغاء الطلبات الذكي**: إرجاع الكمية إلى المخزون تلقائيًا لمرة واحدة فقط عند إلغاء أي طلب.
5. **تغطية الولايات الـ69 الجزائرية**: أسعار منفصلة للتوصيل للمنزل والمكتب مع بحث وتعديل فوري.
6. **لوحة تحكم حديثة**: مبنية بـ React 18 + Tailwind CSS + Lucide Icons مع دعم كامل للشاشات الصغيرة والهواتف.
7. **توثيق Swagger تفاعلي**: متوفر على `/api-docs`.

---

## 🛠 التقنيات المستخدمة

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL (أساسي) / SQLite (للتجربة السريعة)
- **ORM**: Prisma ORM
- **Authentication**: JWT للوحة التحكم + API Keys لـ n8n
- **Validation**: Zod
- **Hashing**: bcrypt
- **Security**: Helmet, CORS, Rate Limiting, Atomic Transactions
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Axios, React Hot Toast
- **Containerization**: Docker & Docker Compose

---

## 📁 هيكل المشروع

```text
store-manager/
├── backend/
│   ├── src/
│   │   ├── config/          # إعدادات قاعدة البيانات وSwagger
│   │   ├── controllers/     # منطق العمل لجميع المسارات و v1
│   │   ├── middleware/      # JWT Auth, API Key Auth, Error Handler, Rate Limiter
│   │   ├── routes/          # مسارات API و v1
│   │   ├── utils/           # توليد API Key، وتوحيد الاستجابات
│   │   ├── validators/      # مخططات التحقق بـ Zod
│   │   └── app.ts           # خادم Express الرئيسي
│   ├── prisma/
│   │   ├── schema.prisma    # مخطط قاعدة البيانات
│   │   └── seed.ts          # بيانات تجريبية والولايات الـ69
│   ├── tests/               # اختبارات Jest الشاملة
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── api/             # عميل Axios والدوال المركزية
│   │   ├── components/      # مكونات الواجهة (Modal, Badges, Sidebar, Navbar)
│   │   ├── contexts/        # AuthContext لإدارة الجلسة
│   │   ├── pages/           # صفحات التطبيق (Dashboard, Products, Orders, Delivery, Settings)
│   │   ├── types/           # تعريفات TypeScript
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── docker-compose.yml
└── README.md
```

---

## 🚀 طريقة التشغيل السريعة

### الخيار 1: التشغيل بـ Docker Compose (موصى به)

قم بتشغيل الأمر التالي في المجلد الرئيسي للمشروع:

```bash
docker compose up --build
```

- **لوحة التحكم (Frontend)**: `http://localhost`
- **واجهة البرمجة (Backend API)**: `http://localhost:3000`
- **توثيق التفاعلي (Swagger UI)**: `http://localhost:3000/api-docs`

---

### الخيار 2: التشغيل اليدوي المحلي (Development)

#### 1. إعداد Backend

```bash
cd backend
npm install

# نسخ ملف البيئة
cp .env.example .env

# توليد عميل Prisma وإنشاء الجداول
npx prisma generate
npx prisma db push

# زرع البيانات التجريبية والولايات الـ 69
npx ts-node prisma/seed.ts

# تشغيل الخادم في وضع التطوير
npm run dev
```

الخادم سيعمل على `http://localhost:3000`.

#### 2. إعداد Frontend

افتح نافذة Terminal ثانية:

```bash
cd frontend
npm install

# تشغيل خادم التطوير
npm run dev
```

الواجهة ستعمل على `http://localhost:5173`.

---

## 👤 الحساب التجريبي المسبق (Demo Account)

عند تشغيل الـ Seed يتم إنشاء الحساب التالي تلقائيًا:

- **البريد الإلكتروني**: `demo@storemanager.local`
- **كلمة المرور**: `Demo@1234`
- **مفتاح API**: ستجده مطبوعًا في التيرمينال عند تنفيذ الـ seed وكذلك داخل صفحة **الإعدادات** في لوحة التحكم.

---

## 🧪 تشغيل الاختبارات (Unit & Integration Tests)

يشمل المشروع اختبارات آلية تغطي:
- المصادقة والتسجيل (Register / Login / JWT).
- عزل بيانات المستخدمين (Multi-Tenant Isolation).
- خصم المخزون والتعامل مع حالات نفاد الكمية.
- إلغاء الطلبات وإرجاع المخزون لمرة واحدة فقط.
- فحص ومنع Race Conditions.

لتشغيل الاختبارات:

```bash
cd backend
npm test
```

---

## 🔌 دليل الربط مع n8n (API Integration)

جميع نقاط النهاية في `/api/v1/` تتطلب إرسال مفتاح الـ API في الـ Headers:

```text
x-api-key: YOUR_API_KEY
```

### 1. فحص توفر المنتج (Product Check)

- **Method**: `GET`
- **URL**: `http://localhost:3000/api/v1/products/check`
- **Query Params**: `name=Smartphone`
- **Headers**: `x-api-key: YOUR_API_KEY`

**استجابة نموذجية (JSON):**

```json
{
  "success": true,
  "data": {
    "product": {
      "id": 1,
      "name": "Smartphone XR Pro",
      "available": true,
      "stock_quantity": 50,
      "selling_price": "32000"
    }
  }
}
```

---

### 2. جلب سعر التوصيل لولاية محددة (Delivery Rate)

- **Method**: `GET`
- **URL**: `http://localhost:3000/api/v1/delivery/rate`
- **Query Params**:
  - `wilaya=19`
  - `delivery_type=home` (أو `desk`)
- **Headers**: `x-api-key: YOUR_API_KEY`

**استجابة نموذجية (JSON):**

```json
{
  "success": true,
  "data": {
    "wilaya": {
      "code": "19",
      "name": "Sétif"
    },
    "delivery_type": "home",
    "delivery_fee": "500"
  }
}
```

---

### 3. إنشاء وتسجيل طلب جديد (Create Order)

- **Method**: `POST`
- **URL**: `http://localhost:3000/api/v1/orders`
- **Headers**:
  - `Content-Type: application/json`
  - `x-api-key: YOUR_API_KEY`
- **Body**:

```json
{
  "customer_name": "محمد بن علي",
  "customer_phone": "0550123456",
  "wilaya_code": "19",
  "address": "حي 500 مسكن، عمارة ب، سطيف",
  "product_id": 1,
  "quantity": 2,
  "delivery_type": "home"
}
```

**استجابة نموذجية (JSON):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "customerName": "محمد بن علي",
    "customerPhone": "0550123456",
    "wilayaCode": "19",
    "wilayaName": "Sétif",
    "address": "حي 500 مسكن، عمارة ب، سطيف",
    "productId": 1,
    "quantity": 2,
    "productUnitPrice": "32000",
    "deliveryType": "home",
    "deliveryFee": "500",
    "totalAmount": "64500",
    "status": "pending",
    "createdAt": "2026-08-20T19:30:00.000Z"
  },
  "message": "Order created successfully."
}
```

> **ملاحظة أمان هامة**: يتم حساب المجموع الكلي وسعر القطعة وسعر التوصيل تلقائيًا من قاعدة البيانات ويتم تجاهل أي أسعار مرسلة في الـ Request Body لحماية متجرك من التلاعب بالأسعار.

---

## 🔄 بناء سيناريو الأتمتة الكامل في n8n

يمكنك إنشاء سير عمل متكامل في n8n بالخطوات التالية:

```
[Webhook / Telegram / WhatsApp Trigger]
                  ↓
       [AI Agent / Text Parser] (استخراج اسم المنتج، رقم الهاتف، والولاية)
                  ↓
     [HTTP Request: فحص المنتج] (GET /api/v1/products/check?name={{$json.productName}})
                  ↓
           [IF: المنتج متوفر؟]
           ├── لا → [إرسال رسالة اعتذار ونفاد المخزون للعميل]
           └── نعم →
                  ↓
   [HTTP Request: جلب سعر التوصيل] (GET /api/v1/delivery/rate?wilaya={{$json.wilaya}}&delivery_type=home)
                  ↓
     [HTTP Request: إنشاء الطلب] (POST /api/v1/orders)
                  ↓
   [إرسال رسالة تأكيد للعميل تحتوي رقم الطلب والمجموع الكلي]
```

---

## 🔒 قائمة التحقق قبل النشر للإنتاج (Production Checklist)

1. **تغيير الأسرار (Secrets)**:
   - قم بتوليد مفتاح `JWT_SECRET` عشوائي ومعقد بطول لا يقل عن 32 محرفًا.
   - قم بتغيير كلمة مرور قاعدة بيانات PostgreSQL.
2. **إعداد النطاقات و CORS**:
   - اضبط `CORS_ORIGIN` و `FRONTEND_URL` في الـ `.env` ليطابق اسم النطاق الحقيقي لمتجرك (مثل `https://store.example.com`).
3. **تفعيل HTTPS**:
   - استخدم Nginx مع شهادة SSL مجانية من Let's Encrypt (Certbot) أو Cloudflare.
4. **تفعيل النسخ الاحتياطي (Backups)**:
   - قم بإعداد Cron Job يومي لعمل `pg_dump` لقاعدة البيانات.
#   s t o r e - m a n a g e r  
 