import { describe, expect, it } from 'vitest';

import { analyzeCondition } from './condition-parser.service';

describe('condition-parser.service', (): void => {
  // ==========================================================================
  // GREEN cases
  // ==========================================================================

  describe('GREEN severity', (): void => {
    it('passes when all slots present and no ambiguous terms', (): void => {
      const result = analyzeCondition('2인 기준 1박 30만원 이하로 예약 가능한 상태');
      expect(result.severity).toBe('GREEN');
      expect(result.missingSlots).toHaveLength(0);
      expect(result.ambiguousTerms).toHaveLength(0);
    });

    it('passes with different trigger phrase', (): void => {
      const result = analyzeCondition('성인 2명, 15만원 이하 빈자리 확인');
      expect(result.severity).toBe('GREEN');
      expect(result.missingSlots).toHaveLength(0);
    });

    it('passes with currency symbol', (): void => {
      const result = analyzeCondition('1객실 ₩200,000 미만으로 예약 가능 여부');
      expect(result.severity).toBe('GREEN');
      expect(result.missingSlots).toHaveLength(0);
    });
  });

  // ==========================================================================
  // AMBER cases
  // ==========================================================================

  describe('AMBER severity', (): void => {
    it('flags ambiguous term with all slots present', (): void => {
      const result = analyzeCondition('2인 기준 적당한 가격에 예약 가능');
      expect(result.severity).toBe('AMBER');
      expect(result.ambiguousTerms).toContain('적당한');
      expect(result.missingSlots).toContain('가격 조건');
    });

    it('flags missing attendees slot', (): void => {
      const result = analyzeCondition('30만원 이하로 예약 가능한 상태');
      expect(result.severity).toBe('AMBER');
      expect(result.missingSlots).toContain('인원');
      expect(result.missingSlots).not.toContain('가격 조건');
      expect(result.missingSlots).not.toContain('트리거 문구');
    });

    it('flags missing price slot', (): void => {
      const result = analyzeCondition('2인 기준 예약 가능한 상태');
      expect(result.severity).toBe('AMBER');
      expect(result.missingSlots).toContain('가격 조건');
      expect(result.missingSlots).not.toContain('인원');
    });

    it('flags multiple ambiguous terms', (): void => {
      const result = analyzeCondition('2인 괜찮은 가격에 빨리 예약 가능');
      expect(result.severity).toBe('AMBER');
      expect(result.ambiguousTerms).toContain('괜찮은');
      expect(result.ambiguousTerms).toContain('빨리');
    });
  });

  // ==========================================================================
  // RED cases
  // ==========================================================================

  describe('RED severity', (): void => {
    it('flags when trigger phrase is missing', (): void => {
      const result = analyzeCondition('2인 기준 1박 30만원 이하');
      expect(result.severity).toBe('RED');
      expect(result.missingSlots).toContain('트리거 문구');
    });

    it('flags completely vague condition', (): void => {
      const result = analyzeCondition('방이 나오면 알려주세요');
      expect(result.severity).toBe('RED');
      expect(result.missingSlots).toContain('인원');
      expect(result.missingSlots).toContain('가격 조건');
      expect(result.missingSlots).toContain('트리거 문구');
    });

    it('flags when only price is mentioned', (): void => {
      const result = analyzeCondition('20만원 이하로 가능한 곳');
      expect(result.severity).toBe('RED');
      expect(result.missingSlots).toContain('트리거 문구');
      expect(result.missingSlots).toContain('인원');
    });
  });

  // ==========================================================================
  // Edge cases
  // ==========================================================================

  describe('edge cases', (): void => {
    it('handles whitespace in patterns', (): void => {
      const result = analyzeCondition('2 인 기준 30만 원 이하 예약 가능');
      expect(result.severity).toBe('GREEN');
    });

    it('detects 열리면 as trigger', (): void => {
      const result = analyzeCondition('2인 20만원 이하 자리가 열리면 알림');
      expect(result.severity).toBe('GREEN');
    });

    it('handles combined ambiguity and missing slots', (): void => {
      const result = analyzeCondition('저렴한 곳 알려주세요');
      expect(result.severity).toBe('RED');
      expect(result.ambiguousTerms).toContain('저렴한');
      expect(result.missingSlots).toContain('트리거 문구');
    });
  });
});
