import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { createAuditLog } from '@/lib/auditLog';
import prisma from '@/lib/prisma';

const rolesUpdateSchema = z.object({
  roles: z.array(z.string()).min(1, '최소 1개의 역할이 필요합니다'),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    if (session.user.id === id) {
      return NextResponse.json({ error: '자기 자신의 역할은 변경할 수 없습니다' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = rolesUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters', details: parsed.error.errors }, { status: 400 });
    }

    const oldUser = await prisma.user.findUnique({
      where: { id },
      select: { roles: { select: { name: true } } },
    });

    if (!oldUser) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 });
    }

    const oldRoles = oldUser.roles.map((r) => r.name);

    const user = await prisma.user.update({
      where: { id },
      data: {
        roles: {
          set: parsed.data.roles.map((name) => ({ name })),
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        roles: { select: { name: true } },
        plan: { select: { name: true } },
        createdAt: true,
        _count: {
          select: {
            accommodations: true,
          },
        },
      },
    });

    await createAuditLog({
      actorId: session.user.id,
      targetId: id,
      entityType: 'User',
      action: 'role.assign',
      oldValue: oldRoles,
      newValue: parsed.data.roles,
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
    console.error('Admin roles update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
