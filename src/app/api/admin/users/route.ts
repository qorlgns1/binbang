import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import type { Prisma } from '@/generated/prisma/client';
import { requireAdmin } from '@/lib/admin';
import prisma from '@/lib/prisma';
import type { AdminUserInfo, AdminUsersResponse } from '@/types/admin';

const usersParamsSchema = z.object({
  search: z.string().optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = usersParamsSchema.safeParse(params);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters', details: parsed.error.errors }, { status: 400 });
    }

    const { search, role, cursor, limit } = parsed.data;

    const where: Prisma.UserWhereInput = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            accommodations: true,
          },
        },
      },
    });

    const total = cursor ? undefined : await prisma.user.count({ where });

    const hasMore = users.length > limit;
    const items = hasMore ? users.slice(0, limit) : users;

    const response: AdminUsersResponse = {
      users: items.map(
        (user): AdminUserInfo => ({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          createdAt: user.createdAt.toISOString(),
          _count: user._count,
        }),
      ),
      nextCursor: hasMore ? items[items.length - 1].id : null,
      ...(total !== undefined ? { total } : {}),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
