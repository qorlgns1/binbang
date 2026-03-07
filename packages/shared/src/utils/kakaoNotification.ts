export interface KakaoNotificationSenderInput {
  name?: string | null;
  email?: string | null;
  userId?: string | null;
}

export interface KakaoNotificationSender {
  displayName: string;
  label: string;
}

function normalizeDisplayName(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function deriveNameFromEmail(email?: string | null): string | null {
  const trimmed = email?.trim();
  if (!trimmed) return null;
  const localPart = trimmed.split('@')[0]?.trim();
  return localPart || null;
}

function deriveNameFromUserId(userId?: string | null): string | null {
  const trimmed = userId?.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 8);
}

export function buildKakaoNotificationSender(input: KakaoNotificationSenderInput): KakaoNotificationSender {
  const displayName =
    normalizeDisplayName(input.name) ?? deriveNameFromEmail(input.email) ?? deriveNameFromUserId(input.userId) ?? 'unknown';

  return {
    displayName,
    label: `[${displayName}]`,
  };
}

export function prependKakaoNotificationSender(message: string, input: KakaoNotificationSenderInput): string {
  const body = message.trim();
  const sender = buildKakaoNotificationSender(input);
  return body ? `${sender.label}\n${body}` : sender.label;
}
