import type { AccommodationMetadata, AccommodationToCheck, CheckResult } from '../types/checker';
interface PlatformPatterns {
    available: string[];
    unavailable: string[];
}
export interface ExtractResult {
    matched: boolean;
    available: boolean;
    price: string | null;
    reason: string | null;
    metadata?: AccommodationMetadata;
    matchedSelectors?: {
        category: string;
        name: string;
        matched: boolean;
    }[];
    matchedPatterns?: {
        type: string;
        pattern: string;
        matched: boolean;
    }[];
}
export type CustomExtractorFn = () => ExtractResult;
interface CheckerConfig {
    patterns: PlatformPatterns;
    buildUrl: (accommodation: AccommodationToCheck) => string;
    scrollDistance?: number;
    availableSelector?: string;
    unavailableSelector?: string;
    priceSelector?: string;
    customExtractor?: string;
    testableAttributes?: string[];
}
export declare function baseCheck(accommodation: AccommodationToCheck, config: CheckerConfig): Promise<CheckResult>;
export {};
//# sourceMappingURL=baseChecker.d.ts.map