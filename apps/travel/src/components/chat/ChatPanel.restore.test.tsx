/**
 * P2-UI-008: 로그인 후 자동 복원 순서 제약 / 복원 UI copy
 * 요구사항-테스트 매핑: TC-P2-06, TC-P2-07
 * copy.restore.restoring, copy.restore.failed (문서 10절)
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ChatPanelRestoreBanner } from './ChatPanelSections';

describe('ChatPanel restore copy (P2-UI-008)', () => {
  it('uses copy.restore.restoring text: 이전 대화를 복원하는 중...', () => {
    const html = renderToStaticMarkup(
      <ChatPanelRestoreBanner restoreStatus='restoring' onRetryRestore={() => {}} onOpenHistory={() => {}} />,
    );
    expect(html).toContain('이전 대화를 복원하는 중...');
  });

  it('uses copy.restore.failed text: 대화를 자동 복원하지 못했어요.', () => {
    const html = renderToStaticMarkup(
      <ChatPanelRestoreBanner restoreStatus='failed' onRetryRestore={() => {}} onOpenHistory={() => {}} />,
    );
    expect(html).toContain('대화를 자동 복원하지 못했어요.');
  });
});
