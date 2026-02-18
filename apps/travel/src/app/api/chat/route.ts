import type { UIMessage } from 'ai';
import { convertToModelMessages, stepCountIs, streamText } from 'ai';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { applyContextWindow } from '@/lib/ai/contextWindow';
import { geminiFlashLite } from '@/lib/ai/model';
import { TRAVEL_SYSTEM_PROMPT } from '@/lib/ai/systemPrompt';
import { travelTools } from '@/lib/ai/tools';
import { authOptions } from '@/lib/auth';
import { extractSessionIdFromRequest } from '@/lib/sessionServer';
import { getConversation, saveConversationMessages } from '@/services/conversation.service';
import {
  GUEST_LIMITS,
  USER_LIMITS,
  checkGuestRateLimitPersistent,
  checkRateLimit,
  checkUserRateLimitPersistent,
  incrementCount,
} from '@/services/rate-limit.service';

export const maxDuration = 60;

const postBodySchema = z.object({
  messages: z.array(z.unknown()).min(1, 'messages array is required'),
  sessionId: z.string().optional(),
  conversationId: z.string().optional(),
  id: z.string().optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const parsed = postBodySchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Validation failed', details: parsed.error.flatten() }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const {
    messages,
    sessionId: clientSessionId,
    conversationId: clientConversationId,
    id: chatId,
  } = parsed.data as {
    messages: UIMessage[];
    sessionId?: string;
    conversationId?: string;
    id?: string;
  };
  const normalizedConversationId = clientConversationId?.trim() || chatId?.trim() || undefined;

  const session = await getServerSession(authOptions);
  const sessionId =
    (await extractSessionIdFromRequest({
      bodySessionId: clientSessionId,
      headerSessionId: req.headers.get('x-travel-session-id'),
      generateIfMissing: true,
    })) ?? crypto.randomUUID();

  // 스트리밍 전에 대화 소유권 검증 (다른 유저/게스트 대화에 메시지 추가 방지)
  if (normalizedConversationId) {
    const conversation = await getConversation(normalizedConversationId);
    if (conversation) {
      const isOwner =
        conversation.userId != null
          ? session?.user?.id === conversation.userId
          : conversation.sessionId === sessionId;
      if (!isOwner) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
  }

  const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
  const lastUserText =
    lastUserMessage?.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('') ?? '';

  if (!lastUserText.trim()) {
    return new Response(JSON.stringify({ error: 'No user message found' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Rate limiting 확인

  const rateLimitKey = session?.user?.id ?? sessionId;
  const limits = session?.user ? USER_LIMITS : GUEST_LIMITS;

  let rateCheck: Awaited<ReturnType<typeof checkRateLimit>>;
  if (session?.user?.id) {
    rateCheck = await checkUserRateLimitPersistent(session.user.id, limits, normalizedConversationId);
  } else {
    try {
      rateCheck = await checkGuestRateLimitPersistent(sessionId, limits, normalizedConversationId);
    } catch (error) {
      console.error('Guest persistent rate-limit check failed; falling back to in-memory check:', error);
      rateCheck = await checkRateLimit(rateLimitKey, limits, normalizedConversationId);
    }
  }

  if (!rateCheck.allowed) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded', reason: rateCheck.reason }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rawModelMessages = await convertToModelMessages(messages);
  const windowSize = Number.parseInt(process.env.CONTEXT_WINDOW_SIZE ?? '10', 10);
  const modelMessages = applyContextWindow(rawModelMessages, windowSize);

  const result = streamText({
    model: geminiFlashLite,
    system: TRAVEL_SYSTEM_PROMPT,
    messages: modelMessages,
    tools: travelTools,
    stopWhen: stepCountIs(5),
    onFinish: async ({ text, toolCalls, toolResults }) => {
      try {
        const result = await saveConversationMessages({
          conversationId: normalizedConversationId,
          sessionId,
          userId: session?.user?.id,
          userMessage: lastUserText,
          assistantMessage: text,
          toolCalls: toolCalls as unknown[],
          toolResults: toolResults as unknown[],
        });

        // 게스트일 때만 in-memory 카운터 증가 (유저는 DB 기반 한도만 사용)
        if (!session?.user?.id) {
          incrementCount(rateLimitKey, result.conversationId, result.isNewConversation);
        }
      } catch (error) {
        console.error('Failed to save conversation:', error);
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
