import {
  AvailabilityStatus,
  BillingEventType,
  CaseStatus,
  FormSubmissionStatus,
  NotificationStatus,
  PatternType,
  Platform,
  SelectorCategory,
} from '@/generated/prisma/enums';

import { parseAccommodationUrl } from './url-parser';

/**
 * Seed data should be:
 * - deterministic (re-running seed doesn't create duplicates)
 * - FK-safe (always reference real DB ids resolved at runtime)
 * - minimal (avoid stuffing auto-managed columns into constants)
 */

export const SEED_NOW = new Date('2026-02-04T12:00:00.000Z');

export type SeedUserKey = 'admin' | 'user';

export interface SeedUser {
  key: SeedUserKey;
  email: string;
  name: string;
  roleNames: string[];
  passwordHash: string;
}

export interface SeedAccommodation {
  id: string;
  userKey: SeedUserKey;
  name: string;
  platform: Platform;
  url: string;
  checkIn: Date;
  checkOut: Date;
  adults: number;
  isActive: boolean;
  lastCheck: Date | null;
  lastStatus: AvailabilityStatus;
  lastPrice: string | null;
  lastPriceAmount: number | null;
  lastPriceCurrency: string | null;
}

export interface SeedCheckCycle {
  id: string;
  startedAt: Date;
  completedAt: Date | null;
  durationMs: number | null;
  totalCount: number;
  successCount: number;
  errorCount: number;
  concurrency: number;
  browserPoolSize: number;
  navigationTimeoutMs: number;
  contentWaitMs: number;
  maxRetries: number;
  createdAt: Date;
}

export interface SeedCheckLog {
  id: string;
  accommodationId: string;
  userKey: SeedUserKey;
  status: AvailabilityStatus;
  price: string | null;
  priceAmount: number | null;
  priceCurrency: string | null;
  errorMessage: string | null;
  notificationSent: boolean;
  checkIn: Date | null;
  checkOut: Date | null;
  pricePerNight: number | null;
  cycleId: string | null;
  durationMs: number | null;
  retryCount: number;
  previousStatus: AvailabilityStatus | null;
  createdAt: Date;
}

export interface SeedAccount {
  userKey: SeedUserKey;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token: string | null;
  access_token: string | null;
  expires_at: number | null;
  token_type: string | null;
  scope: string | null;
  id_token: string | null;
  session_state: string | null;
  refresh_token_expires_in: number | null;
}

export interface SeedSession {
  userKey: SeedUserKey;
  sessionToken: string;
  expires: Date;
}

export interface SeedVerificationToken {
  identifier: string;
  token: string;
  expires: Date;
}

export interface SeedWorkerHeartbeat {
  id: string;
  startedAt: Date;
  lastHeartbeatAt: Date;
  isProcessing: boolean;
  schedule: string;
  accommodationsChecked: number;
  lastCycleErrors: number;
  lastCycleDurationMs: number | null;
}

export interface SeedHeartbeatHistory {
  id: number;
  timestamp: Date;
  status: string;
  isProcessing: boolean;
  uptime: number | null;
  workerId: string;
}

export interface SeedSettingsChangeLog {
  id: string;
  settingKey: string;
  oldValue: string;
  newValue: string;
  changedByKey: SeedUserKey;
  createdAt: Date;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function nightsBetween(checkIn: Date, checkOut: Date): number {
  const ms = Math.abs(checkOut.getTime() - checkIn.getTime());
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

// bcrypt hash of "password123" (cost 12)
const SEED_PASSWORD_HASH = '$2b$12$DVhhDBrrl3Lgl8AvRxxpyuvfHzBkSTZHPrIefg7uQlo84F1Q6.diC';

export const SEED_ROLES = [
  { name: 'USER', description: '기본 사용자' },
  { name: 'ADMIN', description: '관리자' },
] as const;

export const SEED_PERMISSIONS = [
  { action: 'admin:access', description: '관리자 페이지 접근', roles: ['ADMIN'] },
  { action: 'users:manage', description: '사용자 관리', roles: ['ADMIN'] },
  { action: 'worker:restart', description: '워커 재시작', roles: ['ADMIN'] },
  { action: 'settings:manage', description: '시스템 설정 관리', roles: ['ADMIN'] },
  { action: 'accommodation:create', description: '숙소 등록', roles: ['USER', 'ADMIN'] },
  { action: 'accommodation:read', description: '숙소 조회', roles: ['USER', 'ADMIN'] },
] as const;

export const SEED_PLANS = [
  { name: 'FREE', description: '무료 플랜', price: 0, interval: 'month', roles: ['USER'] },
  { name: 'PRO', description: '프로 플랜', price: 9900, interval: 'month', roles: ['USER'] },
  { name: 'BIZ', description: '비즈니스 플랜', price: 29900, interval: 'month', roles: ['USER'] },
] as const;

export const SEED_PLAN_QUOTAS = [
  { planName: 'FREE', key: 'MAX_ACCOMMODATIONS' as const, value: 5 },
  { planName: 'FREE', key: 'CHECK_INTERVAL_MIN' as const, value: 30 },
  { planName: 'PRO', key: 'MAX_ACCOMMODATIONS' as const, value: 20 },
  { planName: 'PRO', key: 'CHECK_INTERVAL_MIN' as const, value: 10 },
  { planName: 'BIZ', key: 'MAX_ACCOMMODATIONS' as const, value: 100 },
  { planName: 'BIZ', key: 'CHECK_INTERVAL_MIN' as const, value: 5 },
] as const;

export const SEED_USERS: SeedUser[] = [
  {
    key: 'admin',
    email: 'admin@example.com',
    name: '관리자',
    roleNames: ['USER', 'ADMIN'],
    passwordHash: SEED_PASSWORD_HASH,
  },
  { key: 'user', email: 'user@example.com', name: '김철수', roleNames: ['USER'], passwordHash: SEED_PASSWORD_HASH },
];

export const MOCK_ACCOMMODATIONS_URLS = [
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

export const SEED_ACCOMMODATIONS: SeedAccommodation[] = MOCK_ACCOMMODATIONS_URLS.map((url, index) => {
  const parsed = parseAccommodationUrl(url);
  const checkIn = parsed.checkIn ? new Date(parsed.checkIn) : new Date('2026-02-17T00:00:00.000Z');
  const checkOut = parsed.checkOut ? new Date(parsed.checkOut) : new Date('2026-02-18T00:00:00.000Z');

  return {
    id: `seed_acc_${index + 1}`,
    userKey: 'admin',
    name: parsed.name ?? `Airbnb ${index + 1}`,
    platform: parsed.platform ?? Platform.AIRBNB,
    url: parsed.baseUrl,
    checkIn,
    checkOut,
    adults: parsed.adults ?? 2,
    isActive: true,
    lastCheck: SEED_NOW,
    lastStatus: AvailabilityStatus.UNKNOWN,
    lastPrice: null,
    lastPriceAmount: null,
    lastPriceCurrency: null,
  };
});

export const SEED_CHECK_CYCLES: SeedCheckCycle[] = [
  {
    id: 'seed_cycle_1',
    startedAt: addMinutes(SEED_NOW, -180),
    completedAt: addMinutes(SEED_NOW, -175),
    durationMs: 5 * 60 * 1000,
    totalCount: SEED_ACCOMMODATIONS.length,
    successCount: Math.max(0, SEED_ACCOMMODATIONS.length - 2),
    errorCount: Math.min(2, SEED_ACCOMMODATIONS.length),
    concurrency: 1,
    browserPoolSize: 1,
    navigationTimeoutMs: 25000,
    contentWaitMs: 10000,
    maxRetries: 2,
    createdAt: addMinutes(SEED_NOW, -180),
  },
  {
    id: 'seed_cycle_2',
    startedAt: addMinutes(SEED_NOW, -120),
    completedAt: addMinutes(SEED_NOW, -112),
    durationMs: 8 * 60 * 1000,
    totalCount: SEED_ACCOMMODATIONS.length,
    successCount: Math.max(0, SEED_ACCOMMODATIONS.length - 1),
    errorCount: Math.min(1, SEED_ACCOMMODATIONS.length),
    concurrency: 1,
    browserPoolSize: 1,
    navigationTimeoutMs: 25000,
    contentWaitMs: 10000,
    maxRetries: 2,
    createdAt: addMinutes(SEED_NOW, -120),
  },
  {
    id: 'seed_cycle_3',
    startedAt: addMinutes(SEED_NOW, -60),
    completedAt: addMinutes(SEED_NOW, -52),
    durationMs: 8 * 60 * 1000,
    totalCount: SEED_ACCOMMODATIONS.length,
    successCount: SEED_ACCOMMODATIONS.length,
    errorCount: 0,
    concurrency: 1,
    browserPoolSize: 1,
    navigationTimeoutMs: 25000,
    contentWaitMs: 10000,
    maxRetries: 2,
    createdAt: addMinutes(SEED_NOW, -60),
  },
];

export const SEED_CHECK_LOGS: SeedCheckLog[] = (() => {
  const logs: SeedCheckLog[] = [];

  for (const cycle of SEED_CHECK_CYCLES) {
    for (const acc of SEED_ACCOMMODATIONS) {
      const i = logs.length + 1;
      const nights = nightsBetween(acc.checkIn, acc.checkOut);

      // Deterministic-ish variety: every 7th log is ERROR, every 3rd is UNAVAILABLE, else AVAILABLE.
      let status: AvailabilityStatus = AvailabilityStatus.AVAILABLE;
      let errorMessage: string | null = null;
      let price: string | null = null;
      let priceAmount: number | null = null;
      let priceCurrency: string | null = null;

      if (i % 7 === 0) {
        status = AvailabilityStatus.ERROR;
        errorMessage = 'Mock: 페이지 로딩 실패';
      } else if (i % 3 === 0) {
        status = AvailabilityStatus.UNAVAILABLE;
      } else {
        status = AvailabilityStatus.AVAILABLE;
        priceAmount = 80000 + (i % 10) * 5000 + nights * 1000;
        priceCurrency = 'KRW';
        price = `₩${priceAmount.toLocaleString('en-US')}`;
      }

      const pricePerNight = priceAmount ? Math.round(priceAmount / nights) : null;

      logs.push({
        id: `seed_log_${cycle.id}_${acc.id}`,
        accommodationId: acc.id,
        userKey: acc.userKey,
        status,
        price,
        priceAmount,
        priceCurrency,
        errorMessage,
        notificationSent: false,
        checkIn: acc.checkIn,
        checkOut: acc.checkOut,
        pricePerNight,
        cycleId: cycle.id,
        durationMs: 3000 + (i % 5) * 500,
        retryCount: i % 7 === 0 ? 1 : 0,
        previousStatus: null,
        createdAt: addMinutes(cycle.startedAt, 1 + (i % 5)),
      });
    }
  }

  return logs;
})();

export const SEED_ACCOUNTS: SeedAccount[] = [
  {
    userKey: 'admin',
    type: 'oauth',
    provider: 'kakao',
    providerAccountId: 'kakao_admin_1',
    refresh_token: null,
    access_token: null,
    expires_at: Math.floor(addMinutes(SEED_NOW, 60).getTime() / 1000),
    token_type: 'bearer',
    scope: 'profile_nickname profile_image',
    id_token: null,
    session_state: null,
    refresh_token_expires_in: 60 * 60 * 24 * 30,
  },
  {
    userKey: 'user',
    type: 'oauth',
    provider: 'kakao',
    providerAccountId: 'kakao_user_1',
    refresh_token: null,
    access_token: null,
    expires_at: Math.floor(addMinutes(SEED_NOW, 60).getTime() / 1000),
    token_type: 'bearer',
    scope: 'profile_nickname profile_image',
    id_token: null,
    session_state: null,
    refresh_token_expires_in: 60 * 60 * 24 * 30,
  },
];

export const SEED_SESSIONS: SeedSession[] = [
  { userKey: 'admin', sessionToken: 'mock_session_token_admin', expires: addMinutes(SEED_NOW, 60 * 24 * 30) },
  { userKey: 'user', sessionToken: 'mock_session_token_user', expires: addMinutes(SEED_NOW, 60 * 24 * 30) },
];

export const SEED_VERIFICATION_TOKENS: SeedVerificationToken[] = [
  {
    identifier: 'admin@example.com',
    token: 'mock_verification_token_admin',
    expires: addMinutes(SEED_NOW, 60),
  },
  {
    identifier: 'user@example.com',
    token: 'mock_verification_token_user',
    expires: addMinutes(SEED_NOW, 60),
  },
];

export const SEED_WORKER_HEARTBEAT: SeedWorkerHeartbeat = {
  id: 'singleton',
  startedAt: addMinutes(SEED_NOW, -24 * 60),
  lastHeartbeatAt: SEED_NOW,
  isProcessing: false,
  schedule: '*/30 * * * *',
  accommodationsChecked: SEED_CHECK_LOGS.length,
  lastCycleErrors: SEED_CHECK_CYCLES[SEED_CHECK_CYCLES.length - 1]?.errorCount ?? 0,
  lastCycleDurationMs: SEED_CHECK_CYCLES[SEED_CHECK_CYCLES.length - 1]?.durationMs ?? null,
};

export const SEED_HEARTBEAT_HISTORY: SeedHeartbeatHistory[] = [
  {
    id: 1001,
    timestamp: addMinutes(SEED_NOW, -180),
    status: 'healthy',
    isProcessing: false,
    uptime: 60 * 60 * 12,
    workerId: SEED_WORKER_HEARTBEAT.id,
  },
  {
    id: 1002,
    timestamp: addMinutes(SEED_NOW, -120),
    status: 'processing',
    isProcessing: true,
    uptime: 60 * 60 * 13,
    workerId: SEED_WORKER_HEARTBEAT.id,
  },
  {
    id: 1003,
    timestamp: addMinutes(SEED_NOW, -110),
    status: 'healthy',
    isProcessing: false,
    uptime: 60 * 60 * 13.2,
    workerId: SEED_WORKER_HEARTBEAT.id,
  },
  {
    id: 1004,
    timestamp: addMinutes(SEED_NOW, -70),
    status: 'healthy',
    isProcessing: false,
    uptime: 60 * 60 * 14,
    workerId: SEED_WORKER_HEARTBEAT.id,
  },
  {
    id: 1005,
    timestamp: addMinutes(SEED_NOW, -5),
    status: 'healthy',
    isProcessing: false,
    uptime: 60 * 60 * 15,
    workerId: SEED_WORKER_HEARTBEAT.id,
  },
];

export const SEED_SETTINGS_CHANGE_LOGS: SeedSettingsChangeLog[] = [
  {
    id: 'seed_settings_change_1',
    settingKey: 'worker.cronSchedule',
    oldValue: '*/60 * * * *',
    newValue: '*/30 * * * *',
    changedByKey: 'admin',
    createdAt: addMinutes(SEED_NOW, -200),
  },
  {
    id: 'seed_settings_change_2',
    settingKey: 'worker.concurrency',
    oldValue: '1',
    newValue: '2',
    changedByKey: 'admin',
    createdAt: addMinutes(SEED_NOW, -90),
  },
];

// ============================================
// Form Submissions, Cases, Status Logs, Evidence
// ============================================

const CONSENT_TEXTS_SEED = {
  billing: '조건 충족(열림 확인) 시 비용이 발생함에 동의합니다',
  scope: '서비스는 Q4에 명시된 조건의 충족(열림) 여부만 확인하며, 예약 완료나 결제를 보장하지 않음에 동의합니다',
};

export interface SeedFormSubmission {
  id: string;
  responseId: string;
  status: FormSubmissionStatus;
  rawPayload: Record<string, unknown>;
  extractedFields: Record<string, unknown> | null;
  rejectionReason: string | null;
  consentBillingOnConditionMet: boolean | null;
  consentServiceScope: boolean | null;
  consentCapturedAt: Date | null;
  consentTexts: Record<string, string> | null;
  receivedAt: Date;
}

export interface SeedCase {
  id: string;
  submissionId: string;
  status: CaseStatus;
  assignedToKey: SeedUserKey | null;
  statusChangedByKey: SeedUserKey | null;
  note: string | null;
  ambiguityResult: Record<string, unknown> | null;
  clarificationResolvedAt: Date | null;
  paymentConfirmedAt: Date | null;
  paymentConfirmedByKey: SeedUserKey | null;
  accommodationId: string | null;
  statusChangedAt: Date;
  createdAt: Date;
}

export interface SeedCaseStatusLog {
  id: string;
  caseId: string;
  fromStatus: CaseStatus;
  toStatus: CaseStatus;
  changedByKey: SeedUserKey;
  reason: string | null;
  createdAt: Date;
}

export interface SeedConditionMetEvent {
  id: string;
  caseId: string;
  checkLogId: string;
  evidenceSnapshot: Record<string, unknown>;
  screenshotBase64: string | null;
  capturedAt: Date;
  createdAt: Date;
}

export interface SeedBillingEvent {
  id: string;
  caseId: string;
  type: BillingEventType;
  conditionMetEventId: string;
  amountKrw: number;
  description: string | null;
  createdAt: Date;
}

export interface SeedCaseNotification {
  id: string;
  caseId: string;
  channel: string;
  status: NotificationStatus;
  payload: Record<string, unknown>;
  sentAt: Date | null;
  failReason: string | null;
  retryCount: number;
  maxRetries: number;
  idempotencyKey: string;
  createdAt: Date;
}

function makeSubmissionPayload(
  targetUrl: string,
  conditionDefinition: string,
): { rawPayload: Record<string, unknown>; extractedFields: Record<string, unknown> } {
  const fields = {
    contact_channel: '카카오톡',
    contact_value: 'user_kakao_test',
    target_url: targetUrl,
    condition_definition: conditionDefinition,
    request_window: '2026-03-01',
    check_frequency: '30분',
    billing_consent: true,
    scope_consent: true,
  };
  return { rawPayload: fields, extractedFields: fields };
}

// 6건: 5 PROCESSED + 1 REJECTED
export const SEED_FORM_SUBMISSIONS: SeedFormSubmission[] = (() => {
  const recvTime = addMinutes(SEED_NOW, -7 * 24 * 60);

  const s1 = makeSubmissionPayload(
    SEED_ACCOMMODATIONS[0].url,
    '2인 기준 파리 에어비앤비 1박 15만원 이하로 예약 가능 상태가 되면 알려주세요',
  );
  const s2 = makeSubmissionPayload(SEED_ACCOMMODATIONS[1].url, '적당한 가격에 파리 숙소 2인 예약 가능하면 알려주세요');
  const s3 = makeSubmissionPayload(
    SEED_ACCOMMODATIONS[2].url,
    '2인 기준 아고다 파리 호텔 1박 20만원 이하로 예약 가능하면 알려주세요',
  );
  const s4 = makeSubmissionPayload(
    SEED_ACCOMMODATIONS[0].url,
    '성인 2명 기준 1박 25만원 이하로 빈 방 나오면 바로 알림 부탁드립니다',
  );
  const s5 = makeSubmissionPayload(
    SEED_ACCOMMODATIONS[1].url,
    '2인 기준 파리 호텔 총 3박 60만원 이하로 예약 가능해지면 알려주세요',
  );

  return [
    {
      id: 'seed_submission_1',
      responseId: 'seed_response_1',
      status: FormSubmissionStatus.PROCESSED,
      ...s1,
      rejectionReason: null,
      consentBillingOnConditionMet: true,
      consentServiceScope: true,
      consentCapturedAt: recvTime,
      consentTexts: CONSENT_TEXTS_SEED,
      receivedAt: recvTime,
    },
    {
      id: 'seed_submission_2',
      responseId: 'seed_response_2',
      status: FormSubmissionStatus.PROCESSED,
      ...s2,
      rejectionReason: null,
      consentBillingOnConditionMet: true,
      consentServiceScope: true,
      consentCapturedAt: addMinutes(recvTime, 5),
      consentTexts: CONSENT_TEXTS_SEED,
      receivedAt: addMinutes(recvTime, 5),
    },
    {
      id: 'seed_submission_3',
      responseId: 'seed_response_3',
      status: FormSubmissionStatus.PROCESSED,
      ...s3,
      rejectionReason: null,
      consentBillingOnConditionMet: true,
      consentServiceScope: true,
      consentCapturedAt: addMinutes(recvTime, 10),
      consentTexts: CONSENT_TEXTS_SEED,
      receivedAt: addMinutes(recvTime, 10),
    },
    {
      id: 'seed_submission_4',
      responseId: 'seed_response_4',
      status: FormSubmissionStatus.PROCESSED,
      ...s4,
      rejectionReason: null,
      consentBillingOnConditionMet: true,
      consentServiceScope: true,
      consentCapturedAt: addMinutes(recvTime, 15),
      consentTexts: CONSENT_TEXTS_SEED,
      receivedAt: addMinutes(recvTime, 15),
    },
    {
      id: 'seed_submission_5',
      responseId: 'seed_response_5',
      status: FormSubmissionStatus.PROCESSED,
      ...s5,
      rejectionReason: null,
      consentBillingOnConditionMet: true,
      consentServiceScope: true,
      consentCapturedAt: addMinutes(recvTime, 20),
      consentTexts: CONSENT_TEXTS_SEED,
      receivedAt: addMinutes(recvTime, 20),
    },
    {
      id: 'seed_submission_6',
      responseId: 'seed_response_6',
      status: FormSubmissionStatus.REJECTED,
      rawPayload: {
        contact_channel: '카카오톡',
        contact_value: 'user_kakao_rejected',
        target_url: SEED_ACCOMMODATIONS[3].url,
        condition_definition: '파리 숙소 아무거나 빈 방 있으면 알려주세요',
        request_window: '2026-03-01',
        check_frequency: '30분',
        billing_consent: false,
        scope_consent: true,
      },
      extractedFields: null,
      rejectionReason: 'billing_consent: Expected literal `true`, received `false`',
      consentBillingOnConditionMet: null,
      consentServiceScope: null,
      consentCapturedAt: null,
      consentTexts: null,
      receivedAt: addMinutes(recvTime, 25),
    },
  ];
})();

// 5건: 각 파이프라인 단계별 1건씩
export const SEED_CASES: SeedCase[] = [
  {
    id: 'seed_case_1',
    submissionId: 'seed_submission_1',
    status: CaseStatus.RECEIVED,
    assignedToKey: null,
    statusChangedByKey: 'admin',
    note: null,
    ambiguityResult: { severity: 'GREEN', missingSlots: [], ambiguousTerms: [] },
    clarificationResolvedAt: null,
    paymentConfirmedAt: null,
    paymentConfirmedByKey: null,
    accommodationId: null,
    statusChangedAt: addMinutes(SEED_NOW, -6 * 24 * 60),
    createdAt: addMinutes(SEED_NOW, -6 * 24 * 60),
  },
  {
    id: 'seed_case_2',
    submissionId: 'seed_submission_2',
    status: CaseStatus.NEEDS_CLARIFICATION,
    assignedToKey: 'admin',
    statusChangedByKey: 'admin',
    note: '모호 표현 "적당한" — 구체적 가격 범위 확인 필요',
    ambiguityResult: { severity: 'AMBER', missingSlots: ['가격 조건'], ambiguousTerms: ['적당한'] },
    clarificationResolvedAt: null,
    paymentConfirmedAt: null,
    paymentConfirmedByKey: null,
    accommodationId: null,
    statusChangedAt: addMinutes(SEED_NOW, -5 * 24 * 60 + 120),
    createdAt: addMinutes(SEED_NOW, -5 * 24 * 60),
  },
  {
    id: 'seed_case_3',
    submissionId: 'seed_submission_3',
    status: CaseStatus.WAITING_PAYMENT,
    assignedToKey: 'admin',
    statusChangedByKey: 'admin',
    note: null,
    ambiguityResult: { severity: 'GREEN', missingSlots: [], ambiguousTerms: [] },
    clarificationResolvedAt: null,
    paymentConfirmedAt: null,
    paymentConfirmedByKey: null,
    accommodationId: null,
    statusChangedAt: addMinutes(SEED_NOW, -4 * 24 * 60 + 120),
    createdAt: addMinutes(SEED_NOW, -4 * 24 * 60),
  },
  {
    id: 'seed_case_4',
    submissionId: 'seed_submission_4',
    status: CaseStatus.ACTIVE_MONITORING,
    assignedToKey: 'admin',
    statusChangedByKey: 'admin',
    note: null,
    ambiguityResult: { severity: 'GREEN', missingSlots: [], ambiguousTerms: [] },
    clarificationResolvedAt: null,
    paymentConfirmedAt: addMinutes(SEED_NOW, -3 * 24 * 60),
    paymentConfirmedByKey: 'admin',
    accommodationId: 'seed_acc_1',
    statusChangedAt: addMinutes(SEED_NOW, -3 * 24 * 60 + 60),
    createdAt: addMinutes(SEED_NOW, -3 * 24 * 60 - 2 * 24 * 60),
  },
  {
    id: 'seed_case_5',
    submissionId: 'seed_submission_5',
    status: CaseStatus.CONDITION_MET,
    assignedToKey: 'admin',
    statusChangedByKey: 'admin',
    note: '조건 충족 확인 — 증거 패킷 생성됨',
    ambiguityResult: { severity: 'GREEN', missingSlots: [], ambiguousTerms: [] },
    clarificationResolvedAt: null,
    paymentConfirmedAt: addMinutes(SEED_NOW, -4 * 24 * 60),
    paymentConfirmedByKey: 'admin',
    accommodationId: 'seed_acc_2',
    statusChangedAt: addMinutes(SEED_NOW, -2 * 24 * 60),
    createdAt: addMinutes(SEED_NOW, -4 * 24 * 60 - 3 * 24 * 60),
  },
];

export const SEED_CASE_STATUS_LOGS: SeedCaseStatusLog[] = [
  // Case 1: RECEIVED only
  {
    id: 'seed_cslog_1_1',
    caseId: 'seed_case_1',
    fromStatus: CaseStatus.RECEIVED,
    toStatus: CaseStatus.RECEIVED,
    changedByKey: 'admin',
    reason: '케이스 생성',
    createdAt: addMinutes(SEED_NOW, -6 * 24 * 60),
  },
  // Case 2: RECEIVED → REVIEWING → NEEDS_CLARIFICATION
  {
    id: 'seed_cslog_2_1',
    caseId: 'seed_case_2',
    fromStatus: CaseStatus.RECEIVED,
    toStatus: CaseStatus.RECEIVED,
    changedByKey: 'admin',
    reason: '케이스 생성',
    createdAt: addMinutes(SEED_NOW, -5 * 24 * 60),
  },
  {
    id: 'seed_cslog_2_2',
    caseId: 'seed_case_2',
    fromStatus: CaseStatus.RECEIVED,
    toStatus: CaseStatus.REVIEWING,
    changedByKey: 'admin',
    reason: null,
    createdAt: addMinutes(SEED_NOW, -5 * 24 * 60 + 60),
  },
  {
    id: 'seed_cslog_2_3',
    caseId: 'seed_case_2',
    fromStatus: CaseStatus.REVIEWING,
    toStatus: CaseStatus.NEEDS_CLARIFICATION,
    changedByKey: 'admin',
    reason: 'AMBER: 모호 표현 감지 — 명확화 요청',
    createdAt: addMinutes(SEED_NOW, -5 * 24 * 60 + 120),
  },
  // Case 3: RECEIVED → REVIEWING → WAITING_PAYMENT
  {
    id: 'seed_cslog_3_1',
    caseId: 'seed_case_3',
    fromStatus: CaseStatus.RECEIVED,
    toStatus: CaseStatus.RECEIVED,
    changedByKey: 'admin',
    reason: '케이스 생성',
    createdAt: addMinutes(SEED_NOW, -4 * 24 * 60),
  },
  {
    id: 'seed_cslog_3_2',
    caseId: 'seed_case_3',
    fromStatus: CaseStatus.RECEIVED,
    toStatus: CaseStatus.REVIEWING,
    changedByKey: 'admin',
    reason: null,
    createdAt: addMinutes(SEED_NOW, -4 * 24 * 60 + 60),
  },
  {
    id: 'seed_cslog_3_3',
    caseId: 'seed_case_3',
    fromStatus: CaseStatus.REVIEWING,
    toStatus: CaseStatus.WAITING_PAYMENT,
    changedByKey: 'admin',
    reason: null,
    createdAt: addMinutes(SEED_NOW, -4 * 24 * 60 + 120),
  },
  // Case 4: RECEIVED → REVIEWING → WAITING_PAYMENT → payment → ACTIVE_MONITORING
  {
    id: 'seed_cslog_4_1',
    caseId: 'seed_case_4',
    fromStatus: CaseStatus.RECEIVED,
    toStatus: CaseStatus.RECEIVED,
    changedByKey: 'admin',
    reason: '케이스 생성',
    createdAt: addMinutes(SEED_NOW, -5 * 24 * 60),
  },
  {
    id: 'seed_cslog_4_2',
    caseId: 'seed_case_4',
    fromStatus: CaseStatus.RECEIVED,
    toStatus: CaseStatus.REVIEWING,
    changedByKey: 'admin',
    reason: null,
    createdAt: addMinutes(SEED_NOW, -5 * 24 * 60 + 60),
  },
  {
    id: 'seed_cslog_4_3',
    caseId: 'seed_case_4',
    fromStatus: CaseStatus.REVIEWING,
    toStatus: CaseStatus.WAITING_PAYMENT,
    changedByKey: 'admin',
    reason: null,
    createdAt: addMinutes(SEED_NOW, -5 * 24 * 60 + 120),
  },
  {
    id: 'seed_cslog_4_4',
    caseId: 'seed_case_4',
    fromStatus: CaseStatus.WAITING_PAYMENT,
    toStatus: CaseStatus.WAITING_PAYMENT,
    changedByKey: 'admin',
    reason: '결제 확인',
    createdAt: addMinutes(SEED_NOW, -3 * 24 * 60),
  },
  {
    id: 'seed_cslog_4_5',
    caseId: 'seed_case_4',
    fromStatus: CaseStatus.WAITING_PAYMENT,
    toStatus: CaseStatus.ACTIVE_MONITORING,
    changedByKey: 'admin',
    reason: null,
    createdAt: addMinutes(SEED_NOW, -3 * 24 * 60 + 60),
  },
  // Case 5: RECEIVED → REVIEWING → WAITING_PAYMENT → payment → ACTIVE_MONITORING → CONDITION_MET
  {
    id: 'seed_cslog_5_1',
    caseId: 'seed_case_5',
    fromStatus: CaseStatus.RECEIVED,
    toStatus: CaseStatus.RECEIVED,
    changedByKey: 'admin',
    reason: '케이스 생성',
    createdAt: addMinutes(SEED_NOW, -7 * 24 * 60),
  },
  {
    id: 'seed_cslog_5_2',
    caseId: 'seed_case_5',
    fromStatus: CaseStatus.RECEIVED,
    toStatus: CaseStatus.REVIEWING,
    changedByKey: 'admin',
    reason: null,
    createdAt: addMinutes(SEED_NOW, -7 * 24 * 60 + 60),
  },
  {
    id: 'seed_cslog_5_3',
    caseId: 'seed_case_5',
    fromStatus: CaseStatus.REVIEWING,
    toStatus: CaseStatus.WAITING_PAYMENT,
    changedByKey: 'admin',
    reason: null,
    createdAt: addMinutes(SEED_NOW, -7 * 24 * 60 + 120),
  },
  {
    id: 'seed_cslog_5_4',
    caseId: 'seed_case_5',
    fromStatus: CaseStatus.WAITING_PAYMENT,
    toStatus: CaseStatus.WAITING_PAYMENT,
    changedByKey: 'admin',
    reason: '결제 확인',
    createdAt: addMinutes(SEED_NOW, -4 * 24 * 60),
  },
  {
    id: 'seed_cslog_5_5',
    caseId: 'seed_case_5',
    fromStatus: CaseStatus.WAITING_PAYMENT,
    toStatus: CaseStatus.ACTIVE_MONITORING,
    changedByKey: 'admin',
    reason: null,
    createdAt: addMinutes(SEED_NOW, -4 * 24 * 60 + 60),
  },
  {
    id: 'seed_cslog_5_6',
    caseId: 'seed_case_5',
    fromStatus: CaseStatus.ACTIVE_MONITORING,
    toStatus: CaseStatus.CONDITION_MET,
    changedByKey: 'admin',
    reason: '조건 충족 증거 확인',
    createdAt: addMinutes(SEED_NOW, -2 * 24 * 60),
  },
];

// Case 5 (CONDITION_MET) — 증거 1건
// checkLogId: seed_log_seed_cycle_1_seed_acc_2 (AVAILABLE status, seed_acc_2)
export const SEED_CONDITION_MET_EVENTS: SeedConditionMetEvent[] = [
  {
    id: 'seed_evidence_1',
    caseId: 'seed_case_5',
    checkLogId: 'seed_log_seed_cycle_1_seed_acc_2',
    evidenceSnapshot: {
      checkUrl: SEED_ACCOMMODATIONS[1].url,
      platform: 'AGODA',
      status: 'AVAILABLE',
      price: '₩93,000',
      checkIn: SEED_ACCOMMODATIONS[1].checkIn.toISOString(),
      checkOut: SEED_ACCOMMODATIONS[1].checkOut.toISOString(),
      conditionDefinition: '2인 기준 파리 호텔 총 3박 60만원 이하로 예약 가능해지면 알려주세요',
    },
    screenshotBase64: null,
    capturedAt: addMinutes(SEED_NOW, -2 * 24 * 60 - 30),
    createdAt: addMinutes(SEED_NOW, -2 * 24 * 60 - 30),
  },
];

export const SEED_BILLING_EVENTS: SeedBillingEvent[] = [
  {
    id: 'seed_billing_1',
    caseId: 'seed_case_5',
    type: BillingEventType.CONDITION_MET_FEE,
    conditionMetEventId: 'seed_evidence_1',
    amountKrw: 0,
    description: '조건 충족 수수료',
    createdAt: addMinutes(SEED_NOW, -2 * 24 * 60 - 30),
  },
];

export const SEED_CASE_NOTIFICATIONS: SeedCaseNotification[] = [
  {
    id: 'seed_notification_1',
    caseId: 'seed_case_5',
    channel: 'KAKAO',
    status: NotificationStatus.SENT,
    payload: {
      title: '숙소 예약 가능! 🎉',
      description: `📍 ${SEED_ACCOMMODATIONS[1].name}\n📅 ${SEED_ACCOMMODATIONS[1].checkIn.toISOString().split('T')[0]} ~ ${SEED_ACCOMMODATIONS[1].checkOut.toISOString().split('T')[0]}\n💰 ₩93,000\n\n지금 바로 확인하세요!`,
      buttonText: '예약하러 가기',
      buttonUrl: SEED_ACCOMMODATIONS[1].url,
      userId: '',
    },
    sentAt: addMinutes(SEED_NOW, -2 * 24 * 60 - 29),
    failReason: null,
    retryCount: 0,
    maxRetries: 3,
    idempotencyKey: 'seed_case_5:seed_log_seed_cycle_1_seed_acc_2',
    createdAt: addMinutes(SEED_NOW, -2 * 24 * 60 - 30),
  },
];

export const SYSTEM_SETTINGS = [
  // ── Worker 스케줄 ──
  {
    key: 'worker.cronSchedule',
    value: '*/30 * * * *',
    type: 'string',
    category: 'worker',
    description: '숙소 가격을 확인하는 주기 (분 단위)',
    minValue: null,
    maxValue: null,
  },
  {
    key: 'worker.concurrency',
    value: '1',
    type: 'int',
    category: 'worker',
    description: '한 번에 동시에 확인하는 숙소 수 (서버 부하 방지를 위해 1 권장)',
    minValue: '1',
    maxValue: '20',
  },
  {
    key: 'worker.browserPoolSize',
    value: '1',
    type: 'int',
    category: 'worker',
    description: '동시에 열어두는 브라우저 수 (서버 부하 방지를 위해 1 권장)',
    minValue: '1',
    maxValue: '10',
  },
  {
    key: 'worker.startupDelayMs',
    value: '10000',
    type: 'int',
    category: 'worker',
    description: '서버 시작 후 첫 가격 확인까지 대기하는 시간',
    minValue: '0',
    maxValue: '300000',
  },
  {
    key: 'worker.shutdownTimeoutMs',
    value: '60000',
    type: 'int',
    category: 'worker',
    description: '서버 종료 시 진행 중인 작업이 끝나길 기다리는 최대 시간',
    minValue: '5000',
    maxValue: '600000',
  },

  // ── 브라우저 타임아웃 ──
  {
    key: 'browser.navigationTimeoutMs',
    value: '25000',
    type: 'int',
    category: 'browser',
    description: '숙소 페이지가 열릴 때까지 기다리는 최대 시간',
    minValue: '5000',
    maxValue: '120000',
  },
  {
    key: 'browser.contentWaitMs',
    value: '10000',
    type: 'int',
    category: 'browser',
    description: '페이지 내 가격/상태 정보가 표시될 때까지 기다리는 시간',
    minValue: '1000',
    maxValue: '60000',
  },
  {
    key: 'browser.patternRetryMs',
    value: '5000',
    type: 'int',
    category: 'browser',
    description: '가격 정보를 찾지 못했을 때 다시 확인하기까지 대기 시간',
    minValue: '0',
    maxValue: '30000',
  },
  {
    key: 'browser.protocolTimeoutMs',
    value: '60000',
    type: 'int',
    category: 'browser',
    description: '브라우저와의 통신이 응답 없을 때 포기하는 최대 시간',
    minValue: '10000',
    maxValue: '300000',
  },

  // ── 체크 동작 ──
  {
    key: 'checker.maxRetries',
    value: '2',
    type: 'int',
    category: 'checker',
    description: '숙소 페이지 접속에 실패했을 때 다시 시도하는 최대 횟수',
    minValue: '0',
    maxValue: '10',
  },
  {
    key: 'checker.retryDelayMs',
    value: '3000',
    type: 'int',
    category: 'checker',
    description: '재시도 사이에 쉬는 시간',
    minValue: '0',
    maxValue: '30000',
  },
  {
    key: 'checker.blockResourceTypes',
    value: 'image,media,font',
    type: 'string',
    category: 'checker',
    description: '속도 향상을 위해 불러오지 않는 항목 (image,media,font 등, off 입력 시 모두 불러옴)',
    minValue: null,
    maxValue: null,
  },

  // ── 모니터링 임계값 ──
  {
    key: 'monitoring.workerHealthyThresholdMs',
    value: '2400000',
    type: 'int',
    category: 'monitoring',
    description: '마지막 작업 후 이 시간 안에 응답이 있으면 "정상" 상태로 표시',
    minValue: '60000',
    maxValue: '86400000',
  },
  {
    key: 'monitoring.workerDegradedThresholdMs',
    value: '5400000',
    type: 'int',
    category: 'monitoring',
    description: '마지막 작업 후 이 시간이 지나면 "주의" 상태로 표시 (초과 시 "중단")',
    minValue: '60000',
    maxValue: '86400000',
  },

  // ── 알림 ──
  {
    key: 'notification.kakaoTokenRefreshMarginMs',
    value: '300000',
    type: 'int',
    category: 'notification',
    description: '카카오 알림 인증이 만료되기 전 미리 갱신하는 여유 시간',
    minValue: '60000',
    maxValue: '3600000',
  },

  // ── 하트비트 모니터링 ──
  {
    key: 'heartbeat.intervalMs',
    value: '60000',
    type: 'int',
    category: 'heartbeat',
    description: '워커가 살아있음을 알리는 하트비트 업데이트 간격',
    minValue: '10000',
    maxValue: '600000',
  },
  {
    key: 'heartbeat.missedThreshold',
    value: '1',
    type: 'int',
    category: 'heartbeat',
    description: '알림 발송 전 놓쳐도 되는 하트비트 횟수 (이 횟수 이상 놓치면 알림)',
    minValue: '1',
    maxValue: '10',
  },
  {
    key: 'heartbeat.checkIntervalMs',
    value: '60000',
    type: 'int',
    category: 'heartbeat',
    description: '워커 상태를 확인하는 간격',
    minValue: '10000',
    maxValue: '600000',
  },
  {
    key: 'heartbeat.workerDownCooldownMs',
    value: '3600000',
    type: 'int',
    category: 'heartbeat',
    description: '워커 다운 알림 후 다음 알림까지 기다리는 시간 (중복 알림 방지)',
    minValue: '60000',
    maxValue: '86400000',
  },
  {
    key: 'heartbeat.workerStuckCooldownMs',
    value: '1800000',
    type: 'int',
    category: 'heartbeat',
    description: '워커 처리 지연 알림 후 다음 알림까지 기다리는 시간',
    minValue: '60000',
    maxValue: '86400000',
  },
  {
    key: 'heartbeat.maxProcessingTimeMs',
    value: '3600000',
    type: 'int',
    category: 'heartbeat',
    description: '워커가 한 작업을 처리하는 최대 허용 시간 (초과 시 "처리 지연" 알림)',
    minValue: '60000',
    maxValue: '7200000',
  },

  // ── 셀렉터 테스트 ──
  {
    key: 'selectorTest.testableAttributes',
    value: JSON.stringify(['data-testid', 'data-test-id', 'data-selenium', 'data-element-name']),
    type: 'json',
    category: 'selectorTest',
    description: '테스트 시 추출할 요소의 속성명 (개발자가 테스트용으로 추가한 속성)',
    minValue: null,
    maxValue: null,
  },
];

// ============================================
// Platform Selectors
// ============================================

export interface SeedPlatformSelector {
  platform: Platform;
  category: SelectorCategory;
  name: string;
  selector: string;
  extractorCode?: string;
  priority: number;
  description?: string;
}

export interface SeedPlatformPattern {
  platform: Platform;
  patternType: PatternType;
  pattern: string;
  locale: string;
  priority: number;
}

export const SEED_AIRBNB_SELECTORS: SeedPlatformSelector[] = [
  // 가격 추출
  {
    platform: Platform.AIRBNB,
    category: SelectorCategory.PRICE,
    name: 'Total Price Aria Label',
    selector: '[aria-label*="총액"]',
    extractorCode: `
      const label = el.getAttribute('aria-label') || '';
      const match = label.match(/총액[^₩$€£]*([₩$€£][\\s]*[\\d,]+)/);
      return match ? match[1].replace(/\\s/g, '').replace(/,$/g, '') : null;
    `,
    priority: 10,
    description: 'aria-label에서 총액 추출',
  },
  {
    platform: Platform.AIRBNB,
    category: SelectorCategory.PRICE,
    name: 'Book It Default',
    selector: '[data-testid="book-it-default"]',
    extractorCode: `
      const text = el.innerText || '';
      const match = text.match(/[₩$€£][\\s]*[\\d,]+/);
      return match ? match[0].replace(/\\s/g, '').replace(/,$/g, '') : null;
    `,
    priority: 5,
    description: '예약 위젯에서 가격 추출',
  },
  // 메타데이터
  {
    platform: Platform.AIRBNB,
    category: SelectorCategory.METADATA,
    name: 'JSON-LD VacationRental',
    selector: 'script[type="application/ld+json"]',
    extractorCode: `
      const jsonLd = JSON.parse(el.textContent || '{}');
      if (jsonLd['@type'] === 'VacationRental' || jsonLd['@type'] === 'Product') {
        return {
          name: jsonLd.name,
          image: Array.isArray(jsonLd.image) ? jsonLd.image[0] : jsonLd.image,
          description: jsonLd.description?.slice(0, 2000),
          latitude: jsonLd.latitude,
          longitude: jsonLd.longitude,
          ratingValue: jsonLd.aggregateRating?.ratingValue,
          reviewCount: parseInt(jsonLd.aggregateRating?.ratingCount,10) || undefined,
        };
      }
      return null;
    `,
    priority: 10,
    description: 'JSON-LD에서 숙소 메타데이터 추출',
  },
  // 플랫폼 ID
  {
    platform: Platform.AIRBNB,
    category: SelectorCategory.PLATFORM_ID,
    name: 'Room ID from URL',
    selector: 'window.location.pathname',
    extractorCode: `
      const match = window.location.pathname.match(/\\/rooms\\/([0-9]+)/);
      return match ? match[1] : null;
    `,
    priority: 10,
    description: 'URL에서 room ID 추출',
  },
];

export const SEED_AGODA_SELECTORS: SeedPlatformSelector[] = [
  // 가격 추출
  {
    platform: Platform.AGODA,
    category: SelectorCategory.PRICE,
    name: 'Price After Tax',
    selector: '[data-testid="price-after-tax"]',
    extractorCode: `
      const text = el.innerText || '';
      const match = text.match(/[₩$€£][\\s]*[\\d,]+/);
      return match ? match[0].replace(/\\s/g, '') : null;
    `,
    priority: 10,
    description: '세금 포함 가격 추출',
  },
  {
    platform: Platform.AGODA,
    category: SelectorCategory.PRICE,
    name: 'FPC Room Price',
    selector: '[data-element-name="fpc-room-price"]',
    extractorCode: `
      const text = el.innerText || '';
      const match = text.match(/[₩$€£][\\s]*[\\d,]+/);
      return match ? match[0].replace(/\\s/g, '') : null;
    `,
    priority: 5,
    description: '세금 전 가격 추출 (fallback)',
  },
  // 가용성
  {
    platform: Platform.AGODA,
    category: SelectorCategory.AVAILABILITY,
    name: 'Available Element',
    selector: '[data-element-value="available"]',
    priority: 10,
    description: '예약 가능 표시 요소',
  },
  {
    platform: Platform.AGODA,
    category: SelectorCategory.AVAILABILITY,
    name: 'Unavailable Element',
    selector: '[data-element-value="unavailable"]',
    priority: 10,
    description: '예약 불가 표시 요소',
  },
  // 메타데이터
  {
    platform: Platform.AGODA,
    category: SelectorCategory.METADATA,
    name: 'JSON-LD Hotel',
    selector: 'script[type="application/ld+json"]',
    extractorCode: `
      const jsonLd = JSON.parse(el.textContent || '{}');
      if (jsonLd['@type'] === 'Hotel') {
        let latitude, longitude;
        if (jsonLd.hasMap) {
          const coordMatch = jsonLd.hasMap.match(/center=([\\d.-]+)%2c([\\d.-]+)/);
          if (coordMatch) {
            latitude = parseFloat(coordMatch[1]);
            longitude = parseFloat(coordMatch[2]);
          }
        }
        return {
          name: jsonLd.name,
          image: jsonLd.image,
          description: jsonLd.description?.slice(0, 2000),
          addressCountry: jsonLd.address?.addressCountry,
          addressRegion: jsonLd.address?.addressRegion,
          addressLocality: jsonLd.address?.addressLocality,
          postalCode: jsonLd.address?.postalCode,
          streetAddress: jsonLd.address?.streetAddress,
          ratingValue: jsonLd.aggregateRating?.ratingValue,
          reviewCount: jsonLd.aggregateRating?.reviewCount,
          latitude,
          longitude,
        };
      }
      return null;
    `,
    priority: 10,
    description: 'JSON-LD에서 호텔 메타데이터 추출',
  },
  // 플랫폼 ID
  {
    platform: Platform.AGODA,
    category: SelectorCategory.PLATFORM_ID,
    name: 'Hotel ID from Scripts',
    selector: 'script',
    extractorCode: `
      for (const script of document.querySelectorAll('script')) {
        const text = script.textContent || '';
        const hotelIdMatch = text.match(/hotelId[:\\s]*([0-9]+)/);
        if (hotelIdMatch) return hotelIdMatch[1];
        const propertyIdMatch = text.match(/propertyId[:\\s]*([0-9]+)/);
        if (propertyIdMatch) return propertyIdMatch[1];
      }
      return null;
    `,
    priority: 10,
    description: '페이지 스크립트에서 호텔 ID 추출',
  },
];

export const SEED_PLATFORM_SELECTORS: SeedPlatformSelector[] = [...SEED_AIRBNB_SELECTORS, ...SEED_AGODA_SELECTORS];

export const SEED_AIRBNB_PATTERNS: SeedPlatformPattern[] = [
  // 예약 가능
  { platform: Platform.AIRBNB, patternType: PatternType.AVAILABLE, pattern: '예약하기', locale: 'ko', priority: 10 },
  { platform: Platform.AIRBNB, patternType: PatternType.AVAILABLE, pattern: 'Reserve', locale: 'en', priority: 5 },
  {
    platform: Platform.AIRBNB,
    patternType: PatternType.AVAILABLE,
    pattern: '예약 확정 전에는 요금이 청구되지 않습니다',
    locale: 'ko',
    priority: 3,
  },
  {
    platform: Platform.AIRBNB,
    patternType: PatternType.AVAILABLE,
    pattern: "You won't be charged yet",
    locale: 'en',
    priority: 3,
  },
  // 예약 불가
  { platform: Platform.AIRBNB, patternType: PatternType.UNAVAILABLE, pattern: '날짜 변경', locale: 'ko', priority: 10 },
  {
    platform: Platform.AIRBNB,
    patternType: PatternType.UNAVAILABLE,
    pattern: 'Change dates',
    locale: 'en',
    priority: 5,
  },
  {
    platform: Platform.AIRBNB,
    patternType: PatternType.UNAVAILABLE,
    pattern: '선택하신 날짜는 이용이 불가능합니다',
    locale: 'ko',
    priority: 8,
  },
  {
    platform: Platform.AIRBNB,
    patternType: PatternType.UNAVAILABLE,
    pattern: 'Those dates are not available',
    locale: 'en',
    priority: 5,
  },
  {
    platform: Platform.AIRBNB,
    patternType: PatternType.UNAVAILABLE,
    pattern: '이용이 불가능',
    locale: 'ko',
    priority: 7,
  },
  {
    platform: Platform.AIRBNB,
    patternType: PatternType.UNAVAILABLE,
    pattern: 'not available',
    locale: 'en',
    priority: 3,
  },
];

export const SEED_AGODA_PATTERNS: SeedPlatformPattern[] = [
  // 예약 가능
  {
    platform: Platform.AGODA,
    patternType: PatternType.AVAILABLE,
    pattern: '지금 예약하기',
    locale: 'ko',
    priority: 10,
  },
  { platform: Platform.AGODA, patternType: PatternType.AVAILABLE, pattern: 'Book now', locale: 'en', priority: 5 },
  {
    platform: Platform.AGODA,
    patternType: PatternType.AVAILABLE,
    pattern: '예약 무료 취소 가능',
    locale: 'ko',
    priority: 5,
  },
  {
    platform: Platform.AGODA,
    patternType: PatternType.AVAILABLE,
    pattern: 'Covered by EasyCancel',
    locale: 'en',
    priority: 3,
  },
  // 예약 불가
  {
    platform: Platform.AGODA,
    patternType: PatternType.UNAVAILABLE,
    pattern: '죄송합니다. 고객님이 선택한 날짜에 이 숙소의 본 사이트 잔여 객실이 없습니다',
    locale: 'ko',
    priority: 10,
  },
  {
    platform: Platform.AGODA,
    patternType: PatternType.UNAVAILABLE,
    pattern: 'Sorry, we have no rooms at this property on your dates',
    locale: 'en',
    priority: 5,
  },
  {
    platform: Platform.AGODA,
    patternType: PatternType.UNAVAILABLE,
    pattern: '날짜를 변경해 이 숙소 재검색하기',
    locale: 'ko',
    priority: 8,
  },
  {
    platform: Platform.AGODA,
    patternType: PatternType.UNAVAILABLE,
    pattern: 'Change your dates',
    locale: 'en',
    priority: 5,
  },
];

export const SEED_PLATFORM_PATTERNS: SeedPlatformPattern[] = [...SEED_AIRBNB_PATTERNS, ...SEED_AGODA_PATTERNS];
