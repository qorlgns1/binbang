import type { Browser } from 'playwright';

import { type BrowserLaunchConfig, createBrowser } from './browser';

type Waiter = {
  resolve: (browser: Browser) => void;
  reject: (error: Error) => void;
};

interface PoolState {
  poolSize: number;
  launchConfig: BrowserLaunchConfig;
  browsers: Set<Browser>;
  idle: Browser[];
  waiters: Waiter[];
  creating: number;
  shuttingDown: boolean;
}

export interface BrowserPoolConfig {
  poolSize: number;
  launchConfig: BrowserLaunchConfig;
}

let state: PoolState | null = null;

/**
 * 브라우저 풀 초기화. 워커 시작 시 1회 호출.
 */
export function initBrowserPool(config: BrowserPoolConfig): void {
  if (state) return;
  state = {
    poolSize: Math.max(1, config.poolSize),
    launchConfig: config.launchConfig,
    browsers: new Set(),
    idle: [],
    waiters: [],
    creating: 0,
    shuttingDown: false,
  };
}

function getState(): PoolState {
  if (!state) throw new Error('Browser pool not initialized. Call initBrowserPool() first.');
  return state;
}

function isBrowserHealthy(browser: Browser): boolean {
  return browser.isConnected();
}

async function destroyBrowser(browser: Browser): Promise<void> {
  const s = getState();
  if (s.browsers.has(browser)) {
    s.browsers.delete(browser);
  }
  await browser.close().catch((): void => {});
}

async function createAndRegisterBrowser(): Promise<Browser> {
  const s = getState();
  const browser = await createBrowser(s.launchConfig);
  s.browsers.add(browser);
  return browser;
}

async function fulfillWaiterIfNeeded(): Promise<void> {
  const s = getState();
  if (s.waiters.length === 0) return;
  if (s.browsers.size + s.creating >= s.poolSize) return;

  s.creating++;
  try {
    const browser = await createAndRegisterBrowser();
    const waiter = s.waiters.shift();
    if (waiter) {
      waiter.resolve(browser);
    } else {
      s.idle.push(browser);
    }
  } catch (error) {
    const waiter = s.waiters.shift();
    if (waiter) {
      waiter.reject(error as Error);
    }
  } finally {
    s.creating--;
  }
}

export async function acquireBrowser(): Promise<Browser> {
  const s = getState();
  if (s.shuttingDown) {
    throw new Error('Browser pool is shutting down');
  }

  while (s.idle.length > 0) {
    const browser = s.idle.pop();
    if (!browser) break;
    if (isBrowserHealthy(browser)) {
      return browser;
    }
    await destroyBrowser(browser);
  }

  if (s.browsers.size + s.creating < s.poolSize) {
    s.creating++;
    try {
      return await createAndRegisterBrowser();
    } finally {
      s.creating--;
    }
  }

  return new Promise((resolve, reject): void => {
    s.waiters.push({ resolve, reject });
  });
}

export async function releaseBrowser(browser: Browser): Promise<void> {
  const s = getState();
  if (s.shuttingDown) {
    await destroyBrowser(browser);
    return;
  }

  if (!isBrowserHealthy(browser)) {
    await destroyBrowser(browser);
    await fulfillWaiterIfNeeded();
    return;
  }

  const waiter = s.waiters.shift();
  if (waiter) {
    waiter.resolve(browser);
    return;
  }

  s.idle.push(browser);
}

export async function closeBrowserPool(): Promise<void> {
  if (!state) return;
  state.shuttingDown = true;

  const browsers = Array.from(state.browsers);
  state.browsers.clear();
  state.idle = [];

  while (state.waiters.length > 0) {
    const waiter = state.waiters.shift();
    if (waiter) {
      waiter.reject(new Error('Browser pool closed'));
    }
  }

  await Promise.all(browsers.map((browser): Promise<void> => browser.close().catch((): void => {})));
}
