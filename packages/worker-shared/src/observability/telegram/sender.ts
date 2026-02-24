import axios from 'axios';

export interface SendTelegramMessageParams {
  chatId: string;
  text: string;
  parseMode?: 'MarkdownV2' | 'HTML';
  threadId?: string | number | null;
  disableWebPagePreview?: boolean;
  disableNotification?: boolean;
}

/** runtime/settings 에서 env를 읽어 전달한다. observability는 process.env에 접근하지 않는다. */
export interface SendTelegramConfig {
  botToken: string;
}

export type SendTelegramMessageResult = 'sent' | 'invalid_config' | 'failed';

const TELEGRAM_API_BASE = 'https://api.telegram.org';

function toTelegramThreadId(value: string | number | null | undefined): number | null {
  if (value == null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);

  const parsed = Number.parseInt(String(value).trim(), 10);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

export async function sendTelegramMessageHttp(
  params: SendTelegramMessageParams,
  config: SendTelegramConfig | null,
): Promise<SendTelegramMessageResult> {
  const botToken = config?.botToken?.trim();
  if (!botToken) return 'invalid_config';

  const chatId = params.chatId.trim();
  if (!chatId) return 'invalid_config';

  const url = `${TELEGRAM_API_BASE}/bot${botToken}/sendMessage`;
  const threadId = toTelegramThreadId(params.threadId);

  try {
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text: params.text,
      parse_mode: params.parseMode ?? 'MarkdownV2',
      disable_web_page_preview: params.disableWebPagePreview ?? true,
      disable_notification: params.disableNotification ?? false,
    };

    if (threadId != null) {
      body.message_thread_id = threadId;
    }

    await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10_000,
    });

    return 'sent';
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[telegram] send failed:', error.response?.status, error.response?.data);
    } else {
      console.error('[telegram] send failed:', error);
    }
    return 'failed';
  }
}
