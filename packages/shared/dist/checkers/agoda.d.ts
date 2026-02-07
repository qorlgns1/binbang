import type { AccommodationToCheck, CheckResult } from '../types/checker';
export interface CheckAgodaOptions {
    testableAttributes?: string[];
}
export declare function checkAgoda(accommodation: AccommodationToCheck, options?: CheckAgodaOptions): Promise<CheckResult>;
//# sourceMappingURL=agoda.d.ts.map