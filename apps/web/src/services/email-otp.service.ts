import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';

import { Plan, Role, Session, User, VerificationToken, getDataSource } from '@workspace/db';

import { ensureRedisConnected, getRedisClient } from '@/lib/redis';
import { logInfo, logWarn } from '@/lib/logger';
import { sendAgodaAlertEmail } from '@/services/agoda-email.service';

// ============================================================================
// Constants
// ============================================================================

const CODE_LENGTH = 6;
const CODE_TTL_SECONDS = 10 * 60;
const MAX_VERIFY_ATTEMPTS = 5;
const SEND_LIMIT_PER_EMAIL_PER_HOUR = 5;
const SEND_LIMIT_PER_IP_PER_HOUR = 20;
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // createSessionForUser와 동일

/**
 * VerificationToken.identifier는 단독 PK라 이메일당 유효 코드가 하나뿐이다.
 * NextAuth 어댑터가 쓰는 identifier와 충돌하지 않도록 접두사를 붙인다.
 */
const IDENTIFIER_PREFIX = 'email-otp:';

// ============================================================================
// Types
// ============================================================================

export interface IssueEmailOtpInput {
  email: string;
  locale?: string;
  ip?: string | null;
}

export type IssueEmailOtpResult = { status: 'sent' } | { status: 'rate_limited'; retryAfterSeconds: number };

export interface VerifyEmailOtpInput {
  email: string;
  code: string;
}

export type VerifyEmailOtpResult =
  | { status: 'verified'; userId: string; sessionToken: string; expires: Date; isNewUser: boolean }
  | { status: 'invalid' }
  | { status: 'expired' }
  | { status: 'too_many_attempts' };

// ============================================================================
// Internal helpers
// ============================================================================

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toIdentifier(email: string): string {
  return `${IDENTIFIER_PREFIX}${normalizeEmail(email)}`;
}

function getSecret(): string {
  const secret = process.env.BINBANG_UNSUBSCRIBE_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  if (secret) return secret;

  const appEnv = process.env.APP_ENV;
  const isLocalDev =
    process.env.NODE_ENV !== 'production' && (!appEnv || appEnv === 'local' || appEnv === 'development');
  if (!isLocalDev) {
    throw new Error('BINBANG_UNSUBSCRIBE_SECRET (or NEXTAUTH_SECRET) is required');
  }

  return 'binbang-dev-email-otp-secret';
}

/**
 * 코드를 평문으로 저장하지 않는다.
 * VerificationToken.token에는 unique 제약이 있어 6자리 평문은 사용자 간 충돌한다.
 * 이메일을 섞어 해시하면 충돌이 사라지고 저장값만으로는 코드를 복원할 수 없다.
 */
function hashCode(email: string, code: string): string {
  return createHmac('sha256', getSecret())
    .update(`${normalizeEmail(email)}:${code}`)
    .digest('base64url');
}

function generateCode(): string {
  const max = 10 ** CODE_LENGTH;
  return String(randomInt(0, max)).padStart(CODE_LENGTH, '0');
}

function safeEquals(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, 'utf8');
  const bufferB = Buffer.from(b, 'utf8');
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

/**
 * Redis 기반 고정 윈도우 카운터.
 * Redis가 없으면 제한을 적용하지 않고 경고만 남긴다.
 * (코드 자체는 10분 만료 + 1회용 + DB 단일 레코드로 여전히 보호된다.)
 */
async function hitRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const redis = getRedisClient();
  if (!redis || !(await ensureRedisConnected(redis))) {
    logWarn('email_otp_rate_limit_skipped', { key });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }

  if (count > limit) {
    const ttl = await redis.ttl(key);
    return { allowed: false, retryAfterSeconds: ttl > 0 ? ttl : windowSeconds };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

async function countVerifyAttempt(email: string): Promise<number> {
  const redis = getRedisClient();
  if (!redis || !(await ensureRedisConnected(redis))) {
    return 0;
  }

  const key = `email-otp:attempt:${normalizeEmail(email)}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, CODE_TTL_SECONDS);
  }
  return count;
}

async function clearVerifyAttempts(email: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis || !(await ensureRedisConnected(redis))) return;
  await redis.del(`email-otp:attempt:${normalizeEmail(email)}`);
}

function buildOtpEmail(code: string, locale: string): { subject: string; text: string; html: string } {
  const isKorean = locale.toLowerCase().startsWith('ko');
  const minutes = CODE_TTL_SECONDS / 60;

  if (isKorean) {
    return {
      subject: `빈방 인증코드 ${code}`,
      text: `인증코드: ${code}\n\n${minutes}분 안에 입력해주세요.\n본인이 요청하지 않았다면 이 메일을 무시하세요.`,
      html: `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:480px">
  <p>아래 인증코드를 입력하면 알림 등록이 완료됩니다.</p>
  <p style="font-size:32px;font-weight:700;letter-spacing:6px;margin:24px 0">${code}</p>
  <p style="color:#666;font-size:14px">${minutes}분 안에 입력해주세요.<br />본인이 요청하지 않았다면 이 메일을 무시하세요.</p>
</div>`,
    };
  }

  return {
    subject: `Your Binbang code ${code}`,
    text: `Verification code: ${code}\n\nEnter it within ${minutes} minutes.\nIf you did not request this, you can ignore this email.`,
    html: `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:480px">
  <p>Enter this code to finish setting up your alert.</p>
  <p style="font-size:32px;font-weight:700;letter-spacing:6px;margin:24px 0">${code}</p>
  <p style="color:#666;font-size:14px">Expires in ${minutes} minutes.<br />If you did not request this, you can ignore this email.</p>
</div>`,
  };
}

/**
 * 새 코드를 만들어 저장하고 평문을 돌려준다.
 * identifier가 단독 PK라 이전 코드는 자동으로 대체된다.
 */
async function persistNewCode(email: string): Promise<string> {
  const code = generateCode();
  const identifier = toIdentifier(email);
  const expires = new Date(Date.now() + CODE_TTL_SECONDS * 1000);

  const ds = await getDataSource();
  await ds.transaction(async (manager) => {
    const repo = manager.getRepository(VerificationToken);
    await repo.delete({ identifier });
    await repo.save(repo.create({ identifier, token: hashCode(email, code), expires }));
  });

  await clearVerifyAttempts(email);
  return code;
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * 인증코드를 발급해 메일로 보낸다.
 *
 * 계정 존재 여부와 무관하게 항상 동일한 결과를 돌려준다(이메일 열거 방지).
 * 재발송하면 identifier가 단독 PK라 이전 코드는 자동으로 무효가 된다.
 */
export async function issueEmailOtp(input: IssueEmailOtpInput): Promise<IssueEmailOtpResult> {
  const email = normalizeEmail(input.email);
  const locale = input.locale ?? 'ko';

  const emailLimit = await hitRateLimit(`email-otp:send:email:${email}`, SEND_LIMIT_PER_EMAIL_PER_HOUR, 3600);
  if (!emailLimit.allowed) {
    logWarn('email_otp_send_rate_limited', { scope: 'email' });
    return { status: 'rate_limited', retryAfterSeconds: emailLimit.retryAfterSeconds };
  }

  if (input.ip) {
    const ipLimit = await hitRateLimit(`email-otp:send:ip:${input.ip}`, SEND_LIMIT_PER_IP_PER_HOUR, 3600);
    if (!ipLimit.allowed) {
      logWarn('email_otp_send_rate_limited', { scope: 'ip' });
      return { status: 'rate_limited', retryAfterSeconds: ipLimit.retryAfterSeconds };
    }
  }

  const code = await persistNewCode(email);

  const message = buildOtpEmail(code, locale);
  await sendAgodaAlertEmail({ to: email, subject: message.subject, text: message.text, html: message.html });

  logInfo('email_otp_issued', { ttlSeconds: CODE_TTL_SECONDS });
  return { status: 'sent' };
}

/**
 * 인증코드를 검증하고 세션을 만든다.
 *
 * 계정이 없으면 이 시점에 생성한다(= 사용자에게는 "회원가입"이 노출되지 않는다).
 * 토큰 소비 · 사용자 생성 · 세션 생성은 하나의 트랜잭션으로 처리한다.
 */
export async function verifyEmailOtp(input: VerifyEmailOtpInput): Promise<VerifyEmailOtpResult> {
  const email = normalizeEmail(input.email);
  const identifier = toIdentifier(email);

  const attempts = await countVerifyAttempt(email);
  if (attempts > MAX_VERIFY_ATTEMPTS) {
    const ds = await getDataSource();
    await ds.getRepository(VerificationToken).delete({ identifier });
    logWarn('email_otp_too_many_attempts', { attempts });
    return { status: 'too_many_attempts' };
  }

  const ds = await getDataSource();
  const stored = await ds.getRepository(VerificationToken).findOne({
    where: { identifier },
    select: { identifier: true, token: true, expires: true },
  });

  if (!stored) {
    return { status: 'invalid' };
  }

  if (stored.expires.getTime() < Date.now()) {
    await ds.getRepository(VerificationToken).delete({ identifier });
    return { status: 'expired' };
  }

  if (!safeEquals(stored.token, hashCode(email, input.code))) {
    return { status: 'invalid' };
  }

  const result = await ds.transaction(async (manager) => {
    // 코드는 1회용이다. identifier + token 으로 삭제해 소비를 원자적으로 만든다.
    // 같은 코드로 동시에 두 요청이 들어와도 삭제에 성공한 쪽만 통과한다.
    // (identifier 만으로 지우고 결과를 보지 않으면 양쪽 다 세션을 받는다)
    const consumed = await manager.getRepository(VerificationToken).delete({ identifier, token: stored.token });
    if (consumed.affected !== 1) {
      return null;
    }

    const userRepo = manager.getRepository(User);
    const existing = await userRepo.findOne({
      where: { email },
      select: { id: true, emailVerified: true },
    });

    let userId: string;
    let isNewUser: boolean;

    if (existing) {
      userId = existing.id;
      isNewUser = false;
      // 코드 검증 자체가 이메일 소유 증명이다.
      if (!existing.emailVerified) {
        await userRepo.update({ id: existing.id }, { emailVerified: new Date() });
      }
    } else {
      const freePlan = await manager.getRepository(Plan).findOne({ where: { name: 'FREE' }, select: { id: true } });
      const userRole = await manager
        .getRepository(Role)
        .findOne({ where: { name: 'USER' }, select: { id: true, name: true } });

      const created = userRepo.create({
        email,
        emailVerified: new Date(),
        planId: freePlan?.id ?? null,
        roles: userRole ? [userRole] : [],
      });
      await userRepo.save(created);

      userId = created.id;
      isNewUser = true;
    }

    const sessionRepo = manager.getRepository(Session);
    const sessionToken = crypto.randomUUID();
    const expires = new Date(Date.now() + SESSION_MAX_AGE_MS);
    await sessionRepo.save(sessionRepo.create({ sessionToken, userId, expires }));

    return { userId, sessionToken, expires, isNewUser };
  });

  // 경쟁에서 진 요청. 코드는 이미 다른 요청이 소비했다.
  if (!result) {
    logWarn('email_otp_race_lost', {});
    return { status: 'invalid' };
  }

  await clearVerifyAttempts(email);
  logInfo('email_otp_verified', { isNewUser: result.isNewUser });

  return { status: 'verified', ...result };
}

/**
 * 테스트 전용: 코드를 발급하고 **평문을 반환한다**.
 *
 * 메일을 보내지 않으므로 E2E에서 코드를 받아올 수 있다.
 * 이 함수를 호출하는 라우트는 반드시 production에서 비활성화되어야 한다.
 * 프로덕션 코드 경로에서는 절대 호출하지 않는다.
 */
export async function issueEmailOtpForTest(email: string): Promise<string> {
  return persistNewCode(normalizeEmail(email));
}
