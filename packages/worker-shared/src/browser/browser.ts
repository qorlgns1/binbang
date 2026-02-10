import { type Browser, type Page, chromium } from 'playwright';

export interface BrowserLaunchConfig {
  protocolTimeoutMs: number;
}

export interface PageSetupConfig {
  navigationTimeoutMs: number;
  blockResourceTypes: string;
}

const DEFAULT_BLOCKED_RESOURCE_TYPES = ['image', 'media', 'font'];

function parseBlockedResourceTypes(raw: string): Set<string> {
  const normalized = raw.trim().toLowerCase();
  if (!normalized || ['0', 'false', 'off', 'none'].includes(normalized)) {
    return new Set();
  }
  return new Set(
    normalized
      .split(',')
      .map((entry): string => entry.trim())
      .filter(Boolean),
  );
}

export async function createBrowser(config: BrowserLaunchConfig): Promise<Browser> {
  return chromium.launch({
    headless: true,
    timeout: config.protocolTimeoutMs,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
    ],
  });
}

export async function setupPage(page: Page, config: PageSetupConfig): Promise<void> {
  const blockedResourceTypes = config.blockResourceTypes
    ? parseBlockedResourceTypes(config.blockResourceTypes)
    : new Set(DEFAULT_BLOCKED_RESOURCE_TYPES);

  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  });

  if (blockedResourceTypes.size > 0) {
    await page.route('**/*', async (route): Promise<void> => {
      if (blockedResourceTypes.has(route.request().resourceType())) {
        await route.abort();
      } else {
        await route.continue();
      }
    });
  }

  page.setDefaultTimeout(config.navigationTimeoutMs);
  page.setDefaultNavigationTimeout(config.navigationTimeoutMs);
}
