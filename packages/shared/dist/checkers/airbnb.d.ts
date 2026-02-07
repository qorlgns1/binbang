import type { AccommodationToCheck, CheckResult } from '../types/checker';
export interface CheckAirbnbOptions {
    testableAttributes?: string[];
}
export declare function checkAirbnb(accommodation: AccommodationToCheck, options?: CheckAirbnbOptions): Promise<CheckResult>;
//# sourceMappingURL=airbnb.d.ts.map