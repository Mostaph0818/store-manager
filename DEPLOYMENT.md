# دليل نشر المشروع على الإنترنت

## 📋 المطلوب قبل النشر

1. **حساب GitHub** — المشروع لازم يكون على GitHub
2. **حساب Vercel** — https://vercel.com (مجاني)
3. **حساب Render** — https://render.com (مجاني)
4. **Supabase** — قاعدة البيانات موجودة عندك ✅

---

## 🚀 الخطوة 1: رفع المشروع على GitHub

```bash
cd store-manager
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/store-manager.git
git push -u origin main
```

---

## 🎯 الخطوة 2: نشر Backend على Render

1. سجّل دخول على [Render.com](https://render.com)
2. اضغط **New** → **Web Service**
3. اختر **GitHub** واتصل بالمشروع
4. أضف الإعدادات:

| الحقل | القيمة |
|-------|--------|
| **Name** | `store-manager-api` |
| **Runtime** | `Node` |
| **Build Command** | `cd backend && npm install && npx prisma generate && npx prisma db push` |
| **Start Command** | `cd backend && node dist/app.js` |
| **Plan** | `Free` |

5. أضف **Environment Variables**:

```
NODE_ENV=production
DATABASE_URL=your-supabase-postgresql-connection-string
DIRECT_URL=your-supabase-postgresql-connection-string
JWT_SECRET=<اختر كلمة سر عشوائية طويلة 32+ حرف>
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=555214512453-atinkrgrnpml40cs2kql7anl5ma5posl.apps.googleusercontent.com
CORS_ORIGIN=https://YOUR-VERCEL-URL.vercel.app
FRONTEND_URL=https://YOUR-VERCEL-URL.vercel.app
```

6. اضغط **Create Web Service**
7. انتظر حتى يكمل البناء (2-5 دقائق)
8. **انسخ الرابط** — سيكون شيء مثل: `https://store-manager-api.onrender.com`

---

## 🎯 الخطوة 3: نشر Frontend على Vercel

1. سجّل دخول على [Vercel.com](https://vercel.com)
2. اضغط **Add New** → **Project**
3. اختر **GitHub** واتصل بالمشروع
4. أضف الإعدادات:

| الحقل | القيمة |
|-------|--------|
| **Framework** | `Vite` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

5. أضف **Environment Variable**:

```
VITE_API_URL=https://store-manager-api.onrender.com/api
```

6. اضغط **Deploy**
7. انتظر حتى يكمل (1-2 دقيقة)
8. **انسخ الرابط** — سيكون شيء مثل: `https://store-manager-xyz.vercel.app`

---

## 🔄 الخطوة 4: تحديث CORS في Backend

بعد ما تحصل على رابط Vercel:

1. روح على [Render Dashboard](https://dashboard.render.com)
2. اختر المشروع `store-manager-api`
3. روح على **Environment** tabs
4. حدّث القيم:

```
CORS_ORIGIN=https://YOUR-VERCEL-URL.vercel.app
FRONTEND_URL=https://YOUR-VERCEL-URL.vercel.app
```

5. اضغط **Save** — Render غادييعيد تشغيل الخادم تلقائياً

---

## ✅ الخطوة 5: التحقق

1. افتح رابط Vercel
2. جرّب تسجيل الدخول
3. جرّب إضافة منتج
4. جرّب إنشاء طلب

---

## 🔧 مشاكل شائعة

### 1. "Failed to fetch" أو CORS Error
- تأكد أن `CORS_ORIGIN` في Render يطابق رابط Vercel بالضبط
- تأكد أن الرابط يبدأ بـ `https://`

### 2. Backend ما كيبدأش
- شوف Logs في Render Dashboard
- تأكد أن DATABASE_URL صحيح

### 3. Google Sign-In ما كيشتغلش
- روح على [Google Cloud Console](https://console.cloud.google.com)
- أضف رابط Vercel في **Authorized JavaScript origins**

---

## 📝 ملاحظات

- **Render Free Tier**: الخادم كيتنعّم بعد 15 دقيقة ديال عدم النشاط — أول طلب غادي ياخذ 30-60 ثانية
- **Vercel Free Tier**: محدود لكن كافٍ لهذا المشروع
- **الرابط النهائي**: `https://store-manager.vercel.app` (مثال)
