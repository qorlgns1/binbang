import type { UIMessage } from 'ai';
import { convertToModelMessages, stepCountIs, streamText } from 'ai';

import { geminiFlashLite } from '@/lib/ai/model';
import { TRAVEL_SYSTEM_PROMPT } from '@/lib/ai/systemPrompt';
import { travelTools } from '@/lib/ai/tools';
import { saveConversationMessages } from '@/services/conversation.service';

export const maxDuration = 60;

export async function POST(req: Request) {
  const body = (await req.json()) as {
    messages: UIMessage[];
  };

  const { messages } = body;
  const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
  const lastUserText =
    lastUserMessage?.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('') ?? '';

  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: geminiFlashLite,
    system: TRAVEL_SYSTEM_PROMPT,
    messages: modelMessages,
    tools: travelTools,
    stopWhen: stepCountIs(5),
    onFinish: async ({ text, toolCalls, toolResults }) => {
      try {
        await saveConversationMessages({
          sessionId: `server_${Date.now()}`,
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
