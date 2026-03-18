'use client';

import { ExternalLink, Globe2, Smartphone, Tag } from 'lucide-react';
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
import { resolveEsimAffiliateFallbackState } from '@/components/cards/affiliateFallbackState';
import { isAffiliateCtaEnabled } from '@/lib/featureFlags';
import type { EsimEntity } from '@/lib/types';

interface EsimCardProps {
  esim: EsimEntity;
  /** true = 광고주 링크가 생성됨 → CTA 활성 */
  ctaEnabled: boolean;
  trackingContext?: AffiliateTrackingContext;
}

export function EsimCard({ esim, ctaEnabled, trackingContext }: EsimCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const ctaFeatureEnabled = isAffiliateCtaEnabled();
  const hasLink = Boolean(ctaFeatureEnabled && esim.isAffiliate && ctaEnabled && esim.affiliateLink);
  const provider = trackingContext?.provider ?? 'awin_pending:esim';
  const fallbackState = resolveEsimAffiliateFallbackState(provider);

  useEffect(() => {
    if (!esim.isAffiliate) return;
    trackAffiliateCardImpression({
      trackingContext,
      provider,
      productId: esim.productId,
      productName: esim.name,
      category: 'esim',
      isCtaEnabled: hasLink,
    });
  }, [esim.isAffiliate, esim.name, esim.productId, hasLink, provider, trackingContext]);

  function handleCtaClick() {
    if (hasLink) return; // <a> 태그가 직접 처리
    toast(fallbackState.toastTitle, {
      description: fallbackState.toastDescription,
      duration: 3000,
    });

    trackAffiliateCardCtaAttempt({
      trackingContext,
      provider,
      reasonCode: fallbackState.reasonCode,
      productId: esim.productId,
      productName: esim.name,
      category: 'esim',
    });

    setModalOpen(true);
  }

  return (
    <>
      <div className='w-full rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/40 hover:shadow-lg'>
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0'>
            <div className='flex items-center gap-2'>
              {esim.isAffiliate && (
                <span className='inline-flex items-center gap-1 rounded-full bg-black/80 px-2 py-0.5 text-[10px] font-medium text-white'>
                  <Tag className='h-2.5 w-2.5' />
                  광고/제휴
                </span>
              )}
            </div>

            <div className='mt-2 flex items-center gap-2'>
              <span className='inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary'>
                <Smartphone className='h-4 w-4' />
              </span>
              <div className='min-w-0'>
                <h4 className='line-clamp-1 text-sm font-semibold text-card-foreground'>{esim.name}</h4>
                {esim.advertiserName && <p className='text-xs text-muted-foreground'>{esim.advertiserName}</p>}
              </div>
            </div>

            <p className='mt-3 text-xs text-muted-foreground'>{esim.description}</p>
            <div className='mt-1.5 flex items-center gap-1 text-xs text-muted-foreground'>
              <Globe2 className='h-3.5 w-3.5 shrink-0' />
              <span>{esim.coverage}</span>
            </div>
          </div>
        </div>

        {esim.isAffiliate && (
          <div className='mt-4'>
            {hasLink ? (
              <a
                href={esim.affiliateLink}
                target='_blank'
                rel='noopener noreferrer sponsored'
                onClick={() => {
                  trackAffiliateCardOutboundClick({
                    trackingContext,
                    provider,
                    productId: esim.productId,
                    productName: esim.name,
                    category: 'esim',
                  });
                }}
                className='flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-150 hover:bg-primary/90 hover:shadow-md active:scale-95'
              >
                <ExternalLink className='h-4 w-4' aria-hidden />
                eSIM 확인하기
              </a>
            ) : (
              <button
                type='button'
                onClick={handleCtaClick}
                className='flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-border bg-muted/50 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted'
                aria-disabled='true'
              >
                제휴 링크 준비중
              </button>
            )}
            <p className='mt-1.5 text-center text-[10px] text-muted-foreground'>{AFFILIATE_DISCLOSURE_TEXT}</p>
          </div>
        )}
      </div>

      <AffiliateNoticeModal
        open={modalOpen}
        title='eSIM 제휴 링크 준비 중'
        titleId='esim-aff-modal-title'
        description={
          <>
            현재 eSIM 제휴 광고주를 연결하는 중입니다.
            <br />
            연동이 완료되면 구매 링크가 바로 활성화됩니다.
          </>
        }
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
