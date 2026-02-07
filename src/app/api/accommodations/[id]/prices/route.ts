import { getServerSession } from 'next-auth';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import type { RouteParams } from '@/types/api';

const MAX_RECORDS = 5000;
const MOVING_AVG_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7일

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accommodation = await prisma.accommodation.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, checkIn: true, checkOut: true },
  });

  if (!accommodation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { searchParams } = request.nextUrl;
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (from) {
    const fromDate = new Date(from);
    if (!isNaN(fromDate.getTime())) dateFilter.gte = fromDate;
  }
  if (to) {
    const toDate = new Date(to);
    if (!isNaN(toDate.getTime())) dateFilter.lte = toDate;
  }

  // 현재 일정과 일치하는 로그 + 레거시(일정 미기록) 로그만 조회
  const logs = await prisma.checkLog.findMany({
    where: {
      accommodationId: id,
      priceAmount: { not: null },
      OR: [{ checkIn: accommodation.checkIn, checkOut: accommodation.checkOut }, { checkIn: null }],
      ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
    },
    select: {
      createdAt: true,
      priceAmount: true,
      priceCurrency: true,
      pricePerNight: true,
      checkIn: true,
    },
    orderBy: { createdAt: 'desc' },
    take: MAX_RECORDS,
  });

  if (logs.length === 0) {
    return NextResponse.json({ prices: [], stats: null });
  }

  // 최신순 → 시간순 정렬
  logs.reverse();

  // 이동평균 계산 + 데이터 포인트 생성
  const prices = logs.map((log, idx) => {
    const currentTime = log.createdAt.getTime();
    const windowStart = currentTime - MOVING_AVG_WINDOW_MS;

    let sum = 0;
    let count = 0;
    for (let j = idx; j >= 0; j--) {
      if (logs[j].createdAt.getTime() < windowStart) break;
      sum += logs[j].priceAmount as number;
      count++;
    }

    return {
      createdAt: log.createdAt.toISOString(),
      priceAmount: log.priceAmount as number,
      priceCurrency: log.priceCurrency ?? 'KRW',
      pricePerNight: log.pricePerNight,
      movingAvg: count >= 2 ? Math.round(sum / count) : null,
      isLegacy: log.checkIn === null,
    };
  });

  // 전체 가격 통계
  let min = Infinity;
  let minDate = '';
  let max = -Infinity;
  let maxDate = '';
  let sum = 0;

  for (const p of prices) {
    if (p.priceAmount < min) {
      min = p.priceAmount;
      minDate = p.createdAt;
    }
    if (p.priceAmount > max) {
      max = p.priceAmount;
      maxDate = p.createdAt;
    }
    sum += p.priceAmount;
  }

  // 박당 가격 통계
  const perNightPrices = prices.filter((p) => p.pricePerNight != null);
  let perNight = null;

  if (perNightPrices.length > 0) {
    let pnMin = Infinity;
    let pnMinDate = '';
    let pnMax = -Infinity;
    let pnMaxDate = '';
    let pnSum = 0;

    for (const p of perNightPrices) {
      const pn = p.pricePerNight as number;
      if (pn < pnMin) {
        pnMin = pn;
        pnMinDate = p.createdAt;
      }
      if (pn > pnMax) {
        pnMax = pn;
        pnMaxDate = p.createdAt;
      }
      pnSum += pn;
    }

    const lastPerNight = perNightPrices[perNightPrices.length - 1];

    perNight = {
      min: pnMin,
      minDate: pnMinDate,
      max: pnMax,
      maxDate: pnMaxDate,
      avg: Math.round(pnSum / perNightPrices.length),
      current: lastPerNight.pricePerNight,
    };
  }

  const lastLog = logs[logs.length - 1];

  return NextResponse.json({
    prices,
    stats: {
      min,
      minDate,
      max,
      maxDate,
      avg: Math.round(sum / prices.length),
      current: lastLog.priceAmount,
      currentCurrency: lastLog.priceCurrency ?? 'KRW',
      count: prices.length,
      perNight,
    },
  });
}
