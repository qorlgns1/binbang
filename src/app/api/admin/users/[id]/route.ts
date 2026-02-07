import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import prisma from '@/lib/prisma';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        roles: { select: { name: true } },
        plan: { select: { name: true } },
        _count: {
          select: { accommodations: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      createdAt: user.createdAt.toISOString(),
      roles: user.roles.map((r) => r.name),
      planName: user.plan?.name ?? null,
      _count: user._count,
    });
  } catch (error) {
    console.error('Admin user detail fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
