import { prisma } from '@workspace/db';
// ── 기본값 맵 (DB → env → default 순서로 해소) ──
const DEFAULTS = {
    'worker.cronSchedule': { env: 'CRON_SCHEDULE', default: '*/30 * * * *' },
    'worker.concurrency': { env: 'WORKER_CONCURRENCY', default: '1' },
    'worker.browserPoolSize': { env: 'BROWSER_POOL_SIZE', default: '1' },
    'worker.startupDelayMs': { default: '10000' },
    'worker.shutdownTimeoutMs': { default: '60000' },
    'browser.navigationTimeoutMs': { env: 'NAVIGATION_TIMEOUT_MS', default: '25000' },
    'browser.contentWaitMs': { env: 'CONTENT_WAIT_MS', default: '10000' },
    'browser.patternRetryMs': { env: 'PATTERN_RETRY_MS', default: '5000' },
    'browser.protocolTimeoutMs': { default: '60000' },
    'checker.maxRetries': { default: '2' },
    'checker.retryDelayMs': { default: '3000' },
    'checker.blockResourceTypes': { env: 'BLOCK_RESOURCE_TYPES', default: 'image,media,font' },
    'monitoring.workerHealthyThresholdMs': { default: '2400000' },
    'monitoring.workerDegradedThresholdMs': { default: '5400000' },
    'notification.kakaoTokenRefreshMarginMs': { default: '300000' },
    // Heartbeat
    'heartbeat.intervalMs': { env: 'HEARTBEAT_INTERVAL_MS', default: '60000' },
    'heartbeat.missedThreshold': { env: 'HEARTBEAT_MISSED_THRESHOLD', default: '1' },
    'heartbeat.checkIntervalMs': { env: 'HEARTBEAT_CHECK_INTERVAL_MS', default: '60000' },
    'heartbeat.workerDownCooldownMs': { default: '3600000' },
    'heartbeat.workerStuckCooldownMs': { default: '1800000' },
    'heartbeat.maxProcessingTimeMs': { env: 'MAX_PROCESSING_TIME_MS', default: '3600000' },
    // Selector Test
    'selectorTest.testableAttributes': {
        default: JSON.stringify(['data-testid', 'data-test-id', 'data-selenium', 'data-element-name']),
    },
};
// ── 캐시 ──
const CACHE_TTL_MS = 5 * 60 * 1000; // 5분
let cache = null;
let lastLoadedAt = 0;
// ── 값 해소: DB → env → default ──
function resolveValue(key, dbMap) {
    const dbValue = dbMap.get(key);
    if (dbValue !== undefined && dbValue !== '')
        return dbValue;
    const def = DEFAULTS[key];
    if (def?.env) {
        const envValue = process.env[def.env];
        if (envValue !== undefined)
            return envValue;
    }
    return def?.default ?? '';
}
function toInt(value, fallback) {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? fallback : parsed;
}
function toJsonArray(value, fallback) {
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : fallback;
    }
    catch {
        return fallback;
    }
}
// ── 캐시 빌드 ──
function buildCache(dbMap) {
    function r(key) {
        return resolveValue(key, dbMap);
    }
    return {
        worker: {
            cronSchedule: r('worker.cronSchedule'),
            concurrency: toInt(r('worker.concurrency'), 1),
            browserPoolSize: toInt(r('worker.browserPoolSize'), 1),
            startupDelayMs: toInt(r('worker.startupDelayMs'), 10000),
            shutdownTimeoutMs: toInt(r('worker.shutdownTimeoutMs'), 60000),
        },
        browser: {
            navigationTimeoutMs: toInt(r('browser.navigationTimeoutMs'), 25000),
            contentWaitMs: toInt(r('browser.contentWaitMs'), 10000),
            patternRetryMs: toInt(r('browser.patternRetryMs'), 5000),
            protocolTimeoutMs: toInt(r('browser.protocolTimeoutMs'), 60000),
        },
        checker: {
            maxRetries: toInt(r('checker.maxRetries'), 2),
            retryDelayMs: toInt(r('checker.retryDelayMs'), 3000),
            blockResourceTypes: r('checker.blockResourceTypes'),
        },
        monitoring: {
            workerHealthyThresholdMs: toInt(r('monitoring.workerHealthyThresholdMs'), 2400000),
            workerDegradedThresholdMs: toInt(r('monitoring.workerDegradedThresholdMs'), 5400000),
        },
        notification: {
            kakaoTokenRefreshMarginMs: toInt(r('notification.kakaoTokenRefreshMarginMs'), 300000),
        },
        heartbeat: {
            intervalMs: toInt(r('heartbeat.intervalMs'), 60000),
            missedThreshold: toInt(r('heartbeat.missedThreshold'), 1),
            checkIntervalMs: toInt(r('heartbeat.checkIntervalMs'), 60000),
            workerDownCooldownMs: toInt(r('heartbeat.workerDownCooldownMs'), 3600000),
            workerStuckCooldownMs: toInt(r('heartbeat.workerStuckCooldownMs'), 1800000),
            maxProcessingTimeMs: toInt(r('heartbeat.maxProcessingTimeMs'), 3600000),
        },
        selectorTest: {
            testableAttributes: toJsonArray(r('selectorTest.testableAttributes'), [
                'data-testid',
                'data-test-id',
                'data-selenium',
                'data-element-name',
            ]),
        },
    };
}
/**
 * DB에서 모든 설정을 로드하여 캐시에 저장한다.
 * TTL 이내 재호출 시 캐시를 그대로 반환하여 불필요한 DB 쿼리를 방지한다.
 * DB 접속 실패 시 기존 캐시를 유지하고, 캐시가 없으면 env → 하드코딩 기본값으로 폴백.
 *
 * @param force - true로 전달하면 TTL을 무시하고 강제 갱신
 */
export async function loadSettings(force = false) {
    if (!force && cache && Date.now() - lastLoadedAt < CACHE_TTL_MS) {
        return cache;
    }
    try {
        const rows = await prisma.systemSettings.findMany();
        const dbMap = new Map(rows.map((r) => [r.key, r.value]));
        cache = buildCache(dbMap);
        lastLoadedAt = Date.now();
    }
    catch (error) {
        console.warn('⚠️ DB에서 설정을 불러올 수 없습니다. env/기본값으로 폴백합니다.', error);
        if (!cache) {
            cache = buildCache(new Map());
        }
    }
    return cache;
}
/**
 * 현재 캐시된 설정을 동기적으로 반환한다.
 * loadSettings()가 호출된 적 없으면 env/기본값으로 폴백 캐시를 생성한다.
 */
export function getSettings() {
    if (!cache) {
        console.warn('⚠️ 설정 캐시 미초기화 – env/기본값으로 폴백합니다. loadSettings()를 먼저 호출하세요.');
        cache = buildCache(new Map());
    }
    return cache;
}
