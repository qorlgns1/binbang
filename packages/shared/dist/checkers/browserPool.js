import { createBrowser } from './browser';
let state = null;
/**
 * 브라우저 풀 초기화. 워커 시작 시 1회 호출.
 */
export function initBrowserPool(poolSize) {
    if (state)
        return;
    state = {
        poolSize: Math.max(1, poolSize),
        browsers: new Set(),
        idle: [],
        waiters: [],
        creating: 0,
        shuttingDown: false,
    };
}
function getState() {
    if (!state)
        throw new Error('Browser pool not initialized. Call initBrowserPool() first.');
    return state;
}
function isBrowserHealthy(browser) {
    return browser.isConnected();
}
async function destroyBrowser(browser) {
    const s = getState();
    if (s.browsers.has(browser)) {
        s.browsers.delete(browser);
    }
    await browser.close().catch(() => { });
}
async function createAndRegisterBrowser() {
    const s = getState();
    const browser = await createBrowser();
    s.browsers.add(browser);
    return browser;
}
async function fulfillWaiterIfNeeded() {
    const s = getState();
    if (s.waiters.length === 0)
        return;
    if (s.browsers.size + s.creating >= s.poolSize)
        return;
    s.creating++;
    try {
        const browser = await createAndRegisterBrowser();
        const waiter = s.waiters.shift();
        if (waiter) {
            waiter.resolve(browser);
        }
        else {
            s.idle.push(browser);
        }
    }
    catch (error) {
        const waiter = s.waiters.shift();
        if (waiter) {
            waiter.reject(error);
        }
    }
    finally {
        s.creating--;
    }
}
export async function acquireBrowser() {
    const s = getState();
    if (s.shuttingDown) {
        throw new Error('Browser pool is shutting down');
    }
    while (s.idle.length > 0) {
        const browser = s.idle.pop();
        if (!browser)
            break;
        if (isBrowserHealthy(browser)) {
            return browser;
        }
        await destroyBrowser(browser);
    }
    if (s.browsers.size + s.creating < s.poolSize) {
        s.creating++;
        try {
            return await createAndRegisterBrowser();
        }
        finally {
            s.creating--;
        }
    }
    return new Promise((resolve, reject) => {
        s.waiters.push({ resolve, reject });
    });
}
export async function releaseBrowser(browser) {
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
export async function closeBrowserPool() {
    if (!state)
        return;
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
    await Promise.all(browsers.map((browser) => browser.close().catch(() => { })));
}
