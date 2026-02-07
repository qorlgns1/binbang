/**
 * 웹 앱용 환경변수 검증
 */
export declare function validateWebEnv(): void;
/**
 * 워커용 환경변수 검증
 */
export declare function validateWorkerEnv(): void;
/**
 * 환경변수 안전하게 가져오기 (기본값 지원)
 */
export declare function getEnv(key: string, defaultValue?: string): string;
/**
 * 숫자형 환경변수 가져오기
 */
export declare function getEnvNumber(key: string, defaultValue: number): number;
//# sourceMappingURL=env.d.ts.map