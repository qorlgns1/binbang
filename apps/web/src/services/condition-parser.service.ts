// ============================================================================
// Types
// ============================================================================

export type AmbiguitySeverity = 'GREEN' | 'AMBER' | 'RED';

export interface AmbiguityResult {
  severity: AmbiguitySeverity;
  missingSlots: string[];
  ambiguousTerms: string[];
}

// ============================================================================
// Dictionaries & Patterns
// ============================================================================

const AMBIGUOUS_TERMS = ['적당한', '괜찮은', '저렴한', '좋은 가격', '가능하면', '빨리'];

const SLOT_DETECTORS: { name: string; pattern: RegExp }[] = [
  { name: '인원', pattern: /\d+\s*(인|명|성인|객실)/ },
  { name: '가격 조건', pattern: /(\d+\s*(만\s*)?원|₩\s*[\d,]+|\d+\s*원\s*(이하|미만|이상|이내))/ },
  {
    name: '트리거 문구',
    pattern: /(예약\s*가능|구매\s*가능|선택\s*가능|열리면|빈\s*자리|빈자리|예약이?\s*열|자리가?\s*나|가능\s*여부)/,
  },
];

// ============================================================================
// Analyzer
// ============================================================================

export function analyzeCondition(conditionDefinition: string): AmbiguityResult {
  const text = conditionDefinition.trim();

  const ambiguousTerms = AMBIGUOUS_TERMS.filter((term) => text.includes(term));

  const missingSlots: string[] = [];
  for (const detector of SLOT_DETECTORS) {
    if (!detector.pattern.test(text)) {
      missingSlots.push(detector.name);
    }
  }

  const hasTrigger = !missingSlots.includes('트리거 문구');

  let severity: AmbiguitySeverity;
  if (!hasTrigger) {
    severity = 'RED';
  } else if (missingSlots.length > 0 || ambiguousTerms.length > 0) {
    severity = 'AMBER';
  } else {
    severity = 'GREEN';
  }

  return { severity, missingSlots, ambiguousTerms };
}
