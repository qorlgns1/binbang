/**
 * P2-UI-009: Rate Limit UX / copy.rateLimit.banner
 * 요구사항-테스트 매핑: TC-P2-05
 * copy.rateLimit.banner, copy.network.banner (문서 10절)
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ChatPanelErrorBanner } from './ChatPanelSections';

describe('ChatPanel rate limit copy (P2-UI-009)', () => {
  it('uses copy.rateLimit.banner text: 요청이 너무 많아요. 잠시 후 다시 시도해 주세요.', () => {
    const html = renderToStaticMarkup(
      <ChatPanelErrorBanner
        isRateLimitError={true}
        showLoginAction={false}
        onLogin={() => {}}
        onRetry={() => {}}
        onDismiss={() => {}}
      />,
    );
    expect(html).toContain('요청이 너무 많아요. 잠시 후 다시 시도해 주세요.');
  });

  it('uses copy.network.banner text for non-429 errors', () => {
    const html = renderToStaticMarkup(
      <ChatPanelErrorBanner
        isRateLimitError={false}
        showLoginAction={false}
        onLogin={() => {}}
        onRetry={() => {}}
        onDismiss={() => {}}
      />,
    );
    expect(html).toContain('답변을 불러오지 못했어요. 네트워크를 확인한 뒤 다시 시도해 주세요.');
  });
});
