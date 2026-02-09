export type Lang = 'ko' | 'en';

export interface LandingCopy {
  nav: {
    brand: string;
    features: string;
    status: string;
    pricing: string;
    login: string;
  };
  hero: {
    headline: string;
    headlineMobile: string[];
    subheadline: string;
    subheadlineMobile: string[];
    description: string;
    cta: string;
    secondaryCta: string;
    statusLabel: string;
  };
  features: {
    f1Title: string;
    f1Subtitle: string;
    f1Desc: string;
    f2Title: string;
    f2Subtitle: string;
    f2Desc: string;
    f3Title: string;
    f3Subtitle: string;
    f3Desc: string;
  };
  trust: {
    title: string;
    operational: string;
    uptime: string;
    activeMonitors: string;
    response: string;
    emptyLogs: string;
    errorMessage: string;
  };
  footer: {
    title: string;
    description: string;
    cta: string;
    copyright: string;
  };
}

export const MOCK_SYSTEM_STATUS = {
  activeMonitors: 3421,
  uptime: '99.99%',
  avgResponseTime: '42ms',
};

interface LogData {
  id: number;
  message: string;
  location: string;
}

export const MOCK_LOGS: Record<Lang, LogData[]> = {
  ko: [
    { id: 1, message: '빈방 발견: 파크하얏트 서울 (프리미엄 스위트)', location: '서울' },
    { id: 2, message: '빈방 발견: 그랜드 하얏트 제주 (오션뷰 디럭스)', location: '제주' },
    { id: 3, message: '체크 완료: 2,847개 타겟 스캔', location: '시스템' },
    { id: 4, message: '빈방 발견: 신라스테이 광화문 (이그제큐티브)', location: '서울' },
    { id: 5, message: '알림 전송: 3명의 사용자에게 발송 완료', location: '시스템' },
    { id: 6, message: '빈방 발견: 롯데호텔 부산 (오션 프리미어)', location: '부산' },
    { id: 7, message: '빈방 발견: 포시즌스 서울 (코너 킹)', location: '서울' },
    { id: 8, message: '체크 완료: 1,923개 타겟 스캔', location: '시스템' },
    { id: 9, message: '빈방 발견: 메종 글래드 제주 (스탠다드 더블)', location: '제주' },
    { id: 10, message: '빈방 발견: 아난티 코브 (오션힐 디럭스)', location: '부산' },
    { id: 11, message: '빈방 발견: 콘래드 서울 (이그제큐티브)', location: '서울' },
    { id: 12, message: '알림 전송: 7명의 사용자에게 발송 완료', location: '시스템' },
    { id: 13, message: '빈방 발견: 반얀트리 클럽앤스파 (풀빌라)', location: '제주' },
    { id: 14, message: '체크 완료: 3,421개 타겟 스캔', location: '시스템' },
    { id: 15, message: '빈방 발견: 씨마크호텔 (오션뷰 트윈)', location: '강릉' },
  ],
  en: [
    { id: 1, message: 'Vacancy found: Park Hyatt Seoul (Premium Suite)', location: 'Seoul' },
    { id: 2, message: 'Vacancy found: Grand Hyatt Jeju (Ocean View Deluxe)', location: 'Jeju' },
    { id: 3, message: 'Check complete: 2,847 targets scanned', location: 'System' },
    { id: 4, message: 'Vacancy found: Shilla Stay Gwanghwamun (Executive)', location: 'Seoul' },
    { id: 5, message: 'Alert sent: Delivered to 3 users', location: 'System' },
    { id: 6, message: 'Vacancy found: Lotte Hotel Busan (Ocean Premier)', location: 'Busan' },
    { id: 7, message: 'Vacancy found: Four Seasons Seoul (Corner King)', location: 'Seoul' },
    { id: 8, message: 'Check complete: 1,923 targets scanned', location: 'System' },
    { id: 9, message: 'Vacancy found: Maison Glad Jeju (Standard Double)', location: 'Jeju' },
    { id: 10, message: 'Vacancy found: Ananti Cove (Oceanhill Deluxe)', location: 'Busan' },
    { id: 11, message: 'Vacancy found: Conrad Seoul (Executive)', location: 'Seoul' },
    { id: 12, message: 'Alert sent: Delivered to 7 users', location: 'System' },
    { id: 13, message: 'Vacancy found: Banyan Tree Club & Spa (Pool Villa)', location: 'Jeju' },
    { id: 14, message: 'Check complete: 3,421 targets scanned', location: 'System' },
    { id: 15, message: 'Vacancy found: Seamarq Hotel (Ocean View Twin)', location: 'Gangneung' },
  ],
};

export const TRANSLATIONS: Record<Lang, LandingCopy> = {
  ko: {
    nav: {
      brand: '빈방어때',
      features: '기능 소개',
      status: '시스템 상태',
      pricing: '요금제',
      login: '로그인',
    },
    hero: {
      headline: '당신의 휴식이 길을 잃지 않도록,',
      headlineMobile: ['당신의 휴식이', '길을 잃지 않도록,'],
      subheadline: "'빈방어때'가 밤새 불을 밝혀둘게요.",
      subheadlineMobile: ["'빈방어때'가", '밤새 불을 밝혀둘게요.'],
      description:
        '반복되는 새로고침과 예약 전쟁에 지치셨나요? 빈방어때는 당신이 잠든 사이에도 묵묵히 자리를 지키며, 가장 가고 싶은 그 곳의 빈자리를 기다립니다.',
      cta: '빈방 알림 시작하기',
      secondaryCta: '기능 자세히 보기',
      statusLabel: '실시간 시스템 상태',
    },
    features: {
      f1Title: '누구보다 밝은 소식',
      f1Subtitle: '기다림은 짧게, 설렘은 길게',
      f1Desc:
        '브라우저 최적화 기술로 기존보다 4배 더 빠르게 빈방을 찾아냅니다. 남들보다 한 걸음 먼저 전해지는 알림으로 당신의 소중한 휴식을 선점하세요.',
      f2Title: '안개 속에서도 선명하게',
      f2Subtitle: '어떤 변화에도 흔들리지 않는 정확함',
      f2Desc:
        '예약 사이트의 복잡한 UI 변경에도 코드 수정 없이 즉시 대응하는 동적 셀렉터 시스템을 갖췄습니다. 플랫폼이 변해도 빈방어때의 시선은 결코 길을 잃지 않습니다.',
      f3Title: '꺼지지 않는 등대',
      f3Subtitle: '잠든 순간에도 당신을 지키는 성실함',
      f3Desc:
        '1분 단위로 스스로의 상태를 기록하는 하트비트 시스템이 중단 없는 감시를 보장합니다. 혹시 모를 장애조차 스스로 감지하고 복구하여 당신의 기다림이 끊어지지 않게 합니다.',
    },
    trust: {
      title: '실시간 운영 현황',
      operational: '정상 운영 중',
      uptime: '가동률',
      activeMonitors: '활성 모니터 수',
      response: '평균 응답',
      emptyLogs: '최근 5분 내 시스템 기록이 없습니다.',
      errorMessage: '실시간 상태를 불러오지 못했습니다. 5초 후 다시 시도하세요.',
    },
    footer: {
      title: '복잡함은 저희가 처리할게요.',
      description: '당신은 이제 마음 편히, 설레는 여행만 준비하세요.',
      cta: '빈방 소식 받아보기',
      copyright: '© 2026 Binbang. All rights reserved.',
    },
  },
  en: {
    nav: {
      brand: 'Binbang',
      features: 'Features',
      status: 'System Status',
      pricing: 'Pricing',
      login: 'Login',
    },
    hero: {
      headline: 'So your rest never loses its way,',
      headlineMobile: ['So your rest', 'never loses its way,'],
      subheadline: 'Binbang keeps the lighthouse on all night.',
      subheadlineMobile: ["'Binbang' keeps the lighthouse", 'on all night.'],
      description:
        'Tired of endless refreshing? Binbang keeps watch while you sleep and catches the vacancy at your dream stay first.',
      cta: 'Start Vacancy Alerts',
      secondaryCta: 'See Features',
      statusLabel: 'Live System Status',
    },
    features: {
      f1Title: 'Brighter News, First',
      f1Subtitle: 'Less waiting, more excitement',
      f1Desc:
        'Browser optimization finds open rooms up to 4x faster than conventional checks. Be the first to know and secure your perfect stay ahead of everyone else.',
      f2Title: 'Clear Through Any Fog',
      f2Subtitle: 'Unwavering accuracy through every change',
      f2Desc:
        "Dynamic selectors adapt to booking-site UI changes without redeploying code. Even when platforms evolve, Binbang's vision never loses its way.",
      f3Title: 'An Unfading Lighthouse',
      f3Subtitle: 'Steadfast protection, even while you sleep',
      f3Desc:
        'Minute-level heartbeat logs keep monitoring stable and transparent, all day. The system detects and recovers from any issues automatically, so your watch never ends.',
    },
    trust: {
      title: 'Live Operations',
      operational: 'Operational',
      uptime: 'Uptime',
      activeMonitors: 'Active Monitors',
      response: 'Avg Response',
      emptyLogs: 'No system activity in the last 5 minutes.',
      errorMessage: 'Failed to load live status. Retrying in 5 seconds.',
    },
    footer: {
      title: 'We handle the complexity.',
      description: 'You can focus on planning your next trip.',
      cta: 'Get Vacancy Updates',
      copyright: '© 2026 Binbang. All rights reserved.',
    },
  },
};
