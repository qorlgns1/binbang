import type { Browser, Page } from 'playwright';
import {
  PRICE_PATTERN,
  delay,
  isRetryableError,
  type AccommodationMetadata,
  type AccommodationToCheck,
  type CheckResult,
  type TestableElement,
} from '@workspace/shared';

import { type PageSetupConfig, setupPage } from './browser.js';
import { acquireBrowser, releaseBrowser } from './browserPool.js';

interface PlatformPatterns {
  available: string[];
  unavailable: string[];
}

export interface ExtractResult {
  matched: boolean;
  available: boolean;
  price: string | null;
  reason: string | null;
  metadata?: AccommodationMetadata; // JSON-LD에서 추출한 메타데이터
  matchedSelectors?: { category: string; name: string; matched: boolean }[];
  matchedPatterns?: { type: string; pattern: string; matched: boolean }[];
}

// Page context에서 실행되는 추출 함수 타입
export type CustomExtractorFn = () => ExtractResult;

interface CheckerConfig {
  patterns: PlatformPatterns;
  buildUrl: (accommodation: AccommodationToCheck) => string;
  scrollDistance?: number;
  availableSelector?: string;
  unavailableSelector?: string;
  priceSelector?: string;
  // data-* 속성 기반 추출을 위한 커스텀 추출기 (문자열로 전달하여 page.evaluate에서 실행)
  customExtractor?: string;
  // 테스트 모드에서 추출할 속성명 목록 (예: ['data-testid', 'data-selenium'])
  testableAttributes?: string[];
}

export interface CheckerRuntimeConfig {
  maxRetries: number;
  navigationTimeoutMs: number;
  contentWaitMs: number;
  patternRetryMs: number;
  retryDelayMs: number;
  blockResourceTypes: string;
  captureScreenshot?: boolean;
}

export async function baseCheck(
  accommodation: AccommodationToCheck,
  config: CheckerConfig,
  runtimeConfig: CheckerRuntimeConfig,
): Promise<CheckResult> {
  const MAX_RETRIES = runtimeConfig.maxRetries;
  const NAVIGATION_TIMEOUT_MS = runtimeConfig.navigationTimeoutMs;
  const CONTENT_WAIT_MS = runtimeConfig.contentWaitMs;
  const PATTERN_RETRY_MS = runtimeConfig.patternRetryMs;
  const RETRY_DELAY_MS = runtimeConfig.retryDelayMs;
  const pageSetupConfig: PageSetupConfig = {
    navigationTimeoutMs: runtimeConfig.navigationTimeoutMs,
    blockResourceTypes: runtimeConfig.blockResourceTypes,
  };
  const checkUrl = config.buildUrl(accommodation);
  let lastError: string | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let browser: Browser | null = null;
    let page: Page | null = null;
    let shouldRetry = false;

    try {
      browser = await acquireBrowser();
      page = await browser.newPage();
      await setupPage(page, pageSetupConfig);

      console.log(`    🔍 접속 중... ${checkUrl}`);

      await page.goto(checkUrl, {
        waitUntil: 'domcontentloaded',
        timeout: NAVIGATION_TIMEOUT_MS,
      });

      // 스크롤하여 콘텐츠 로드
      const scrollDistance = config.scrollDistance ?? 1000;
      await page.evaluate((distance): void => window.scrollBy(0, distance), scrollDistance);

      // 예약 버튼 또는 불가 메시지가 나타날 때까지 대기
      const allPatterns = [...config.patterns.available, ...config.patterns.unavailable];
      try {
        await page.waitForFunction(
          (patterns): boolean => {
            const text = document.body.innerText || '';
            return patterns.some((p): boolean => text.includes(p));
          },
          allPatterns,
          { timeout: CONTENT_WAIT_MS },
        );
      } catch {
        // 타임아웃 시 그냥 진행
      }

      const evaluatePatterns = async (): Promise<ExtractResult> => {
        if (!page) throw new Error('Page is not initialized');
        return page.evaluate(
          async ({
            patterns,
            priceRegex,
            availableSelector,
            unavailableSelector,
            priceSelector,
            customExtractorCode,
          }): Promise<ExtractResult> => {
            // 0. 커스텀 추출기가 있으면 먼저 시도
            if (customExtractorCode) {
              try {
                const extractorFn = new Function(`return (${customExtractorCode})()`) as () => {
                  matched: boolean;
                  available: boolean;
                  price: string | null;
                  reason: string | null;
                  metadata?: Record<string, unknown>;
                  matchedSelectors?: { category: string; name: string; matched: boolean }[];
                  matchedPatterns?: { type: string; pattern: string; matched: boolean }[];
                };
                const customResult = extractorFn();
                if (customResult.matched) {
                  return customResult;
                }
                // matched가 false여도 metadata, matchedSelectors, matchedPatterns는 전달
                if (customResult.metadata || customResult.matchedSelectors || customResult.matchedPatterns) {
                  return { ...customResult, matched: false };
                }
              } catch (e) {
                console.warn('Custom extractor failed:', e);
                // 실패해도 기존 패턴으로 fallback
              }
            }

            const bodyText = document.body.innerText || ''; // Fallback body text

            const getTextFromSelector = async (selector: string | undefined): Promise<string | null> => {
              if (!selector) return null;
              const element = document.querySelector(selector);
              return element ? (element as HTMLElement).innerText : null;
            };

            // 1. Try selector-based unavailable check
            if (unavailableSelector) {
              const unavailableText = await getTextFromSelector(unavailableSelector);
              if (unavailableText) {
                for (const pattern of patterns.unavailable) {
                  if (unavailableText.includes(pattern)) {
                    return {
                      matched: true,
                      available: false,
                      reason: pattern,
                      price: null,
                    };
                  }
                }
              }
            }

            // 2. Try selector-based available check
            if (availableSelector) {
              const availableText = await getTextFromSelector(availableSelector);
              if (availableText) {
                for (const pattern of patterns.available) {
                  if (availableText.includes(pattern)) {
                    let price: string | null = null;
                    if (priceSelector) {
                      const priceElement = document.querySelector(priceSelector);
                      if (priceElement) {
                        const priceMatch = (priceElement as HTMLElement).innerText.match(new RegExp(priceRegex));
                        price = priceMatch ? priceMatch[0] : '가격 확인 필요';
                      }
                    } else {
                      // Fallback to bodyText for price if no specific selector
                      const priceMatch = bodyText.match(new RegExp(priceRegex));
                      price = priceMatch ? priceMatch[0] : '가격 확인 필요';
                    }
                    return {
                      matched: true,
                      available: true,
                      price: price,
                      reason: null,
                    };
                  }
                }
              }
            }

            // 3. Fallback to bodyText checks if no selector-based match
            // 1. 예약 불가 패턴 확인
            for (const pattern of patterns.unavailable) {
              if (bodyText.includes(pattern)) {
                return {
                  matched: true,
                  available: false,
                  reason: pattern,
                  price: null,
                };
              }
            }

            // 2. 예약 가능 버튼 확인
            for (const pattern of patterns.available) {
              if (bodyText.includes(pattern)) {
                const priceMatch = bodyText.match(new RegExp(priceRegex));
                return {
                  matched: true,
                  available: true,
                  price: priceMatch ? priceMatch[0] : '가격 확인 필요',
                  reason: null,
                };
              }
            }

            return { matched: false, available: false, reason: null, price: null };
          },
          {
            patterns: config.patterns,
            priceRegex: PRICE_PATTERN.source,
            availableSelector: config.availableSelector,
            unavailableSelector: config.unavailableSelector,
            priceSelector: config.priceSelector,
            customExtractorCode: config.customExtractor,
          },
        );
      };

      let result = await evaluatePatterns();

      if (!result.matched && PATTERN_RETRY_MS > 0) {
        await delay(PATTERN_RETRY_MS);
        result = await evaluatePatterns();
      }

      // 테스트 모드일 때 testable elements 추출
      let testableElements: TestableElement[] | undefined;
      if (config.testableAttributes && config.testableAttributes.length > 0 && page) {
        testableElements = await page.evaluate((attributes): TestableElement[] => {
          const elements: {
            attribute: string;
            value: string;
            tagName: string;
            text: string;
            html: string;
          }[] = [];

          for (const attr of attributes) {
            const els = document.querySelectorAll(`[${attr}]`);
            for (const el of els) {
              const htmlEl = el as HTMLElement;
              elements.push({
                attribute: attr,
                value: el.getAttribute(attr) || '',
                tagName: el.tagName.toLowerCase(),
                text: htmlEl.innerText || '',
                html: el.outerHTML,
              });
            }
          }

          return elements;
        }, config.testableAttributes);
      }

      if (!result.matched) {
        return {
          available: false,
          price: null,
          checkUrl,
          error: '패턴 미탐지',
          retryCount: attempt,
          metadata: result.metadata, // 패턴 미탐지여도 메타데이터는 저장
          matchedSelectors: result.matchedSelectors,
          matchedPatterns: result.matchedPatterns,
          testableElements,
        };
      }

      // 조건 충족 시 스크린샷 캡처 (page.close() 전에 실행)
      let screenshotBase64: string | undefined;
      if (runtimeConfig.captureScreenshot && result.available && page) {
        try {
          const buffer = await page.screenshot({ fullPage: false });
          screenshotBase64 = buffer.toString('base64');
        } catch {
          // 스크린샷 실패가 체크 결과를 차단하면 안 됨
        }
      }

      return {
        available: result.available,
        price: result.price,
        checkUrl,
        error: null,
        retryCount: attempt,
        metadata: result.metadata,
        matchedSelectors: result.matchedSelectors,
        matchedPatterns: result.matchedPatterns,
        testableElements,
        screenshotBase64,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      lastError = errorMessage;

      shouldRetry = attempt < MAX_RETRIES && isRetryableError(errorMessage);
      if (shouldRetry) {
        console.log(`    ⚠️  재시도 중... (${attempt + 1}/${MAX_RETRIES})`);
      } else {
        return {
          available: false,
          price: null,
          checkUrl,
          error: errorMessage,
          retryCount: attempt,
        };
      }
    } finally {
      if (page) await page.close().catch((): void => {});
      if (browser) await releaseBrowser(browser);
    }

    if (shouldRetry) {
      await delay(RETRY_DELAY_MS);
    }
  }

  return {
    available: false,
    price: null,
    checkUrl,
    error: lastError || 'Unknown error',
    retryCount: MAX_RETRIES,
  };
}
