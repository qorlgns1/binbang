export declare const Platform: {
    readonly AIRBNB: "AIRBNB";
    readonly AGODA: "AGODA";
};
export type Platform = (typeof Platform)[keyof typeof Platform];
export declare const AvailabilityStatus: {
    readonly AVAILABLE: "AVAILABLE";
    readonly UNAVAILABLE: "UNAVAILABLE";
    readonly ERROR: "ERROR";
    readonly UNKNOWN: "UNKNOWN";
};
export type AvailabilityStatus = (typeof AvailabilityStatus)[keyof typeof AvailabilityStatus];
export declare const QuotaKey: {
    readonly MAX_ACCOMMODATIONS: "MAX_ACCOMMODATIONS";
    readonly CHECK_INTERVAL_MIN: "CHECK_INTERVAL_MIN";
};
export type QuotaKey = (typeof QuotaKey)[keyof typeof QuotaKey];
export declare const SubscriptionStatus: {
    readonly ACTIVE: "ACTIVE";
    readonly TRIALING: "TRIALING";
    readonly PAST_DUE: "PAST_DUE";
    readonly CANCELED: "CANCELED";
    readonly EXPIRED: "EXPIRED";
};
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];
export declare const SelectorCategory: {
    readonly PRICE: "PRICE";
    readonly AVAILABILITY: "AVAILABILITY";
    readonly METADATA: "METADATA";
    readonly PLATFORM_ID: "PLATFORM_ID";
};
export type SelectorCategory = (typeof SelectorCategory)[keyof typeof SelectorCategory];
export declare const PatternType: {
    readonly AVAILABLE: "AVAILABLE";
    readonly UNAVAILABLE: "UNAVAILABLE";
};
export type PatternType = (typeof PatternType)[keyof typeof PatternType];
//# sourceMappingURL=enums.d.ts.map