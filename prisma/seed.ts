import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

import { Platform, PrismaClient } from '@/generated/prisma/client';

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

const seedAccommodationUrls = [
  'https://www.agoda.com/ko-kr/citadines-bastille-marais-paris/hotel/paris-fr.html?countryId=153&finalPriceView=1&isShowMobileAppPrice=false&cid=-1&numberOfBedrooms=&familyMode=false&adults=2&children=0&rooms=1&maxRooms=0&checkIn=2026-08-19&isCalendarCallout=false&childAges=&numberOfGuest=0&missingChildAges=false&travellerType=1&showReviewSubmissionEntry=false&currencyCode=KRW&isFreeOccSearch=false&flightSearchCriteria=[object%20Object]&los=3&searchrequestid=7a2fe157-1614-491b-b20d-566305de114b',
  'https://www.agoda.com/ko-kr/hotel-splendid_2/hotel/paris-fr.html?countryId=153&finalPriceView=1&isShowMobileAppPrice=false&cid=-1&numberOfBedrooms=&familyMode=false&adults=2&children=0&rooms=1&maxRooms=0&checkIn=2026-08-19&isCalendarCallout=false&childAges=&numberOfGuest=0&missingChildAges=false&travellerType=1&showReviewSubmissionEntry=false&currencyCode=KRW&isFreeOccSearch=false&flightSearchCriteria=[object%20Object]&los=3&searchrequestid=3f2da6f0-fc79-4837-9e04-9aadd8ab8e89',
  'https://www.agoda.com/ko-kr/citizenm-paris-charles-de-gaulle-airport/hotel/paris-fr.html?countryId=153&finalPriceView=1&isShowMobileAppPrice=false&cid=-1&numberOfBedrooms=&familyMode=false&adults=2&children=0&rooms=1&maxRooms=0&checkIn=2026-08-19&isCalendarCallout=false&childAges=&numberOfGuest=0&missingChildAges=false&travellerType=1&showReviewSubmissionEntry=false&currencyCode=KRW&isFreeOccSearch=false&flightSearchCriteria=[object%20Object]&tspTypes=2&los=3&searchrequestid=3f2da6f0-fc79-4837-9e04-9aadd8ab8e89',
  'https://www.agoda.com/ko-kr/hotel-fertel-etoile/hotel/paris-fr.html?countryId=153&finalPriceView=1&isShowMobileAppPrice=false&cid=-1&numberOfBedrooms=&familyMode=false&adults=2&children=0&rooms=1&maxRooms=0&checkIn=2026-08-19&isCalendarCallout=false&childAges=&numberOfGuest=0&missingChildAges=false&travellerType=1&showReviewSubmissionEntry=false&currencyCode=KRW&isFreeOccSearch=false&flightSearchCriteria=[object%20Object]&tspTypes=2&los=3&searchrequestid=3f2da6f0-fc79-4837-9e04-9aadd8ab8e89',
  'https://www.agoda.com/ko-kr/aparthotel-adagio-paris-tour-eiffel/hotel/paris-fr.html?countryId=153&finalPriceView=1&isShowMobileAppPrice=false&cid=-1&numberOfBedrooms=&familyMode=false&adults=2&children=0&rooms=1&maxRooms=0&checkIn=2026-08-19&isCalendarCallout=false&childAges=&numberOfGuest=0&missingChildAges=false&travellerType=1&showReviewSubmissionEntry=false&currencyCode=KRW&isFreeOccSearch=false&flightSearchCriteria=[object%20Object]&tspTypes=9&los=3&searchrequestid=3f2da6f0-fc79-4837-9e04-9aadd8ab8e89',
  'https://www.agoda.com/ko-kr/hotel-du-collectionneur-arc-de-triomphe/hotel/paris-fr.html?countryId=153&finalPriceView=1&isShowMobileAppPrice=false&cid=-1&numberOfBedrooms=&familyMode=false&adults=2&children=0&rooms=1&maxRooms=0&checkIn=2026-08-19&isCalendarCallout=false&childAges=&numberOfGuest=0&missingChildAges=false&travellerType=1&showReviewSubmissionEntry=false&currencyCode=KRW&isFreeOccSearch=false&flightSearchCriteria=[object%20Object]&tspTypes=5&los=3&searchrequestid=3f2da6f0-fc79-4837-9e04-9aadd8ab8e89',
  'https://www.agoda.com/ko-kr/mercure-paris-centre-tour-eiffel/hotel/paris-fr.html?countryId=153&finalPriceView=1&isShowMobileAppPrice=false&cid=-1&numberOfBedrooms=&familyMode=false&adults=2&children=0&rooms=1&maxRooms=0&checkIn=2026-08-19&isCalendarCallout=false&childAges=&numberOfGuest=0&missingChildAges=false&travellerType=1&showReviewSubmissionEntry=false&currencyCode=KRW&isFreeOccSearch=false&flightSearchCriteria=[object%20Object]&los=3&searchrequestid=3f2da6f0-fc79-4837-9e04-9aadd8ab8e89',
  'https://www.agoda.com/ko-kr/oden-ivry/hotel/ivry-sur-seine-fr.html?countryId=153&finalPriceView=1&isShowMobileAppPrice=false&cid=-1&numberOfBedrooms=&familyMode=false&adults=2&children=0&rooms=1&maxRooms=0&checkIn=2026-08-19&isCalendarCallout=false&childAges=&numberOfGuest=0&missingChildAges=false&travellerType=1&showReviewSubmissionEntry=false&currencyCode=KRW&isFreeOccSearch=false&flightSearchCriteria=[object%20Object]&tspTypes=6&los=3&searchrequestid=3f2da6f0-fc79-4837-9e04-9aadd8ab8e89',
  'https://www.agoda.com/ko-kr/first-hotel-paris-tour-eiffel/hotel/paris-fr.html?countryId=153&finalPriceView=1&isShowMobileAppPrice=false&cid=-1&numberOfBedrooms=&familyMode=false&adults=2&children=0&rooms=1&maxRooms=0&checkIn=2026-08-19&isCalendarCallout=false&childAges=&numberOfGuest=0&missingChildAges=false&travellerType=1&showReviewSubmissionEntry=false&currencyCode=KRW&isFreeOccSearch=false&flightSearchCriteria=[object%20Object]&los=3&searchrequestid=3f2da6f0-fc79-4837-9e04-9aadd8ab8e89',
  'https://www.agoda.com/ko-kr/hotel-home-latin/hotel/paris-fr.html?countryId=153&finalPriceView=1&isShowMobileAppPrice=false&cid=-1&numberOfBedrooms=&familyMode=false&adults=2&children=0&rooms=1&maxRooms=0&checkIn=2026-08-19&isCalendarCallout=false&childAges=&numberOfGuest=0&missingChildAges=false&travellerType=1&showReviewSubmissionEntry=false&currencyCode=KRW&isFreeOccSearch=false&flightSearchCriteria=[object%20Object]&tspTypes=2&los=3&searchrequestid=3f2da6f0-fc79-4837-9e04-9aadd8ab8e89',
  'https://www.agoda.com/ko-kr/citadines-tour-eiffel-paris/hotel/paris-fr.html?countryId=153&finalPriceView=1&isShowMobileAppPrice=false&cid=-1&numberOfBedrooms=&familyMode=false&adults=2&children=0&rooms=1&maxRooms=0&checkIn=2026-08-19&isCalendarCallout=false&childAges=&numberOfGuest=0&missingChildAges=false&travellerType=1&showReviewSubmissionEntry=false&currencyCode=KRW&isFreeOccSearch=false&flightSearchCriteria=[object%20Object]&los=3&searchrequestid=3f2da6f0-fc79-4837-9e04-9aadd8ab8e89',
  'https://www.agoda.com/ko-kr/ibis-paris-tour-eiffel-cambronne-15eme/hotel/paris-fr.html?countryId=153&finalPriceView=1&isShowMobileAppPrice=false&cid=-1&numberOfBedrooms=&familyMode=false&adults=2&children=0&rooms=1&maxRooms=0&checkIn=2026-08-19&isCalendarCallout=false&childAges=&numberOfGuest=0&missingChildAges=false&travellerType=1&showReviewSubmissionEntry=false&currencyCode=KRW&isFreeOccSearch=false&flightSearchCriteria=[object%20Object]&tspTypes=9&los=3&searchrequestid=3f2da6f0-fc79-4837-9e04-9aadd8ab8e89',
  'https://www.airbnb.co.kr/rooms/53715390?check_in=2026-02-17&check_out=2026-02-20&search_mode=regular_search&source_impression_id=p3_1770120294_P3UJgnMH7nuJu0T3&previous_page_section_name=1000&federated_search_id=3361c20f-007c-43cb-a4c4-3eb3cc6eb0e8',
  'https://www.airbnb.co.kr/rooms/868339047183852861?check_in=2026-02-17&check_out=2026-02-20&search_mode=regular_search&source_impression_id=p3_1770120294_P3HJ4flpW1Gq1a4S&previous_page_section_name=1000&federated_search_id=3361c20f-007c-43cb-a4c4-3eb3cc6eb0e8',
  'https://www.airbnb.co.kr/rooms/17297515?check_in=2026-02-17&check_out=2026-02-20&search_mode=regular_search&source_impression_id=p3_1770120294_P3Ha8exfO2FNNtD8&previous_page_section_name=1000&federated_search_id=3361c20f-007c-43cb-a4c4-3eb3cc6eb0e8',
  'https://www.airbnb.co.kr/rooms/1606145865212729624?check_in=2026-02-17&check_out=2026-02-20&search_mode=regular_search&source_impression_id=p3_1770120294_P3Hvv1wmHfLgXebj&previous_page_section_name=1000&federated_search_id=3361c20f-007c-43cb-a4c4-3eb3cc6eb0e8',
  'https://www.airbnb.co.kr/rooms/1249656444561231380?check_in=2026-02-17&check_out=2026-02-20&search_mode=regular_search&source_impression_id=p3_1770120294_P3mNgBogfPlH7RKq&previous_page_section_name=1000&federated_search_id=3361c20f-007c-43cb-a4c4-3eb3cc6eb0e8',
  'https://www.airbnb.co.kr/rooms/650237323606561424?check_in=2026-02-17&check_out=2026-02-20&search_mode=regular_search&source_impression_id=p3_1770120294_P387cbQjZ6nv0gNd&previous_page_section_name=1000&federated_search_id=3361c20f-007c-43cb-a4c4-3eb3cc6eb0e8',
  'https://www.airbnb.co.kr/rooms/877951015453398830?check_in=2026-02-17&check_out=2026-02-20&search_mode=regular_search&source_impression_id=p3_1770120294_P3fUKohhNXMO4hcb&previous_page_section_name=1000&federated_search_id=3361c20f-007c-43cb-a4c4-3eb3cc6eb0e8',
  'https://www.airbnb.co.kr/rooms/1369309130430707931?check_in=2026-02-17&check_out=2026-02-20&search_mode=regular_search&source_impression_id=p3_1770120294_P3K5qmiVGj53wqJT&previous_page_section_name=1000&federated_search_id=3361c20f-007c-43cb-a4c4-3eb3cc6eb0e8',
  'https://www.airbnb.co.kr/rooms/1607001066760941183?check_in=2026-02-17&check_out=2026-02-20&search_mode=regular_search&source_impression_id=p3_1770120294_P3PSL9MLnZU6qdiB&previous_page_section_name=1000&federated_search_id=3361c20f-007c-43cb-a4c4-3eb3cc6eb0e8',
  'https://www.airbnb.co.kr/rooms/1570236741895335112?check_in=2026-02-17&check_out=2026-02-20&search_mode=regular_search&source_impression_id=p3_1770120294_P3BhCwhfA2ZZR0R9&previous_page_section_name=1000&federated_search_id=3361c20f-007c-43cb-a4c4-3eb3cc6eb0e8',
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

const DEFAULT_SEED_USER = mockUsers[0].email;

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomFutureDate = (minDays: number, maxDays: number) => {
  const daysFromNow = randomInt(minDays, maxDays);
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(0, 0, 0, 0);
  return date;
};

const toTitle = (value: string) =>
  value
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();

const inferNameFromUrl = (value: string) => {
  try {
    const url = new URL(value);
    const parts = url.pathname.split('/').filter(Boolean);
    const localePattern = /^[a-z]{2}-[a-z]{2}$/i;
    if (parts[0] === 'rooms' && parts[1]) {
      return `Airbnb ${parts[1]}`;
    }

    const slug = parts.length >= 2 && localePattern.test(parts[0]) ? parts[1] : parts[0];
    return slug ? toTitle(slug) : '숙소';
  } catch {
    return '숙소';
  }
};

const inferPlatformFromUrl = (value: string) => {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    // Treat known Agoda hostnames as Agoda; everything else defaults to Airbnb.
    const agodaHosts = ['agoda.com', 'www.agoda.com'];
    return agodaHosts.includes(host) ? Platform.AGODA : Platform.AIRBNB;
  } catch {
    // On invalid URLs, fall back to Airbnb to preserve previous default behavior.
    return Platform.AIRBNB;
  }
};

const baseAccommodationUrl = (value: string) => {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return null;
  }
};

const formatDate = (value: Date) => value.toISOString().slice(0, 10);

const applyRandomDatesToUrl = (value: string, checkIn: Date, checkOut: Date) => {
  try {
    const url = new URL(value);
    const checkInText = formatDate(checkIn);
    const checkOutText = formatDate(checkOut);
    const nights = Math.max(
      1,
      Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)),
    );

    const host = url.hostname.toLowerCase();
    const agodaHosts = ['agoda.com', 'www.agoda.com'];
    if (agodaHosts.includes(host)) {
      url.searchParams.set('checkIn', checkInText);
      url.searchParams.set('los', String(nights));
      return url.toString();
    }

    url.searchParams.set('check_in', checkInText);
    url.searchParams.set('check_out', checkOutText);
    return url.toString();
  } catch {
    return value;
  }
};

const inferAdultsFromUrl = (value: string) => {
  try {
    const url = new URL(value);
    const adults = Number(url.searchParams.get('adults'));
    return Number.isFinite(adults) && adults > 0 ? adults : 2;
  } catch {
    return 2;
  }
};

async function main() {
  console.log('🌱 Seeding database...');

  const seedUserEmail = process.env.SEED_USER_EMAIL ?? DEFAULT_SEED_USER;
  const seedUserName = process.env.SEED_USER_NAME ?? 'Seed User';

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

  const seedUser = await prisma.user.upsert({
    where: { email: seedUserEmail },
    update: {},
    create: {
      email: seedUserEmail,
      name: seedUserName,
      role: 'USER',
    },
  });
  console.log(`👤 Seed accommodations owner: ${seedUser.email}`);

  for (const url of seedAccommodationUrls) {
    const baseUrl = baseAccommodationUrl(url);
    const existing = await prisma.accommodation.findFirst({
      where: baseUrl
        ? {
            userId: seedUser.id,
            url: { startsWith: baseUrl },
          }
        : {
            userId: seedUser.id,
            url,
          },
      select: { id: true },
    });

    if (existing) {
      console.log(`↩️ Skip accommodation (exists): ${url}`);
      continue;
    }

    const checkIn = randomFutureDate(10, 120);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + randomInt(2, 5));
    const normalizedUrl = applyRandomDatesToUrl(url, checkIn, checkOut);

    await prisma.accommodation.create({
      data: {
        userId: seedUser.id,
        name: inferNameFromUrl(url),
        platform: inferPlatformFromUrl(url),
        url: normalizedUrl,
        checkIn,
        checkOut,
        adults: inferAdultsFromUrl(url),
      },
    });

    console.log(`🏨 Created accommodation: ${url}`);
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
