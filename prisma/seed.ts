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

const systemSettings = [
  // ── Worker 스케줄 ──
  {
    key: 'worker.cronSchedule',
    value: '*/30 * * * *',
    type: 'string',
    category: 'worker',
    description: '숙소 가격을 확인하는 주기 (분 단위)',
  },
  {
    key: 'worker.concurrency',
    value: '1',
    type: 'int',
    category: 'worker',
    description: '한 번에 동시에 확인하는 숙소 수 (서버 부하 방지를 위해 1 권장)',
  },
  {
    key: 'worker.browserPoolSize',
    value: '1',
    type: 'int',
    category: 'worker',
    description: '동시에 열어두는 브라우저 수 (서버 부하 방지를 위해 1 권장)',
  },
  {
    key: 'worker.startupDelayMs',
    value: '10000',
    type: 'int',
    category: 'worker',
    description: '서버 시작 후 첫 가격 확인까지 대기하는 시간',
  },
  {
    key: 'worker.shutdownTimeoutMs',
    value: '60000',
    type: 'int',
    category: 'worker',
    description: '서버 종료 시 진행 중인 작업이 끝나길 기다리는 최대 시간',
  },

  // ── 브라우저 타임아웃 ──
  {
    key: 'browser.navigationTimeoutMs',
    value: '25000',
    type: 'int',
    category: 'browser',
    description: '숙소 페이지가 열릴 때까지 기다리는 최대 시간',
  },
  {
    key: 'browser.contentWaitMs',
    value: '10000',
    type: 'int',
    category: 'browser',
    description: '페이지 내 가격/상태 정보가 표시될 때까지 기다리는 시간',
  },
  {
    key: 'browser.patternRetryMs',
    value: '5000',
    type: 'int',
    category: 'browser',
    description: '가격 정보를 찾지 못했을 때 다시 확인하기까지 대기 시간',
  },
  {
    key: 'browser.protocolTimeoutMs',
    value: '60000',
    type: 'int',
    category: 'browser',
    description: '브라우저와의 통신이 응답 없을 때 포기하는 최대 시간',
  },

  // ── 체크 동작 ──
  {
    key: 'checker.maxRetries',
    value: '2',
    type: 'int',
    category: 'checker',
    description: '숙소 페이지 접속에 실패했을 때 다시 시도하는 최대 횟수',
  },
  {
    key: 'checker.retryDelayMs',
    value: '3000',
    type: 'int',
    category: 'checker',
    description: '재시도 사이에 쉬는 시간',
  },
  {
    key: 'checker.blockResourceTypes',
    value: 'image,media,font',
    type: 'string',
    category: 'checker',
    description: '속도 향상을 위해 불러오지 않는 항목 (image,media,font 등, off 입력 시 모두 불러옴)',
  },

  // ── 모니터링 임계값 ──
  {
    key: 'monitoring.workerHealthyThresholdMs',
    value: '2400000',
    type: 'int',
    category: 'monitoring',
    description: '마지막 작업 후 이 시간 안에 응답이 있으면 "정상" 상태로 표시',
  },
  {
    key: 'monitoring.workerDegradedThresholdMs',
    value: '5400000',
    type: 'int',
    category: 'monitoring',
    description: '마지막 작업 후 이 시간이 지나면 "주의" 상태로 표시 (초과 시 "중단")',
  },

  // ── 알림 ──
  {
    key: 'notification.kakaoTokenRefreshMarginMs',
    value: '300000',
    type: 'int',
    category: 'notification',
    description: '카카오 알림 인증이 만료되기 전 미리 갱신하는 여유 시간',
  },

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

  // SystemSettings seed
  for (const setting of systemSettings) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: { description: setting.description },
      create: setting,
    });
    console.log(`⚙️ Upserted setting: ${setting.key} = ${setting.value || '(empty)'}`);
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
