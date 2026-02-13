/**
 * Worker i18n runtime (내부 모듈).
 *
 * 이 디렉터리는 runtime/** 내부에서만 사용한다.
 * public entrypoint로 노출하지 않는다.
 */
export { createWorkerI18n, loadWorkerMessages, clearMessageCache } from './loader';
export { getUserLocale } from './userLocale';
export {
  type StructuredNotificationPayload,
  type RenderedNotification,
  renderNotification,
  isStructuredPayload,
} from './templates';
