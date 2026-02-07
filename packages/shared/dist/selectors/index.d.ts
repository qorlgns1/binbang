/**
 * Platform Selector Cache Module
 *
 * 플랫폼별 셀렉터/패턴을 DB에서 로드하고 캐싱합니다.
 * 5분 TTL로 캐시하며, DB 실패 시 하드코딩된 fallback을 사용합니다.
 */
import { type Platform } from '@workspace/db';
export interface SelectorConfig {
    id: string;
    name: string;
    selector: string;
    extractorCode?: string | null;
    priority: number;
}
export interface PlatformSelectorCache {
    selectors: {
        price: SelectorConfig[];
        availability: SelectorConfig[];
        metadata: SelectorConfig[];
        platformId: SelectorConfig[];
    };
    patterns: {
        available: string[];
        unavailable: string[];
    };
    extractorCode: string;
    loadedAt: number;
}
/**
 * DB 셀렉터를 기반으로 JavaScript 함수 문자열을 생성합니다.
 * 이 함수는 page.evaluate()에서 실행됩니다.
 */
export declare function buildExtractorCode(_platform: Platform, selectorCache: PlatformSelectorCache): string;
/**
 * 플랫폼별 셀렉터 캐시를 가져옵니다.
 * 캐시가 없거나 만료된 경우 fallback을 반환하고 비동기로 갱신합니다.
 */
export declare function getPlatformSelectors(platform: Platform): PlatformSelectorCache;
/**
 * DB에서 플랫폼 셀렉터를 로드하고 캐시를 갱신합니다.
 */
export declare function loadPlatformSelectors(platform: Platform, force?: boolean): Promise<PlatformSelectorCache>;
/**
 * 셀렉터 캐시를 무효화합니다.
 * platform이 지정되지 않으면 모든 플랫폼의 캐시를 무효화합니다.
 */
export declare function invalidateSelectorCache(platform?: Platform): Platform[];
/**
 * 셀렉터 캐시를 미리 로드합니다.
 * 워커 시작 시 호출하면 첫 체크 시 지연을 방지할 수 있습니다.
 */
export declare function preloadSelectorCache(): Promise<void>;
//# sourceMappingURL=index.d.ts.map