import { describe, expect, it } from 'vitest';
import { parsePrice } from './priceParser';
describe('parsePrice', () => {
    describe('KRW (₩)', () => {
        it('₩150,000 → 150000원', () => {
            expect(parsePrice('₩150,000')).toEqual({ amount: 150000, currency: 'KRW' });
        });
        it('₩ 85,000 (공백 포함)', () => {
            expect(parsePrice('₩ 85,000')).toEqual({ amount: 85000, currency: 'KRW' });
        });
        it('₩0', () => {
            expect(parsePrice('₩0')).toEqual({ amount: 0, currency: 'KRW' });
        });
        it('₩1,234,567', () => {
            expect(parsePrice('₩1,234,567')).toEqual({ amount: 1234567, currency: 'KRW' });
        });
    });
    describe('USD ($)', () => {
        it('$200.50 → 20050센트', () => {
            expect(parsePrice('$200.50')).toEqual({ amount: 20050, currency: 'USD' });
        });
        it('$100 (소수점 없음)', () => {
            expect(parsePrice('$100')).toEqual({ amount: 10000, currency: 'USD' });
        });
        it('$ 1,500.99', () => {
            expect(parsePrice('$ 1,500.99')).toEqual({ amount: 150099, currency: 'USD' });
        });
    });
    describe('EUR (€)', () => {
        it('€50 → 5000센트', () => {
            expect(parsePrice('€50')).toEqual({ amount: 5000, currency: 'EUR' });
        });
        it('€ 299.99', () => {
            expect(parsePrice('€ 299.99')).toEqual({ amount: 29999, currency: 'EUR' });
        });
    });
    describe('GBP (£)', () => {
        it('£75.50 → 7550센트', () => {
            expect(parsePrice('£75.50')).toEqual({ amount: 7550, currency: 'GBP' });
        });
    });
    describe('CHF', () => {
        it('CHF 100 → 10000센트', () => {
            expect(parsePrice('CHF 100')).toEqual({ amount: 10000, currency: 'CHF' });
        });
        it('CHF100 (공백 없음)', () => {
            expect(parsePrice('CHF100')).toEqual({ amount: 10000, currency: 'CHF' });
        });
        it('CHF 1,250.75', () => {
            expect(parsePrice('CHF 1,250.75')).toEqual({ amount: 125075, currency: 'CHF' });
        });
    });
    describe('파싱 실패 → null', () => {
        it('null', () => {
            expect(parsePrice(null)).toBeNull();
        });
        it('빈 문자열', () => {
            expect(parsePrice('')).toBeNull();
        });
        it('공백만', () => {
            expect(parsePrice('   ')).toBeNull();
        });
        it('가격 확인 필요', () => {
            expect(parsePrice('가격 확인 필요')).toBeNull();
        });
        it('통화 기호 없는 숫자', () => {
            expect(parsePrice('150000')).toBeNull();
        });
        it('음수 가격', () => {
            expect(parsePrice('₩-100')).toBeNull();
        });
    });
});
