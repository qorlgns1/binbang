import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./loader', () => {
  const createI18nMock = vi.fn();
  return {
    createWorkerI18n: createI18nMock,
  };
});

import { createWorkerI18n } from './loader';
import { type StructuredNotificationPayload, isStructuredPayload, renderNotification } from './templates';

function setupMockI18n(translations: Record<string, string>): void {
  vi.mocked(createWorkerI18n).mockReturnValue({
    locale: 'ko',
    t: (_ns: string) => (key: string) => translations[key] ?? `notification:${key}`,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('renderNotification', () => {
  it('conditionMet 타입을 한국어로 렌더링한다', () => {
    setupMockI18n({
      'conditionMet.title': '숙소 예약 가능! 🎉',
      'conditionMet.button': '예약하러 가기',
      'conditionMet.checkNow': '지금 바로 확인하세요!',
    });

    const payload: StructuredNotificationPayload = {
      type: 'conditionMet',
      userId: 'u-1',
      accommodationName: '테스트 숙소',
      checkIn: '2026-03-01',
      checkOut: '2026-03-03',
      price: '100,000원',
      checkUrl: 'https://example.com',
    };

    const result = renderNotification('ko', payload);

    expect(result.title).toBe('숙소 예약 가능! 🎉');
    expect(result.buttonText).toBe('예약하러 가기');
    expect(result.buttonUrl).toBe('https://example.com');
    expect(result.description).toContain('📍 테스트 숙소');
    expect(result.description).toContain('📅 2026-03-01 ~ 2026-03-03');
    expect(result.description).toContain('💰 100,000원');
    expect(result.description).toContain('지금 바로 확인하세요!');
  });

  it('price가 null이면 가격 줄을 생략한다', () => {
    setupMockI18n({
      'conditionMet.title': '숙소 예약 가능! 🎉',
      'conditionMet.button': '예약하러 가기',
      'conditionMet.checkNow': '지금 바로 확인하세요!',
    });

    const payload: StructuredNotificationPayload = {
      type: 'conditionMet',
      userId: 'u-1',
      accommodationName: '테스트 숙소',
      checkIn: '2026-03-01',
      checkOut: '2026-03-03',
      price: null,
      checkUrl: 'https://example.com',
    };

    const result = renderNotification('ko', payload);

    expect(result.description).not.toContain('💰');
  });

  it('영어 locale로 렌더링한다', () => {
    setupMockI18n({
      'conditionMet.title': 'Accommodation Available! 🎉',
      'conditionMet.button': 'Book Now',
      'conditionMet.checkNow': 'Check it now!',
    });

    const payload: StructuredNotificationPayload = {
      type: 'conditionMet',
      userId: 'u-1',
      accommodationName: 'Test Hotel',
      checkIn: '2026-03-01',
      checkOut: '2026-03-03',
      price: '$100',
      checkUrl: 'https://example.com',
    };

    const result = renderNotification('en', payload);

    expect(result.title).toBe('Accommodation Available! 🎉');
    expect(result.buttonText).toBe('Book Now');
    expect(result.description).toContain('Check it now!');
  });

  it('잘못된 날짜는 N/A로 처리한다', () => {
    setupMockI18n({
      'conditionMet.title': 'title',
      'conditionMet.button': 'btn',
      'conditionMet.checkNow': 'now',
    });

    const payload: StructuredNotificationPayload = {
      type: 'conditionMet',
      userId: 'u-1',
      accommodationName: 'Hotel',
      checkIn: 'invalid',
      checkOut: 'invalid',
      price: null,
      checkUrl: 'https://x',
    };

    const result = renderNotification('ko', payload);

    expect(result.description).toContain('📅 N/A ~ N/A');
  });
});

describe('isStructuredPayload', () => {
  it('type 필드가 있으면 true', () => {
    expect(isStructuredPayload({ type: 'conditionMet', userId: 'u-1' })).toBe(true);
  });

  it('type 필드가 없으면 false (레거시 페이로드)', () => {
    expect(isStructuredPayload({ title: '제목', description: '내용' })).toBe(false);
  });

  it('type이 문자열이 아니면 false', () => {
    expect(isStructuredPayload({ type: 123 })).toBe(false);
  });
});
