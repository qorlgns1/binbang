import type { Platform } from '@workspace/db';
export interface AccommodationMetadata {
    platformId?: string;
    platformName?: string;
    platformImage?: string;
    platformDescription?: string;
    addressCountry?: string;
    addressRegion?: string;
    addressLocality?: string;
    postalCode?: string;
    streetAddress?: string;
    ratingValue?: number;
    reviewCount?: number;
    latitude?: number;
    longitude?: number;
    rawJsonLd?: Record<string, unknown>;
}
export interface MatchedSelector {
    category: string;
    name: string;
    matched: boolean;
}
export interface MatchedPattern {
    type: string;
    pattern: string;
    matched: boolean;
}
export interface TestableElement {
    attribute: string;
    value: string;
    tagName: string;
    text: string;
    html: string;
}
export interface CheckResult {
    available: boolean;
    price: string | null;
    checkUrl: string;
    error: string | null;
    retryCount: number;
    metadata?: AccommodationMetadata;
    matchedSelectors?: MatchedSelector[];
    matchedPatterns?: MatchedPattern[];
    testableElements?: TestableElement[];
}
export interface AccommodationToCheck {
    id: string;
    url: string;
    checkIn: Date;
    checkOut: Date;
    adults: number;
    rooms?: number;
    platform: Platform;
}
//# sourceMappingURL=checker.d.ts.map