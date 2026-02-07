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
    subheadline: string;
    description: string;
    cta: string;
    secondaryCta: string;
    statusLabel: string;
  };
  features: {
    f1Title: string;
    f1Desc: string;
    f2Title: string;
    f2Desc: string;
    f3Title: string;
    f3Desc: string;
  };
  trust: {
    title: string;
    operational: string;
    uptime: string;
    activeMonitors: string;
    response: string;
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

export const MOCK_LOGS = [
  { id: 1, time: '방금', message: '빈방 발견: 시그니엘 서울 (디럭스 더블)', location: '서울' },
  { id: 2, time: '12초 전', message: '빈방 발견: 아난티 힐튼 (오션뷰)', location: '부산' },
  { id: 3, time: '45초 전', message: '빈방 발견: 신라스테이 (스탠다드)', location: '제주' },
  { id: 4, time: '1분 전', message: '체크 완료: 1,204개 타겟 스캔', location: '시스템' },
  { id: 5, time: '2분 전', message: '빈방 발견: 네스트 호텔 (벙커룸)', location: '인천' },
];

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
      subheadline: '빈방어때가 밤새 불을 밝혀둘게요.',
      description:
        '반복되는 새로고침과 예약 전쟁에 지치셨나요? 빈방어때는 당신이 잠든 사이에도 묵묵히 자리를 지키며, 가장 가고 싶은 그 곳의 빈자리를 기다립니다.',
      cta: '빈방 알림 시작하기',
      secondaryCta: '기능 자세히 보기',
      statusLabel: '실시간 시스템 상태',
    },
    features: {
      f1Title: '누구보다 밝은 소식',
      f1Desc: '브라우저 최적화 기술로 기존보다 최대 4배 더 빠르게 빈방을 찾아냅니다.',
      f2Title: '안개 속에서도 선명하게',
      f2Desc: '사이트 UI가 바뀌어도 동적 셀렉터 시스템이 코드 재배포 없이 즉시 대응합니다.',
      f3Title: '꺼지지 않는 등대',
      f3Desc: '1분 단위 하트비트 기록으로 24시간 안정적인 모니터링을 유지합니다.',
    },
    trust: {
      title: '실시간 운영 현황',
      operational: '정상 운영 중',
      uptime: '가동률',
      activeMonitors: '활성 모니터 수',
      response: '평균 응답',
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
      subheadline: 'Binbang keeps the lighthouse on all night.',
      description:
        'Tired of endless refreshing? Binbang keeps watch while you sleep and catches the vacancy at your dream stay first.',
      cta: 'Start Vacancy Alerts',
      secondaryCta: 'See Features',
      statusLabel: 'Live System Status',
    },
    features: {
      f1Title: 'Brighter News, First',
      f1Desc: 'Browser optimization finds open rooms up to 4x faster than conventional checks.',
      f2Title: 'Clear Through Any Fog',
      f2Desc: 'Dynamic selectors adapt to booking-site UI changes without redeploying code.',
      f3Title: 'An Unfading Lighthouse',
      f3Desc: 'Minute-level heartbeat logs keep monitoring stable and transparent, all day.',
    },
    trust: {
      title: 'Live Operations',
      operational: 'Operational',
      uptime: 'Uptime',
      activeMonitors: 'Active Monitors',
      response: 'Avg Response',
    },
    footer: {
      title: 'We handle the complexity.',
      description: 'You can focus on planning your next trip.',
      cta: 'Get Vacancy Updates',
      copyright: '© 2026 Binbang. All rights reserved.',
    },
  },
};
