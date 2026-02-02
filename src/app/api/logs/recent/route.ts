import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const recentLogs = await prisma.checkLog.findMany({
    where: { userId: session.user.id },
    include: { accommodation: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return NextResponse.json(recentLogs);
}
