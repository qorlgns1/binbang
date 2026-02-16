import axios from 'axios';

// ============================================================================
// Types
// ============================================================================

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

/** 호출부(runtime/settings)에서 env를 읽어 전달한다. observability는 process.env에 접근하지 않는다. */
export interface SendEmailConfig {
  apiKey: string;
  from: string;
}

export type SendEmailResult = 'sent' | 'invalid_config' | 'failed';

// ============================================================================
// Implementation
// ============================================================================

const RESEND_API_URL = 'https://api.resend.com/emails';

function redactEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return '***';
  const local = email.slice(0, at);
  const domain = email.slice(at);
  const safeLocal = local.length <= 2 ? `${local[0]}*` : `${local.slice(0, 2)}***`;
  return `${safeLocal}${domain}`;
}

/**
 * Resend HTTP API를 통해 이메일을 전송한다.
 *
 * config는 runtime/settings getEmailConfig()로 얻어 전달한다. null이면 'invalid_config'를 반환한다.
 */
export async function sendEmailHttp(
  params: SendEmailParams,
  config: SendEmailConfig | null,
): Promise<SendEmailResult> {
  if (!config) {
    return 'invalid_config';
  }

  try {
    await axios.post(
      RESEND_API_URL,
      {
        from: config.from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
      },
      {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10_000,
      },
    );

    console.log(`[email] 이메일 전송 성공: ${redactEmail(params.to)}`);
    return 'sent';
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[email] 이메일 전송 실패:', error.response?.status);
    } else {
      console.error('[email] 이메일 전송 오류:', error instanceof Error ? error.message : error);
    }
    return 'failed';
  }
}

/**
 * 알림 내용을 이메일 HTML로 변환한다.
 */
export function buildNotificationEmailHtml(
  title: string,
  description: string,
  buttonText?: string,
  buttonUrl?: string,
): string {
  const escapedTitle = escapeHtml(title);
  const escapedDesc = escapeHtml(description).replace(/\n/g, '<br>');

  const buttonHtml =
    buttonUrl && buttonText
      ? `<div style="margin-top:24px;text-align:center">
      <a href="${escapeHtml(buttonUrl)}" style="display:inline-block;padding:12px 32px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600">${escapeHtml(buttonText)}</a>
    </div>`
      : '';

  return `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f4f4f5">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <div style="background-color:#2563eb;padding:20px 24px">
      <h1 style="margin:0;color:#ffffff;font-size:18px">${escapedTitle}</h1>
    </div>
    <div style="padding:24px;color:#374151;font-size:14px;line-height:1.6">
      ${escapedDesc}
    </div>
    ${buttonHtml}
    <div style="padding:16px 24px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px;text-align:center">
      BinBang 알림 서비스
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
