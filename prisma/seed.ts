import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

import { PrismaClient } from '@/generated/prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? '',
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // 예시: 테스트 사용자 생성 (필요 시 주석 해제)
  // const user = await prisma.user.upsert({
  //   where: { email: 'test@example.com' },
  //   update: {},
  //   create: {
  //     email: 'test@example.com',
  //     name: '테스트 사용자',
  //   },
  // });
  // console.log('✅ Created test user:', user.email);

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
