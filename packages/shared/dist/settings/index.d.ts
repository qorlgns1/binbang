interface WorkerSettings {
    cronSchedule: string;
    concurrency: number;
    browserPoolSize: number;
    startupDelayMs: number;
    shutdownTimeoutMs: number;
}
interface BrowserSettings {
    navigationTimeoutMs: number;
    contentWaitMs: number;
    patternRetryMs: number;
    protocolTimeoutMs: number;
}
interface CheckerSettings {
    maxRetries: number;
    retryDelayMs: number;
    blockResourceTypes: string;
}
interface MonitoringSettings {
    workerHealthyThresholdMs: number;
    workerDegradedThresholdMs: number;
}
interface NotificationSettings {
    kakaoTokenRefreshMarginMs: number;
}
interface HeartbeatSettings {
    intervalMs: number;
    missedThreshold: number;
    checkIntervalMs: number;
    workerDownCooldownMs: number;
    workerStuckCooldownMs: number;
    maxProcessingTimeMs: number;
}
interface SelectorTestSettings {
    testableAttributes: string[];
}
export interface SystemSettingsCache {
    worker: WorkerSettings;
    browser: BrowserSettings;
    checker: CheckerSettings;
    monitoring: MonitoringSettings;
    notification: NotificationSettings;
    heartbeat: HeartbeatSettings;
    selectorTest: SelectorTestSettings;
}
/**
 * DB에서 모든 설정을 로드하여 캐시에 저장한다.
 * TTL 이내 재호출 시 캐시를 그대로 반환하여 불필요한 DB 쿼리를 방지한다.
 * DB 접속 실패 시 기존 캐시를 유지하고, 캐시가 없으면 env → 하드코딩 기본값으로 폴백.
 *
 * @param force - true로 전달하면 TTL을 무시하고 강제 갱신
 */
export declare function loadSettings(force?: boolean): Promise<SystemSettingsCache>;
/**
 * 현재 캐시된 설정을 동기적으로 반환한다.
 * loadSettings()가 호출된 적 없으면 env/기본값으로 폴백 캐시를 생성한다.
 */
export declare function getSettings(): SystemSettingsCache;
export {};
//# sourceMappingURL=index.d.ts.map