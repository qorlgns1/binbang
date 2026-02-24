interface AccommodationAffiliateFallbackState {
  isUnavailable: boolean;
  reasonCode?: 'no_advertiser_for_category' | 'affiliate_links_disabled';
  buttonLabel: string;
  modalTitle: string;
  modalDescription: string;
}

interface EsimAffiliateFallbackState {
  reasonCode?: 'no_advertiser_for_category' | 'affiliate_links_disabled';
  toastTitle: string;
  toastDescription: string;
}

export function resolveAccommodationAffiliateFallbackState(
  provider: string,
  isAvailable: boolean | null | undefined,
): AccommodationAffiliateFallbackState {
  const isPendingProvider = provider.startsWith('awin_pending:') || provider.startsWith('agoda_pending:');
  const isDisabledBySetting = provider.includes('_disabled:');
  const isUnavailable = isAvailable === false;

  return {
    isUnavailable,
    reasonCode: isPendingProvider
      ? 'no_advertiser_for_category'
      : isDisabledBySetting
        ? 'affiliate_links_disabled'
        : undefined,
    buttonLabel: isUnavailable ? '현재 예약 불가' : isDisabledBySetting ? '제휴 링크 비활성화' : '제휴 링크 준비중',
    modalTitle: isUnavailable ? '현재 예약 불가' : isDisabledBySetting ? '제휴 링크 비활성화' : '제휴 링크 준비 중',
    modalDescription: isUnavailable
      ? '해당 숙소는 현재 Agoda 실시간 가용성 기준으로 예약이 어렵습니다. 다른 대안을 확인해 주세요.'
      : isDisabledBySetting
        ? '현재 대화 설정에서 제휴 링크가 비활성화되어 있습니다.'
        : '현재 해당 카테고리의 제휴 링크를 준비 중입니다. 잠시 후 다시 시도해 주세요.',
  };
}

export function resolveEsimAffiliateFallbackState(provider: string): EsimAffiliateFallbackState {
  const isPendingProvider = provider.startsWith('awin_pending:');
  const isDisabledBySetting = provider.startsWith('awin_disabled:');

  return {
    reasonCode: isPendingProvider
      ? 'no_advertiser_for_category'
      : isDisabledBySetting
        ? 'affiliate_links_disabled'
        : undefined,
    toastTitle: isDisabledBySetting ? '제휴 링크 비활성화' : 'eSIM 제휴 링크 준비 중',
    toastDescription: isDisabledBySetting
      ? '현재 대화 설정에서 제휴 링크가 비활성화되어 있습니다.'
      : '현재 eSIM 제휴 광고주를 연동하는 중입니다. 잠시 후 다시 확인해 주세요.',
  };
}
