import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { createAuditLog } from '@/lib/auditLog';
import prisma from '@/lib/prisma';

const planUpdateSchema = z.object({
  planName: z.string(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const body = await request.json();
    const parsed = planUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters', details: parsed.error.errors }, { status: 400 });
    }

    const plan = await prisma.plan.findUnique({ where: { name: parsed.data.planName } });
    if (!plan) {
      return NextResponse.json({ error: '플랜을 찾을 수 없습니다' }, { status: 404 });
    }

    const oldUser = await prisma.user.findUnique({
      where: { id },
      select: { plan: { select: { name: true } } },
    });

    if (!oldUser) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { planId: plan.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        roles: { select: { name: true } },
        plan: { select: { name: true } },
        createdAt: true,
        _count: { select: { accommodations: true } },
      },
    });

    await createAuditLog({
      actorId: session.user.id,
      targetId: id,
      entityType: 'User',
      action: 'plan.change',
      oldValue: oldUser.plan?.name ?? undefined,
      newValue: parsed.data.planName,
    });

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      roles: user.roles.map((r) => r.name),
      planName: user.plan?.name ?? null,
      createdAt: user.createdAt.toISOString(),
      _count: user._count,
    });
  } catch (error) {
    console.error('Admin plan update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
