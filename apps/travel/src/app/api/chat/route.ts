import type { UIMessage } from 'ai';
import { convertToModelMessages, stepCountIs, streamText } from 'ai';
import { z } from 'zod';

import { geminiFlashLite } from '@/lib/ai/model';
import { TRAVEL_SYSTEM_PROMPT } from '@/lib/ai/systemPrompt';
import { travelTools } from '@/lib/ai/tools';
import { saveConversationMessages } from '@/services/conversation.service';

export const maxDuration = 60;

const postBodySchema = z.object({
  messages: z.array(z.unknown()).min(1, 'messages array is required'),
  sessionId: z.string().optional(),
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

  const { messages, sessionId: clientSessionId } = parsed.data as {
    messages: UIMessage[];
    sessionId?: string;
  };
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

  const modelMessages = await convertToModelMessages(messages);

  const sessionId = clientSessionId?.trim() ?? `server_${Date.now()}`;

  const result = streamText({
    model: geminiFlashLite,
    system: TRAVEL_SYSTEM_PROMPT,
    messages: modelMessages,
    tools: travelTools,
    stopWhen: stepCountIs(5),
    onFinish: async ({ text, toolCalls, toolResults }) => {
      try {
        await saveConversationMessages({
          sessionId,
          userMessage: lastUserText,
          assistantMessage: text,
          toolCalls: toolCalls as unknown[],
          toolResults: toolResults as unknown[],
        });
      } catch (error) {
        console.error('Failed to save conversation:', error);
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
