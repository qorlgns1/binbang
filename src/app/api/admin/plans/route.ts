import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { QuotaKey } from '@/generated/prisma/enums';
import { requireAdmin } from '@/lib/admin';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const plans = await prisma.plan.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        interval: true,
        quotas: {
          select: {
            key: true,
            value: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
      orderBy: { price: 'asc' },
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error('Admin plans fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const createPlanSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  description: z.string().nullable().optional(),
  price: z.number().min(0),
  interval: z.string().default('month'),
  maxAccommodations: z.number().min(1),
  checkIntervalMin: z.number().min(1),
});

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createPlanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters', details: parsed.error.errors }, { status: 400 });
    }

    const { name, description, price, interval, maxAccommodations, checkIntervalMin } = parsed.data;

    // 이름 중복 체크
    const existing = await prisma.plan.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: '이미 존재하는 플랜 이름입니다' }, { status: 400 });
    }

    const plan = await prisma.plan.create({
      data: {
        name,
        description: description ?? null,
        price,
        interval,
        quotas: {
          create: [
            { key: QuotaKey.MAX_ACCOMMODATIONS, value: maxAccommodations },
            { key: QuotaKey.CHECK_INTERVAL_MIN, value: checkIntervalMin },
          ],
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        interval: true,
        quotas: { select: { key: true, value: true } },
        _count: { select: { users: true } },
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error('Admin plan create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
