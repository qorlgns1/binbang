import type { Browser } from 'puppeteer';
/**
 * 브라우저 풀 초기화. 워커 시작 시 1회 호출.
 */
export declare function initBrowserPool(poolSize: number): void;
export declare function acquireBrowser(): Promise<Browser>;
export declare function releaseBrowser(browser: Browser): Promise<void>;
export declare function closeBrowserPool(): Promise<void>;
//# sourceMappingURL=browserPool.d.ts.map