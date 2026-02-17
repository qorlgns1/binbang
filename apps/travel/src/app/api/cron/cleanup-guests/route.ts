import { cleanupGuestConversations } from '@/services/conversation.service';

/**
 * 게스트 세션 정리 Cron
 * - 7일 이상 된 게스트 대화(userId=null) 삭제
 * - Vercel Cron 또는 수동 호출
 * - CRON_SECRET 헤더로 인증 (설정된 경우)
 */
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  try {
    const deletedCount = await cleanupGuestConversations();

    return new Response(
      JSON.stringify({
        success: true,
        deletedCount,
        message: `${deletedCount} guest conversations deleted`,
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
