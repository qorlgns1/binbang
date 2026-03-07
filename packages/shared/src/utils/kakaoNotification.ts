export interface KakaoNotificationSenderInput {
  name?: string | null;
  email?: string | null;
  userId?: string | null;
}

export interface KakaoNotificationContext {
  accessToken: string;
  senderDisplayName: string;
}

export interface KakaoNotificationSender {
  displayName: string;
  label: string;
}

function normalizeDisplayName(value?: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const sanitized = trimmed
    .replace(/[\r\n]+/g, ' ')
    .replaceAll('[', ' ')
    .replaceAll(']', ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return sanitized || null;
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
    normalizeDisplayName(input.name) ??
    normalizeDisplayName(deriveNameFromEmail(input.email)) ??
    normalizeDisplayName(deriveNameFromUserId(input.userId)) ??
    'unknown';

  return {
    displayName,
    label: `[${displayName}]`,
  };
}

export function prependKakaoNotificationLabel(message: string, label: string): string {
  const body = message.trim();
  return body ? `${label}\n${body}` : label;
}

export function prependKakaoNotificationSender(message: string, input: KakaoNotificationSenderInput): string {
  const sender = buildKakaoNotificationSender(input);
  return prependKakaoNotificationLabel(message, sender.label);
}
