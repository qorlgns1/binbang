import { prisma } from '@workspace/db';

/**
 * 게스트 세션 정리 Cron
 * - 7일 이상 된 게스트 대화(userId=null) 삭제
 * - Vercel Cron 또는 수동 호출
 */
export async function GET() {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const result = await prisma.travelConversation.deleteMany({
      where: {
        userId: null, // 게스트 대화만
        createdAt: {
          lt: sevenDaysAgo,
        },
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        deletedCount: result.count,
        message: `${result.count} guest conversations deleted`,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Failed to cleanup guest sessions:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to cleanup guest sessions',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
