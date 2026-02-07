import { describe, expect, it } from 'vitest';

import { parseAccommodationUrl } from '@/lib/url-parser';

describe('parseAccommodationUrl', (): void => {
  describe('Airbnb URL', (): void => {
    it('전체 파라미터 파싱 (check_in, check_out, adults, room ID)', (): void => {
      const url = 'https://www.airbnb.co.kr/rooms/123456789?check_in=2025-03-15&check_out=2025-03-18&adults=2';
      const result = parseAccommodationUrl(url);

      expect(result.platform).toBe('AIRBNB');
      expect(result.baseUrl).toBe('https://www.airbnb.co.kr/rooms/123456789');
      expect(result.checkIn).toBe('2025-03-15');
      expect(result.checkOut).toBe('2025-03-18');
      expect(result.adults).toBe(2);
      expect(result.name).toBeNull();
    });

    it('최소 파라미터 (날짜/인원 없음)', (): void => {
      const url = 'https://www.airbnb.co.kr/rooms/987654321';
      const result = parseAccommodationUrl(url);

      expect(result.platform).toBe('AIRBNB');
      expect(result.baseUrl).toBe('https://www.airbnb.co.kr/rooms/987654321');
      expect(result.checkIn).toBeNull();
      expect(result.checkOut).toBeNull();
      expect(result.adults).toBeNull();
    });

    it('잘못된 날짜 형식은 null 반환', (): void => {
      const url = 'https://www.airbnb.co.kr/rooms/111?check_in=invalid&check_out=2025-13-99&adults=1';
      const result = parseAccommodationUrl(url);

      expect(result.checkIn).toBeNull();
      expect(result.checkOut).toBeNull();
      expect(result.adults).toBe(1);
    });

    it('room ID 없는 경로도 처리', (): void => {
      const url = 'https://www.airbnb.co.kr/s/experiences';
      const result = parseAccommodationUrl(url);

      expect(result.platform).toBe('AIRBNB');
      expect(result.baseUrl).toBe('https://www.airbnb.co.kr/s/experiences');
    });
  });

  describe('Agoda URL', (): void => {
    it('전체 파라미터 파싱 (checkIn, los, adults, 호텔명)', (): void => {
      const url =
        'https://www.agoda.com/ko-kr/ebenezer-hotel/hotel/jeju-island-kr.html?checkIn=2025-04-01&los=3&adults=2';
      const result = parseAccommodationUrl(url);

      expect(result.platform).toBe('AGODA');
      expect(result.baseUrl).toBe('https://www.agoda.com/ko-kr/ebenezer-hotel/hotel/jeju-island-kr.html');
      expect(result.checkIn).toBe('2025-04-01');
      expect(result.checkOut).toBe('2025-04-04'); // 4/1 + 3박
      expect(result.adults).toBe(2);
      expect(result.name).toBe('Ebenezer Hotel');
    });

    it('kebab-case 호텔명을 Title Case로 변환', (): void => {
      const url = 'https://www.agoda.com/ko-kr/grand-hyatt-seoul/hotel/seoul-kr.html?checkIn=2025-05-10&los=1';
      const result = parseAccommodationUrl(url);

      expect(result.name).toBe('Grand Hyatt Seoul');
    });

    it('checkIn만 있고 los 없으면 checkOut null', (): void => {
      const url = 'https://www.agoda.com/ko-kr/some-hotel/hotel/city-kr.html?checkIn=2025-06-01';
      const result = parseAccommodationUrl(url);

      expect(result.checkIn).toBe('2025-06-01');
      expect(result.checkOut).toBeNull();
    });

    it('잘못된 checkIn은 null 반환', (): void => {
      const url = 'https://www.agoda.com/ko-kr/hotel/hotel/city.html?checkIn=bad-date&los=2';
      const result = parseAccommodationUrl(url);

      expect(result.checkIn).toBeNull();
      expect(result.checkOut).toBeNull();
    });

    it('los 0 또는 음수는 checkOut null', (): void => {
      const url = 'https://www.agoda.com/ko-kr/hotel/hotel/city.html?checkIn=2025-07-01&los=0';
      const result = parseAccommodationUrl(url);

      expect(result.checkIn).toBe('2025-07-01');
      expect(result.checkOut).toBeNull();
    });

    it('hotel 경로 없는 URL은 name null', (): void => {
      const url = 'https://www.agoda.com/ko-kr/search.html?checkIn=2025-08-01&los=1';
      const result = parseAccommodationUrl(url);

      expect(result.platform).toBe('AGODA');
      expect(result.name).toBeNull();
    });
  });

  describe('지원하지 않는 URL', (): void => {
    it('다른 도메인은 platform null 반환', (): void => {
      const url = 'https://www.booking.com/hotel/kr/some-hotel.html';
      const result = parseAccommodationUrl(url);

      expect(result.platform).toBeNull();
      expect(result.baseUrl).toBe(url);
      expect(result.checkIn).toBeNull();
      expect(result.checkOut).toBeNull();
      expect(result.adults).toBeNull();
      expect(result.name).toBeNull();
    });
  });

  describe('잘못된 URL', (): void => {
    it('파싱 불가 URL은 기본값 반환', (): void => {
      const url = 'not-a-valid-url';
      const result = parseAccommodationUrl(url);

      expect(result.platform).toBeNull();
      expect(result.baseUrl).toBe(url);
      expect(result.checkIn).toBeNull();
      expect(result.checkOut).toBeNull();
      expect(result.adults).toBeNull();
      expect(result.name).toBeNull();
    });

    it('빈 문자열', (): void => {
      const result = parseAccommodationUrl('');

      expect(result.platform).toBeNull();
      expect(result.baseUrl).toBe('');
    });
  });
});
