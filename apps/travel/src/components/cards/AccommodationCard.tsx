'use client';

import { ExternalLink, MapPin, Tag } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AffiliateNoticeModal } from '@/components/cards/AffiliateNoticeModal';
import {
  AFFILIATE_DISCLOSURE_TEXT,
  type AffiliateTrackingContext,
  trackAffiliateCardCtaAttempt,
  trackAffiliateCardImpression,
  trackAffiliateCardOutboundClick,
} from '@/components/cards/affiliateCardUtils';
import { resolveAccommodationAffiliateFallbackState } from '@/components/cards/affiliateFallbackState';
import { StarRating } from '@/components/ui/StarRating';
import { isAffiliateCtaEnabled } from '@/lib/featureFlags';
import type { AccommodationEntity } from '@/lib/types';

interface AccommodationCardProps {
  accommodation: AccommodationEntity;
  /** true = 광고주 링크가 생성됨 → CTA 활성 */
  ctaEnabled: boolean;
  trackingContext?: AffiliateTrackingContext;
}

function formatAffiliatePrice(amount: number, currency?: string): string {
  if (!Number.isFinite(amount)) return '';
  if (!currency) return amount.toLocaleString();

  try {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
}

export function AccommodationCard({ accommodation, ctaEnabled, trackingContext }: AccommodationCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const ctaFeatureEnabled = isAffiliateCtaEnabled();
  const showAffiliateBadge = accommodation.isAffiliate;
  const hasLink = Boolean(ctaFeatureEnabled && accommodation.isAffiliate && ctaEnabled && accommodation.affiliateLink);
  const provider = trackingContext?.provider ?? 'agoda_pending:accommodation';
  const fallbackState = resolveAccommodationAffiliateFallbackState(provider, accommodation.isAvailable);

  useEffect(() => {
    if (!accommodation.isAffiliate) return;
    trackAffiliateCardImpression({
      trackingContext,
      provider,
      productId: accommodation.placeId,
      productName: accommodation.name,
      category: 'accommodation',
      isCtaEnabled: hasLink,
    });
  }, [accommodation.isAffiliate, accommodation.name, accommodation.placeId, hasLink, provider, trackingContext]);

  function handleCtaClick() {
    if (hasLink) return; // <a> 태그가 직접 처리
    if (fallbackState.isUnavailable) {
      toast('현재 예약 불가', {
        description: 'Agoda 실시간 가용성 기준으로 현재 예약 가능한 객실이 없습니다.',
        duration: 3000,
      });
    } else if (fallbackState.reasonCode === 'affiliate_links_disabled') {
      toast('제휴 링크 비활성화', {
        description: '현재 대화 설정에서 제휴 링크가 비활성화되어 있습니다.',
        duration: 3000,
      });
    } else {
      toast('제휴 링크 준비 중', {
        description: '현재 해당 카테고리의 제휴 광고주를 등록하는 중입니다. 조금만 기다려주세요.',
        duration: 3000,
      });
    }

    trackAffiliateCardCtaAttempt({
      trackingContext,
      provider,
      reasonCode: fallbackState.reasonCode,
      productId: accommodation.placeId,
      productName: accommodation.name,
      category: 'accommodation',
    });

    setModalOpen(true);
  }

  return (
    <>
      <div className='flex flex-col w-full rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all duration-300'>
        {/* 이미지 */}
        <div className='relative aspect-4/3 w-full overflow-hidden bg-muted'>
          {showAffiliateBadge && (
            <span className='absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm'>
              <Tag className='h-2.5 w-2.5' />
              광고/제휴
            </span>
          )}
          {accommodation.photoUrl ? (
            <Image
              src={accommodation.photoUrl}
              alt={accommodation.name}
              fill
              sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px'
              className='object-cover transition-transform duration-300 hover:scale-105'
              unoptimized
            />
          ) : (
            <div className='flex h-full items-center justify-center'>
              <span className='text-xs text-muted-foreground'>이미지 없음</span>
            </div>
          )}
        </div>

        {/* 정보 */}
        <div className='p-3 flex flex-col gap-1.5 flex-1'>
          <h4 className='font-semibold text-sm text-card-foreground line-clamp-1'>{accommodation.name}</h4>

          {accommodation.rating != null && (
            <div className='flex items-center gap-1'>
              <StarRating rating={accommodation.rating ?? 0} />
              <span className='text-xs font-medium text-card-foreground'>{accommodation.rating}</span>
              {accommodation.userRatingsTotal != null && (
                <span className='text-[10px] text-muted-foreground'>
                  ({accommodation.userRatingsTotal.toLocaleString()})
                </span>
              )}
            </div>
          )}

          <div className='flex items-start gap-1 text-xs text-muted-foreground'>
            <MapPin className='h-3 w-3 shrink-0 mt-0.5' />
            <span className='line-clamp-1'>{accommodation.address}</span>
          </div>

          {/* Stage A/B: 가격/가용성 필드 */}
          {accommodation.isAffiliate && (
            <>
              {accommodation.priceAmount != null && accommodation.priceCurrency ? (
                <p className='text-xs font-medium text-card-foreground'>
                  실시간가 {formatAffiliatePrice(accommodation.priceAmount, accommodation.priceCurrency)} (
                  {accommodation.priceCurrency})
                </p>
              ) : (
                <p className='text-[10px] text-muted-foreground italic'>가격은 제휴 연동 후 제공됩니다</p>
              )}
              {accommodation.isAvailable === false ? (
                <p className='text-[10px] text-destructive'>실시간 가용성: 예약 불가</p>
              ) : accommodation.isAvailable === true ? (
                <p className='text-[10px] text-emerald-600'>실시간 가용성: 예약 가능</p>
              ) : null}
            </>
          )}
        </div>

        {/* CTA 버튼 */}
        {accommodation.isAffiliate && (
          <div className='px-3 pb-3'>
            {hasLink ? (
              <a
                href={accommodation.affiliateLink}
                target='_blank'
                rel='noopener noreferrer sponsored'
                onClick={() => {
                  trackAffiliateCardOutboundClick({
                    trackingContext,
                    provider,
                    productId: accommodation.placeId,
                    productName: accommodation.name,
                    category: 'accommodation',
                  });
                }}
                className='flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-150 hover:bg-primary/90 hover:shadow-md active:scale-95'
              >
                <ExternalLink className='h-4 w-4' aria-hidden />
                예약하기
              </a>
            ) : (
              <button
                type='button'
                onClick={handleCtaClick}
                className='flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-muted/50 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted cursor-not-allowed'
                aria-haspopup='dialog'
              >
                {fallbackState.buttonLabel}
              </button>
            )}
            <p className='mt-1.5 text-center text-[10px] text-muted-foreground'>{AFFILIATE_DISCLOSURE_TEXT}</p>
          </div>
        )}
      </div>

      <AffiliateNoticeModal
        open={modalOpen}
        title={fallbackState.modalTitle}
        titleId='aff-modal-title'
        description={fallbackState.modalDescription}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
