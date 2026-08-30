<div align="center">

# 🏪 Store Manager

### نظام إدارة المتجر والمبيعات والمخزون

تطبيق متكامل لإدارة **المبيعات والمخزون والطلبات وأسعار التوصيل لـ 69 ولاية جزائرية**

لوحة تحكم ويب حديثة (RTL) + REST API للربط مع n8n

---

[![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://prisma.io)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://docker.com)

</div>

---

## ✨ المميزات الرئيسية

| الميزة | الوصف |
|--------|-------|
| 🔐 **Multi-Tenant** | عزل تام لبيانات كل مستخدم |
| 🔌 **REST API v1** | مخصص للربط مع n8n عبر API Key |
| 🛡️ **أمان متقدم** | JWT + Rate Limiting + Helmet + Atomic Transactions |
| 🇩🇿 **69 ولاية جزائرية** | أسعار توصيل منفصلة للمنزل والمكتب |
| 📊 **لوحة تحكم حديثة** | React 18 + Tailwind CSS + RTL كامل |
| 📝 **Swagger** | توثيق تفاعلي على `/api-docs` |

---

## 🛠 التقنيات

<div align="center">

| Backend | Frontend | DevOps |
|---------|----------|--------|
| Node.js + Express | React 18 + Vite | Docker + Compose |
| TypeScript | TypeScript | PostgreSQL |
| Prisma ORM | Tailwind CSS | Supabase |
| Zod + bcrypt | Axios + React Hot Toast | Vercel + Render |
| JWT + API Keys | Lucide Icons | Swagger UI |

</div>

---

## 🚀 التشغيل السريع

### Docker (موصى به)

```bash
docker compose up --build
```

| الخدمة | الرابط |
|--------|--------|
| لوحة التحكم | http://localhost |
| Backend API | http://localhost:3000 |
| Swagger Docs | http://localhost:3000/api-docs |

### Development

**Backend:**
```bash
cd backend
npm install
cp .env.example .env
npx prisma generate && npx prisma db push
npx ts-node prisma/seed.ts
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 👤 الحساب التجريبي

| الحقل | القيمة |
|-------|--------|
| البريد | `demo@storemanager.local` |
| كلمة المرور | `Demo@1234` |

---

## 📁 هيكل المشروع

```
store-manager/
├── backend/                # Express + TypeScript API
│   ├── src/
│   │   ├── controllers/    # منطق العمل
│   │   ├── middleware/     # Auth, Rate Limit, Errors
│   │   ├── routes/        # API Routes + v1
│   │   ├── validators/    # Zod Schemas
│   │   └── utils/         # Helpers
│   ├── prisma/            # Schema + Seed
│   └── tests/             # Jest Tests
├── frontend/               # React + Vite SPA
│   ├── src/
│   │   ├── pages/         # Dashboard, Products, Orders...
│   │   ├── components/    # UI Components
│   │   ├── api/           # Axios Client
│   │   └── contexts/      # Auth Context
│   └── vite.config.ts
├── docker-compose.yml
└── DEPLOYMENT.md           # دليل النشر
```

---

## 🔌 API (n8n Integration)

```bash
# فحص توفر منتج
curl -H "x-api-key: YOUR_KEY" "http://localhost:3000/api/v1/products/check?name=Smartphone"

# جلب سعر التوصيل
curl -H "x-api-key: YOUR_KEY" "http://localhost:3000/api/v1/delivery/rate?wilaya=19&delivery_type=home"

# إنشاء طلب
curl -X POST -H "x-api-key: YOUR_KEY" -H "Content-Type: application/json" \
  -d '{"customer_name":"محمد","customer_phone":"0550123456","wilaya_code":"19","product_id":1,"quantity":2}' \
  http://localhost:3000/api/v1/orders
```

> ⚠️ **أمان**: الأسعار تُحسب تلقائيًا من قاعدة البيانات — أي سعر في Request Body يتم تجاهله.

---

## 🧪 الاختبارات

```bash
cd backend && npm test
```

تغطي: المصادقة • عزل المستخدمين • خصم المخزون • إلغاء الطلبات • Race Conditions

---

## 🔄 سيناريو n8n

```
WhatsApp/Telegram → AI Parser → فحص المنتج → جلب السعر → إنشاء الطلب → تأكيد للعميل
```

---

## 📄 التوثيق

- [DEPLOYMENT.md](./DEPLOYMENT.md) — دليل النشر على Render + Vercel
- [API Docs](http://localhost:3000/api-docs) — Swagger التفاعلي
