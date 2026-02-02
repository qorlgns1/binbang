import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

import { PrismaClient } from '@/generated/prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? '',
});

const prisma = new PrismaClient({ adapter });

const mockUsers = [
  { email: 'admin@example.com', name: '관리자', role: 'ADMIN' as const },
  { email: 'user1@example.com', name: '김철수' },
  { email: 'user2@example.com', name: '이영희' },
  { email: 'user3@example.com', name: '박지민' },
  { email: 'user4@example.com', name: '최수진' },
  { email: 'user5@example.com', name: '정민호' },
];

async function main() {
  console.log('🌱 Seeding database...');

  for (const userData of mockUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        name: userData.name,
        role: userData.role ?? 'USER',
      },
    });
    console.log(`✅ Upserted user: ${user.email} (${user.role})`);
  }

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
