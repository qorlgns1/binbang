import prisma from '@/lib/prisma';

export interface HeartbeatHistoryItem {
  id: number;
  timestamp: Date;
  status: 'healthy' | 'unhealthy' | 'processing';
  isProcessing: boolean;
  uptime?: number | null;
  workerId: string;
}

export async function recordHeartbeatHistory(
  status: 'healthy' | 'unhealthy' | 'processing',
  isProcessing: boolean,
  uptime?: number,
): Promise<void> {
  try {
    await prisma.heartbeatHistory.create({
      data: {
        status,
        isProcessing,
        uptime,
        workerId: 'singleton',
      },
    });

    // 24시간 이전 데이터 자동 정리 (t2.micro 메모리 관리)
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    await prisma.heartbeatHistory.deleteMany({
      where: {
        timestamp: {
          lt: oneDayAgo,
        },
      },
    });
  } catch (error) {
    console.error('하트비트 히스토리 기록 실패:', error);
  }
}

export async function getHeartbeatHistory(hours: number = 24): Promise<HeartbeatHistoryItem[]> {
  try {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    return (await prisma.heartbeatHistory.findMany({
      where: {
        timestamp: {
          gte: since,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    })) as HeartbeatHistoryItem[];
  } catch (error) {
    console.error('하트비트 히스토리 조회 실패:', error);
    return [];
  }
}
