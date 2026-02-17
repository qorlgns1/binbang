/**
 * AI 기반 여행지 콘텐츠 생성 스크립트
 *
 * 사용법:
 * pnpm --filter @workspace/travel generate:destinations
 */

import { prisma } from '@workspace/db';

interface DestinationSeed {
  slug: string;
  nameKo: string;
  nameEn: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  currency: string;
}

// 인기 여행지 30개
const DESTINATIONS: DestinationSeed[] = [
  // 일본
  {
    slug: 'tokyo',
    nameKo: '도쿄',
    nameEn: 'Tokyo',
    country: 'Japan',
    countryCode: 'JP',
    latitude: 35.6762,
    longitude: 139.6503,
    currency: 'JPY',
  },
  {
    slug: 'osaka',
    nameKo: '오사카',
    nameEn: 'Osaka',
    country: 'Japan',
    countryCode: 'JP',
    latitude: 34.6937,
    longitude: 135.5023,
    currency: 'JPY',
  },
  {
    slug: 'kyoto',
    nameKo: '교토',
    nameEn: 'Kyoto',
    country: 'Japan',
    countryCode: 'JP',
    latitude: 35.0116,
    longitude: 135.7681,
    currency: 'JPY',
  },
  // 한국
  {
    slug: 'seoul',
    nameKo: '서울',
    nameEn: 'Seoul',
    country: 'South Korea',
    countryCode: 'KR',
    latitude: 37.5665,
    longitude: 126.978,
    currency: 'KRW',
  },
  {
    slug: 'busan',
    nameKo: '부산',
    nameEn: 'Busan',
    country: 'South Korea',
    countryCode: 'KR',
    latitude: 35.1796,
    longitude: 129.0756,
    currency: 'KRW',
  },
  {
    slug: 'jeju',
    nameKo: '제주',
    nameEn: 'Jeju',
    country: 'South Korea',
    countryCode: 'KR',
    latitude: 33.4996,
    longitude: 126.5312,
    currency: 'KRW',
  },
  // 태국
  {
    slug: 'bangkok',
    nameKo: '방콕',
    nameEn: 'Bangkok',
    country: 'Thailand',
    countryCode: 'TH',
    latitude: 13.7563,
    longitude: 100.5018,
    currency: 'THB',
  },
  {
    slug: 'phuket',
    nameKo: '푸켓',
    nameEn: 'Phuket',
    country: 'Thailand',
    countryCode: 'TH',
    latitude: 7.8804,
    longitude: 98.3923,
    currency: 'THB',
  },
  {
    slug: 'chiang-mai',
    nameKo: '치앙마이',
    nameEn: 'Chiang Mai',
    country: 'Thailand',
    countryCode: 'TH',
    latitude: 18.7883,
    longitude: 98.9853,
    currency: 'THB',
  },
  // 프랑스
  {
    slug: 'paris',
    nameKo: '파리',
    nameEn: 'Paris',
    country: 'France',
    countryCode: 'FR',
    latitude: 48.8566,
    longitude: 2.3522,
    currency: 'EUR',
  },
  {
    slug: 'nice',
    nameKo: '니스',
    nameEn: 'Nice',
    country: 'France',
    countryCode: 'FR',
    latitude: 43.7102,
    longitude: 7.262,
    currency: 'EUR',
  },
  // 이탈리아
  {
    slug: 'rome',
    nameKo: '로마',
    nameEn: 'Rome',
    country: 'Italy',
    countryCode: 'IT',
    latitude: 41.9028,
    longitude: 12.4964,
    currency: 'EUR',
  },
  {
    slug: 'venice',
    nameKo: '베네치아',
    nameEn: 'Venice',
    country: 'Italy',
    countryCode: 'IT',
    latitude: 45.4408,
    longitude: 12.3155,
    currency: 'EUR',
  },
  {
    slug: 'florence',
    nameKo: '피렌체',
    nameEn: 'Florence',
    country: 'Italy',
    countryCode: 'IT',
    latitude: 43.7696,
    longitude: 11.2558,
    currency: 'EUR',
  },
  // 영국
  {
    slug: 'london',
    nameKo: '런던',
    nameEn: 'London',
    country: 'United Kingdom',
    countryCode: 'GB',
    latitude: 51.5074,
    longitude: -0.1278,
    currency: 'GBP',
  },
  // 스페인
  {
    slug: 'barcelona',
    nameKo: '바르셀로나',
    nameEn: 'Barcelona',
    country: 'Spain',
    countryCode: 'ES',
    latitude: 41.3851,
    longitude: 2.1734,
    currency: 'EUR',
  },
  {
    slug: 'madrid',
    nameKo: '마드리드',
    nameEn: 'Madrid',
    country: 'Spain',
    countryCode: 'ES',
    latitude: 40.4168,
    longitude: -3.7038,
    currency: 'EUR',
  },
  // 미국
  {
    slug: 'new-york',
    nameKo: '뉴욕',
    nameEn: 'New York',
    country: 'United States',
    countryCode: 'US',
    latitude: 40.7128,
    longitude: -74.006,
    currency: 'USD',
  },
  {
    slug: 'los-angeles',
    nameKo: '로스앤젤레스',
    nameEn: 'Los Angeles',
    country: 'United States',
    countryCode: 'US',
    latitude: 34.0522,
    longitude: -118.2437,
    currency: 'USD',
  },
  {
    slug: 'san-francisco',
    nameKo: '샌프란시스코',
    nameEn: 'San Francisco',
    country: 'United States',
    countryCode: 'US',
    latitude: 37.7749,
    longitude: -122.4194,
    currency: 'USD',
  },
  // 싱가포르
  {
    slug: 'singapore',
    nameKo: '싱가포르',
    nameEn: 'Singapore',
    country: 'Singapore',
    countryCode: 'SG',
    latitude: 1.3521,
    longitude: 103.8198,
    currency: 'SGD',
  },
  // 호주
  {
    slug: 'sydney',
    nameKo: '시드니',
    nameEn: 'Sydney',
    country: 'Australia',
    countryCode: 'AU',
    latitude: -33.8688,
    longitude: 151.2093,
    currency: 'AUD',
  },
  {
    slug: 'melbourne',
    nameKo: '멜버른',
    nameEn: 'Melbourne',
    country: 'Australia',
    countryCode: 'AU',
    latitude: -37.8136,
    longitude: 144.9631,
    currency: 'AUD',
  },
  // 뉴질랜드
  {
    slug: 'auckland',
    nameKo: '오클랜드',
    nameEn: 'Auckland',
    country: 'New Zealand',
    countryCode: 'NZ',
    latitude: -36.8485,
    longitude: 174.7633,
    currency: 'NZD',
  },
  // 베트남
  {
    slug: 'hanoi',
    nameKo: '하노이',
    nameEn: 'Hanoi',
    country: 'Vietnam',
    countryCode: 'VN',
    latitude: 21.0285,
    longitude: 105.8542,
    currency: 'VND',
  },
  {
    slug: 'ho-chi-minh',
    nameKo: '호치민',
    nameEn: 'Ho Chi Minh City',
    country: 'Vietnam',
    countryCode: 'VN',
    latitude: 10.8231,
    longitude: 106.6297,
    currency: 'VND',
  },
  // 말레이시아
  {
    slug: 'kuala-lumpur',
    nameKo: '쿠알라룸푸르',
    nameEn: 'Kuala Lumpur',
    country: 'Malaysia',
    countryCode: 'MY',
    latitude: 3.139,
    longitude: 101.6869,
    currency: 'MYR',
  },
  // 인도네시아
  {
    slug: 'bali',
    nameKo: '발리',
    nameEn: 'Bali',
    country: 'Indonesia',
    countryCode: 'ID',
    latitude: -8.3405,
    longitude: 115.092,
    currency: 'IDR',
  },
  // 두바이
  {
    slug: 'dubai',
    nameKo: '두바이',
    nameEn: 'Dubai',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    latitude: 25.2048,
    longitude: 55.2708,
    currency: 'AED',
  },
  // 터키
  {
    slug: 'istanbul',
    nameKo: '이스탄불',
    nameEn: 'Istanbul',
    country: 'Turkey',
    countryCode: 'TR',
    latitude: 41.0082,
    longitude: 28.9784,
    currency: 'TRY',
  },
];

/**
 * OpenAI API로 여행지 설명 및 하이라이트 생성
 */
async function generateContent(destination: DestinationSeed): Promise<{
  descriptionKo: string;
  descriptionEn: string;
  highlightsKo: string[];
  highlightsEn: string[];
}> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    console.warn(`⚠️  OPENAI_API_KEY not found. Using fallback content for ${destination.nameEn}`);
    return {
      descriptionKo: `${destination.nameKo}는 ${destination.country}의 인기 여행지입니다.`,
      descriptionEn: `${destination.nameEn} is a popular destination in ${destination.country}.`,
      highlightsKo: ['현지 음식 체험', '주요 관광지 방문', '현지 문화 체험'],
      highlightsEn: ['Local cuisine experience', 'Visit major attractions', 'Experience local culture'],
    };
  }

  console.log(`🤖 Generating AI content for ${destination.nameEn}...`);

  const prompt = `You are a travel content writer. Generate engaging travel content for ${destination.nameEn}, ${destination.country}.

1. Write a description (2-3 sentences) in Korean and English separately.
2. List 5 highlights/must-do activities in Korean and English separately.

Return ONLY valid JSON in this exact format:
{
  "descriptionKo": "Korean description here",
  "descriptionEn": "English description here",
  "highlightsKo": ["highlight1", "highlight2", "highlight3", "highlight4", "highlight5"],
  "highlightsEn": ["highlight1", "highlight2", "highlight3", "highlight4", "highlight5"]
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      choices: { message: { content: string } }[];
    };
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in response');
    }

    // JSON 파싱 (마크다운 코드 블록 제거)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from response');
    }

    return JSON.parse(jsonMatch[0]) as {
      descriptionKo: string;
      descriptionEn: string;
      highlightsKo: string[];
      highlightsEn: string[];
    };
  } catch (error) {
    console.error(`❌ Failed to generate content for ${destination.nameEn}:`, error);
    // Fallback
    return {
      descriptionKo: `${destination.nameKo}는 ${destination.country}의 인기 여행지입니다.`,
      descriptionEn: `${destination.nameEn} is a popular destination in ${destination.country}.`,
      highlightsKo: ['현지 음식 체험', '주요 관광지 방문', '현지 문화 체험', '쇼핑', '야경 감상'],
      highlightsEn: [
        'Local cuisine experience',
        'Visit major attractions',
        'Experience local culture',
        'Shopping',
        'Night views',
      ],
    };
  }
}

/**
 * Unsplash API로 여행지 이미지 가져오기
 */
async function fetchImage(destination: DestinationSeed): Promise<string | null> {
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!unsplashKey) {
    console.warn(`⚠️  UNSPLASH_ACCESS_KEY not found. Skipping image for ${destination.nameEn}`);
    return null;
  }

  console.log(`🖼️  Fetching image for ${destination.nameEn}...`);

  try {
    const query = `${destination.nameEn} ${destination.country} landmark`;
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${unsplashKey}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      results: { urls: { regular: string } }[];
    };

    return data.results[0]?.urls?.regular ?? null;
  } catch (error) {
    console.error(`❌ Failed to fetch image for ${destination.nameEn}:`, error);
    return null;
  }
}

/**
 * 여행지 데이터 생성 및 저장
 */
async function generateDestination(seed: DestinationSeed) {
  console.log(`\n📍 Processing ${seed.nameEn}...`);

  // 이미 존재하는지 확인
  const existing = await prisma.destination.findUnique({
    where: { slug: seed.slug },
  });

  if (existing) {
    console.log(`⏭️  Skipping ${seed.nameEn} (already exists)`);
    return;
  }

  // AI로 콘텐츠 생성
  const content = await generateContent(seed);

  // 이미지 가져오기
  const imageUrl = await fetchImage(seed);

  // DB에 저장
  await prisma.destination.create({
    data: {
      slug: seed.slug,
      nameKo: seed.nameKo,
      nameEn: seed.nameEn,
      country: seed.country,
      countryCode: seed.countryCode,
      description: {
        ko: content.descriptionKo,
        en: content.descriptionEn,
      },
      highlights: {
        ko: content.highlightsKo,
        en: content.highlightsEn,
      },
      latitude: seed.latitude,
      longitude: seed.longitude,
      currency: seed.currency,
      imageUrl,
      published: true,
      // weather 필드는 optional이므로 제외
    },
  });

  console.log(`✅ Created ${seed.nameEn}`);
}

/**
 * 메인 함수
 */
async function main() {
  console.log('🚀 Starting destination content generation...\n');

  for (const destination of DESTINATIONS) {
    await generateDestination(destination);
    // Rate limiting (OpenAI, Unsplash)
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log('\n✨ All destinations generated successfully!');
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
