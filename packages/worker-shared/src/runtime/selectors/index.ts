/**
 * Runtime selector loader: DB 접근 및 캐시.
 * browser/는 이 모듈에서 로드한 데이터를 주입받아 사용합니다.
 */
export type { PlatformSelectorCache, SelectorConfig } from '@workspace/shared/types';
export {
  getPlatformSelectors,
  loadPlatformSelectors,
  invalidateSelectorCache,
  preloadSelectorCache,
  buildExtractorCode,
} from './loader';
