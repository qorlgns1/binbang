interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

function getProvider(): 'console' | 'resend' {
  const provider = process.env.MOONCATCH_EMAIL_PROVIDER?.trim().toLowerCase();
  if (provider === 'resend') return 'resend';
  return 'console';
}

function getFromEmail(): string {
  return process.env.MOONCATCH_FROM_EMAIL?.trim() || 'Mooncatch <no-reply@mooncatch.local>';
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

async function sendByResend(params: SendEmailParams): Promise<{ provider: string; messageId: string }> {
  const apiKey = process.env.MOONCATCH_RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('MOONCATCH_RESEND_API_KEY is required for resend provider');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: getFromEmail(),
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
  const provider = getProvider();
  if (provider === 'resend') {
    return sendByResend(params);
  }
  return sendByConsole(params);
}
