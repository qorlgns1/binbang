import { createHmac, timingSafeEqual } from 'node:crypto';

import { prisma } from '@workspace/db';

interface UnsubscribePayload {
  accommodationId: string;
  email: string;
  exp: number;
}

function getSecret(): string {
  const secret = process.env.MOONCATCH_UNSUBSCRIBE_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  if (secret) return secret;

  if (process.env.NODE_ENV === 'production') {
    throw new Error('MOONCATCH_UNSUBSCRIBE_SECRET is required in production');
  }

  return 'agoda-dev-unsubscribe-secret';
}

function toBase64Url(value: Buffer | string): string {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value, 'utf8');
  return buffer.toString('base64url');
}

function fromBase64Url(value: string): Buffer {
  return Buffer.from(value, 'base64url');
}

function sign(payloadPart: string, secret: string): string {
  return createHmac('sha256', secret).update(payloadPart).digest('base64url');
}

export function createAgodaUnsubscribeToken(params: {
  accommodationId: string;
  email: string;
  expiresInSeconds?: number;
}): string {
  const expiresInSeconds = params.expiresInSeconds ?? 60 * 60 * 24 * 30;
  const payload: UnsubscribePayload = {
    accommodationId: params.accommodationId,
    email: params.email.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };

  const payloadPart = toBase64Url(JSON.stringify(payload));
  const signature = sign(payloadPart, getSecret());
  return `${payloadPart}.${signature}`;
}

export function verifyAgodaUnsubscribeToken(token: string): UnsubscribePayload {
  const [payloadPart, signaturePart] = token.split('.');
  if (!payloadPart || !signaturePart) {
    throw new Error('invalid token format');
  }

  const expectedSignature = sign(payloadPart, getSecret());
  const expectedBuffer = fromBase64Url(expectedSignature);
  const providedBuffer = fromBase64Url(signaturePart);

  if (expectedBuffer.length !== providedBuffer.length || !timingSafeEqual(expectedBuffer, providedBuffer)) {
    throw new Error('invalid token signature');
  }

  let payload: unknown;
  try {
    payload = JSON.parse(fromBase64Url(payloadPart).toString('utf8')) as unknown;
  } catch {
    throw new Error('invalid token payload');
  }

  if (typeof payload !== 'object' || payload == null) {
    throw new Error('invalid token payload');
  }

  const candidate = payload as Partial<UnsubscribePayload>;
  if (
    typeof candidate.accommodationId !== 'string' ||
    typeof candidate.email !== 'string' ||
    typeof candidate.exp !== 'number'
  ) {
    throw new Error('invalid token payload');
  }

  const nowEpoch = Math.floor(Date.now() / 1000);
  if (candidate.exp < nowEpoch) {
    throw new Error('token expired');
  }

  return {
    accommodationId: candidate.accommodationId,
    email: candidate.email.trim().toLowerCase(),
    exp: candidate.exp,
  };
}

export function buildAgodaUnsubscribeUrl(token: string): string {
  const baseUrl = process.env.NEXTAUTH_URL?.trim() || 'http://localhost:3000';
  return `${baseUrl.replace(/\/$/, '')}/api/unsubscribe?token=${encodeURIComponent(token)}`;
}

export async function unsubscribeAgodaAccommodation(params: { accommodationId: string; email: string }): Promise<void> {
  await prisma.$transaction([
    prisma.agodaConsentLog.create({
      data: {
        email: params.email.trim().toLowerCase(),
        type: 'opt_out',
        accommodation: { connect: { id: params.accommodationId } },
      },
    }),
    prisma.accommodation.update({
      where: { id: params.accommodationId },
      data: { isActive: false },
    }),
  ]);
}
