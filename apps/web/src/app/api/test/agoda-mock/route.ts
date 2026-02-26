import { NextResponse } from 'next/server';

import { getAgodaMockScenario } from './state';

// normalize.ts가 파싱할 수 있는 Agoda API 형식의 픽스처
const AVAILABLE_FIXTURE = {
  results: [
    {
      hotelId: 99999,
      rooms: [
        {
          roomId: 1,
          rates: [
            {
              ratePlanId: 1,
              totalInclusive: 150000,
              currency: 'KRW',
              freeCancellation: true,
            },
          ],
        },
      ],
    },
  ],
};

const SOLD_OUT_FIXTURE = { results: [] };

export async function POST(): Promise<Response> {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const scenario = getAgodaMockScenario();
  return NextResponse.json(scenario === 'available' ? AVAILABLE_FIXTURE : SOLD_OUT_FIXTURE);
}
