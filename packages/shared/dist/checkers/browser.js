import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { getSettings } from '../settings';
puppeteer.use(StealthPlugin());
const DEFAULT_BLOCKED_RESOURCE_TYPES = ['image', 'media', 'font'];
function parseBlockedResourceTypes(raw) {
    const normalized = raw.trim().toLowerCase();
    if (!normalized || ['0', 'false', 'off', 'none'].includes(normalized)) {
        return new Set();
    }
    return new Set(normalized
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean));
}
export async function createBrowser() {
    const settings = getSettings();
    return puppeteer.launch({
        headless: true,
        protocolTimeout: settings.browser.protocolTimeoutMs,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--window-size=1920,1080',
            '--disable-blink-features=AutomationControlled',
            '--disable-infobars',
        ],
        timeout: 60000,
    });
}
export async function setupPage(page) {
    const settings = getSettings();
    const blockRaw = settings.checker.blockResourceTypes;
    const blockedResourceTypes = blockRaw ? parseBlockedResourceTypes(blockRaw) : new Set(DEFAULT_BLOCKED_RESOURCE_TYPES);
    const navigationTimeoutMs = settings.browser.navigationTimeoutMs;
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    });
    if (blockedResourceTypes.size > 0) {
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            if (blockedResourceTypes.has(request.resourceType())) {
                request.abort();
                return;
            }
            request.continue();
        });
    }
    page.setDefaultTimeout(navigationTimeoutMs);
    page.setDefaultNavigationTimeout(navigationTimeoutMs);
}
