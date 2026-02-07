import { getSettings } from '../settings';
import { setupPage } from './browser';
import { acquireBrowser, releaseBrowser } from './browserPool';
import { PRICE_PATTERN } from './constants';
import { delay, isRetryableError } from './utils';
export async function baseCheck(accommodation, config) {
    const settings = getSettings();
    const MAX_RETRIES = settings.checker.maxRetries;
    const NAVIGATION_TIMEOUT_MS = settings.browser.navigationTimeoutMs;
    const CONTENT_WAIT_MS = settings.browser.contentWaitMs;
    const PATTERN_RETRY_MS = settings.browser.patternRetryMs;
    const RETRY_DELAY_MS = settings.checker.retryDelayMs;
    const checkUrl = config.buildUrl(accommodation);
    let lastError = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        let browser = null;
        let page = null;
        let shouldRetry = false;
        try {
            browser = await acquireBrowser();
            page = await browser.newPage();
            await setupPage(page);
            console.log(`    🔍 접속 중... ${checkUrl}`);
            await page.goto(checkUrl, {
                waitUntil: 'domcontentloaded',
                timeout: NAVIGATION_TIMEOUT_MS,
            });
            // 스크롤하여 콘텐츠 로드
            const scrollDistance = config.scrollDistance ?? 1000;
            await page.evaluate((distance) => window.scrollBy(0, distance), scrollDistance);
            // 예약 버튼 또는 불가 메시지가 나타날 때까지 대기
            const allPatterns = [...config.patterns.available, ...config.patterns.unavailable];
            try {
                await page.waitForFunction((patterns) => {
                    const text = document.body.innerText || '';
                    return patterns.some((p) => text.includes(p));
                }, { timeout: CONTENT_WAIT_MS }, allPatterns);
            }
            catch {
                // 타임아웃 시 그냥 진행
            }
            const evaluatePatterns = async () => {
                if (!page)
                    throw new Error('Page is not initialized');
                return page.evaluate(async (patterns, priceRegex, availableSelector, unavailableSelector, priceSelector, customExtractorCode) => {
                    // 0. 커스텀 추출기가 있으면 먼저 시도
                    if (customExtractorCode) {
                        try {
                            const extractorFn = new Function(`return (${customExtractorCode})()`);
                            const customResult = extractorFn();
                            if (customResult.matched) {
                                return customResult;
                            }
                            // matched가 false여도 metadata, matchedSelectors, matchedPatterns는 전달
                            if (customResult.metadata || customResult.matchedSelectors || customResult.matchedPatterns) {
                                return { ...customResult, matched: false };
                            }
                        }
                        catch (e) {
                            console.warn('Custom extractor failed:', e);
                            // 실패해도 기존 패턴으로 fallback
                        }
                    }
                    const bodyText = document.body.innerText || ''; // Fallback body text
                    const getTextFromSelector = async (selector) => {
                        if (!selector)
                            return null;
                        const element = document.querySelector(selector);
                        return element ? element.innerText : null;
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
                                    let price = null;
                                    if (priceSelector) {
                                        const priceElement = document.querySelector(priceSelector);
                                        if (priceElement) {
                                            const priceMatch = priceElement.innerText.match(new RegExp(priceRegex));
                                            price = priceMatch ? priceMatch[0] : '가격 확인 필요';
                                        }
                                    }
                                    else {
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
                }, config.patterns, PRICE_PATTERN.source, config.availableSelector, config.unavailableSelector, config.priceSelector, config.customExtractor);
            };
            let result = await evaluatePatterns();
            if (!result.matched && PATTERN_RETRY_MS > 0) {
                await delay(PATTERN_RETRY_MS);
                result = await evaluatePatterns();
            }
            // 테스트 모드일 때 testable elements 추출
            let testableElements;
            if (config.testableAttributes && config.testableAttributes.length > 0 && page) {
                testableElements = await page.evaluate((attributes) => {
                    const elements = [];
                    for (const attr of attributes) {
                        const els = document.querySelectorAll(`[${attr}]`);
                        for (const el of els) {
                            const htmlEl = el;
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
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            lastError = errorMessage;
            shouldRetry = attempt < MAX_RETRIES && isRetryableError(errorMessage);
            if (shouldRetry) {
                console.log(`    ⚠️  재시도 중... (${attempt + 1}/${MAX_RETRIES})`);
            }
            else {
                return {
                    available: false,
                    price: null,
                    checkUrl,
                    error: errorMessage,
                    retryCount: attempt,
                };
            }
        }
        finally {
            if (page)
                await page.close().catch(() => { });
            if (browser)
                await releaseBrowser(browser);
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
