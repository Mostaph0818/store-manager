import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { ALGERIAN_WILAYAS } from '../src/utils/wilayas';

const prisma = new PrismaClient();

function generateApiKey(): string {
  return `sm_${randomBytes(32).toString('hex')}`;
}

async function main() {
  console.log('🌱 Starting database seed with 69 wilayas...');

  // Create demo user
  const passwordHash = await bcrypt.hash('Demo@1234', 10);
  const apiKey = generateApiKey();

  const user = await prisma.user.upsert({
    where: { email: 'demo@storemanager.local' },
    update: {},
    create: {
      username: 'demo_user',
      email: 'demo@storemanager.local',
      passwordHash,
      apiKey,
    },
  });

  console.log(`✅ Demo user: ${user.email}`);

  // Create default products if not exists
  const products = [
    {
      name: 'هاتف ذكي Smart Pro',
      description: 'هاتف ذكي عالي الأداء مع كاميرا بدقة 108 ميجابكسل',
      costPrice: 25000,
      sellingPrice: 32000,
      stockQuantity: 50,
    },
    {
      name: 'سماعات لاسلكية Wireless Earbuds',
      description: 'سماعات بلوتوث مع خاصية عزل الضوضاء النشط',
      costPrice: 3000,
      sellingPrice: 4500,
      stockQuantity: 120,
    },
    {
      name: 'حامل حاسوب محمول Laptop Stand',
      description: 'حامل ألمنيوم متين قابل لتعديل الارتفاع',
      costPrice: 1200,
      sellingPrice: 2000,
      stockQuantity: 75,
    },
    {
      name: 'شاحن متنقل Power Bank 20000mAh',
      description: 'بطارية سريعة الشحن مع منفذين Type-C و USB',
      costPrice: 2000,
      sellingPrice: 3200,
      stockQuantity: 30,
    },
  ];

  for (const product of products) {
    const existing = await prisma.product.findFirst({
      where: { userId: user.id, name: product.name },
    });

    if (!existing) {
      await prisma.product.create({
        data: {
          userId: user.id,
          ...product,
          isOutOfStock: product.stockQuantity === 0,
        },
      });
    }
  }

  // Update or insert all 69 wilayas
  for (const wilaya of ALGERIAN_WILAYAS) {
    await prisma.deliveryRate.upsert({
      where: {
        userId_wilayaCode: {
          userId: user.id,
          wilayaCode: wilaya.code,
        },
      },
      update: {
        wilayaName: wilaya.name,
      },
      create: {
        userId: user.id,
        wilayaCode: wilaya.code,
        wilayaName: wilaya.name,
        homeDeliveryPrice: 500,
        deskDeliveryPrice: 350,
      },
    });
  }

  console.log(`✅ All ${ALGERIAN_WILAYAS.length} wilayas seeded successfully!`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
