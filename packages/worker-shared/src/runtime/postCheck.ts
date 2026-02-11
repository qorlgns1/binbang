import type { AvailabilityStatus } from '@workspace/db';
import { prisma } from '@workspace/db';
import { type AccommodationMetadata, parsePrice } from '@workspace/shared';

import { notifyAvailable } from './notifications';
import { isSameStayDates, shouldSendAvailabilityNotification } from './status';

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

  let effectiveLastStatus: AvailabilityStatus | null = input.lastStatus;

  const lastLog = await prisma.checkLog.findFirst({
    where: { accommodationId: input.accommodationId, checkIn: { not: null } },
    orderBy: { createdAt: 'desc' },
    select: { checkIn: true, checkOut: true },
    skip: 1,
  });

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
    await prisma.checkLog.updateMany({
      where: {
        accommodationId: input.accommodationId,
        notificationSent: false,
      },
      data: {
        notificationSent: true,
      },
    });
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

  await prisma.accommodation.update({
    where: { id: accommodationId },
    data: updateData,
    select: { id: true },
  });
}
