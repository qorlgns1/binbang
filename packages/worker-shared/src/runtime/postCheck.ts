import type { AvailabilityStatus } from '@workspace/db';
import { getDataSource, Accommodation, CheckLog, IsNull, Not } from '@workspace/db';
import { type AccommodationMetadata, parsePrice } from '@workspace/shared';

import { notifyAvailable } from './notifications.js';
import { isSameStayDates, shouldSendAvailabilityNotification } from './status.js';

export interface SendNotificationInput {
  accommodationId: string;
  userId: string;
  name: string;
  checkIn: string;
  checkOut: string;
  lastStatus: AvailabilityStatus | null;
  kakaoAccessToken: string | null;
  price: string | null;
  checkUrl: string;
}

export async function sendNotificationIfNeeded(
  input: SendNotificationInput,
  status: AvailabilityStatus,
): Promise<void> {
  const checkIn = new Date(input.checkIn);
  const checkOut = new Date(input.checkOut);

  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
    console.warn('Invalid stay dates', {
      accommodationId: input.accommodationId,
      userId: input.userId,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
    });
    return;
  }

  let effectiveLastStatus: AvailabilityStatus | null = input.lastStatus;
  const ds = await getDataSource();

  // 두 번째 최근 로그 조회 (skip: 1)
  const recentLogs = await ds.getRepository(CheckLog).find({
    where: {
      accommodationId: input.accommodationId,
      userId: input.userId,
      checkIn: Not(IsNull()),
      checkOut: Not(IsNull()),
    },
    order: { createdAt: 'DESC' },
    select: { checkIn: true, checkOut: true },
    take: 1,
    skip: 1,
  });
  const lastLog = recentLogs[0] ?? null;

  if (lastLog?.checkIn && lastLog?.checkOut) {
    const datesChanged = !isSameStayDates(
      { checkIn, checkOut },
      { checkIn: lastLog.checkIn, checkOut: lastLog.checkOut },
    );
    if (datesChanged) {
      effectiveLastStatus = null;
    }
  }

  const shouldNotify = shouldSendAvailabilityNotification(status, effectiveLastStatus, Boolean(input.kakaoAccessToken));

  if (!shouldNotify) return;

  console.log(`  Sending Kakao notification...`);

  const sent = await notifyAvailable(input.userId, input.name, checkIn, checkOut, input.price, input.checkUrl);

  if (sent) {
    await ds
      .createQueryBuilder()
      .update(CheckLog)
      .set({ notificationSent: true })
      .where(
        '"accommodationId" = :accommodationId AND "userId" = :userId AND "checkIn" = :checkIn AND "checkOut" = :checkOut AND "notificationSent" = 0',
        { accommodationId: input.accommodationId, userId: input.userId, checkIn, checkOut },
      )
      .execute();
  }
}

export async function updateAccommodationStatus(
  accommodationId: string,
  status: AvailabilityStatus,
  price: string | null,
  metadata?: AccommodationMetadata,
): Promise<void> {
  const parsed = parsePrice(price);

  const updateData: Record<string, unknown> = {
    lastCheck: new Date(),
    lastStatus: status,
    lastPrice: price,
    lastPriceAmount: parsed?.amount ?? null,
    lastPriceCurrency: parsed?.currency ?? null,
  };

  if (metadata && Object.keys(metadata).length > 0) {
    if (metadata.platformId) updateData.platformId = metadata.platformId;
    if (metadata.platformName) updateData.platformName = metadata.platformName;
    if (metadata.platformImage) updateData.platformImage = metadata.platformImage;
    if (metadata.platformDescription) updateData.platformDescription = metadata.platformDescription;
    if (metadata.addressCountry) updateData.addressCountry = metadata.addressCountry;
    if (metadata.addressRegion) updateData.addressRegion = metadata.addressRegion;
    if (metadata.addressLocality) updateData.addressLocality = metadata.addressLocality;
    if (metadata.postalCode) updateData.postalCode = metadata.postalCode;
    if (metadata.streetAddress) updateData.streetAddress = metadata.streetAddress;
    if (metadata.ratingValue !== undefined) updateData.ratingValue = metadata.ratingValue;
    if (metadata.reviewCount !== undefined) updateData.reviewCount = metadata.reviewCount;
    if (metadata.latitude !== undefined) updateData.latitude = metadata.latitude;
    if (metadata.longitude !== undefined) updateData.longitude = metadata.longitude;
    if (metadata.rawJsonLd) updateData.platformMetadata = metadata.rawJsonLd;
  }

  const ds = await getDataSource();
  await ds.getRepository(Accommodation).update({ id: accommodationId }, updateData);
}
