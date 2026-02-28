import { getBinbangRuntimeSettings } from '@/services/binbang-runtime-settings.service';

interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

async function sendByConsole(params: SendEmailParams): Promise<{ provider: string; messageId: string }> {
  const messageId = `console-${Date.now()}`;
  console.info('[agoda-email:console]', {
    messageId,
    to: params.to,
    subject: params.subject,
    text: params.text,
  });
  return { provider: 'console', messageId };
}

async function sendByResend(
  params: SendEmailParams,
  fromEmail: string,
): Promise<{ provider: string; messageId: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is required for resend provider');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [params.to],
      subject: params.subject,
      text: params.text,
      ...(params.html ? { html: params.html } : {}),
    }),
  });

  const json = (await response.json().catch(() => null)) as { id?: string; message?: string } | null;
  if (!response.ok) {
    throw new Error(`Resend send failed (${response.status}): ${json?.message ?? 'unknown error'}`);
  }

  return {
    provider: 'resend',
    messageId: json?.id ?? `resend-${Date.now()}`,
  };
}

export async function sendAgodaAlertEmail(params: SendEmailParams): Promise<{ provider: string; messageId: string }> {
  const runtimeSettings = await getBinbangRuntimeSettings();
  const provider = runtimeSettings.emailProvider;
  if (provider === 'resend') {
    return sendByResend(params, runtimeSettings.fromEmail);
  }
  return sendByConsole(params);
}
