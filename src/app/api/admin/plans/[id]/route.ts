import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { QuotaKey } from '@/generated/prisma/enums';
import { requireAdmin } from '@/lib/admin';
import prisma from '@/lib/prisma';

const updatePlanSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  price: z.number().min(0).optional(),
  interval: z.string().optional(),
  maxAccommodations: z.number().min(1).optional(),
  checkIntervalMin: z.number().min(1).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updatePlanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters', details: parsed.error.errors }, { status: 400 });
    }

    const existing = await prisma.plan.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: '플랜을 찾을 수 없습니다' }, { status: 404 });
    }

    const { name, description, price, interval, maxAccommodations, checkIntervalMin } = parsed.data;

    // 이름 변경 시 중복 체크
    if (name && name !== existing.name) {
      const duplicate = await prisma.plan.findUnique({ where: { name } });
      if (duplicate) {
        return NextResponse.json({ error: '이미 존재하는 플랜 이름입니다' }, { status: 400 });
      }
    }

    // 플랜 기본 정보 업데이트
    await prisma.plan.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(interval !== undefined && { interval }),
      },
    });

    // Quota 업데이트
    if (maxAccommodations !== undefined) {
      await prisma.planQuota.upsert({
        where: { planId_key: { planId: id, key: QuotaKey.MAX_ACCOMMODATIONS } },
        update: { value: maxAccommodations },
        create: { planId: id, key: QuotaKey.MAX_ACCOMMODATIONS, value: maxAccommodations },
      });
    }

    if (checkIntervalMin !== undefined) {
      await prisma.planQuota.upsert({
        where: { planId_key: { planId: id, key: QuotaKey.CHECK_INTERVAL_MIN } },
        update: { value: checkIntervalMin },
        create: { planId: id, key: QuotaKey.CHECK_INTERVAL_MIN, value: checkIntervalMin },
      });
    }

    // 업데이트된 플랜 다시 조회
    const updatedPlan = await prisma.plan.findUnique({
      where: { id },
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

    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error('Admin plan update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const plan = await prisma.plan.findUnique({
      where: { id },
      select: { _count: { select: { users: true } } },
    });

    if (!plan) {
      return NextResponse.json({ error: '플랜을 찾을 수 없습니다' }, { status: 404 });
    }

    if (plan._count.users > 0) {
      return NextResponse.json(
        { error: `이 플랜을 사용 중인 유저가 ${plan._count.users}명 있습니다. 먼저 다른 플랜으로 변경해주세요.` },
        { status: 400 },
      );
    }

    await prisma.plan.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin plan delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
