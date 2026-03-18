/**
 * P2-UI-005: 히스토리 사이드바 조회/검색
 * 요구사항-테스트 매핑: TC-P2-08
 */
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { HistorySidebar } from './HistorySidebar';

const mockMutate = vi.fn();
vi.mock('swr', () => ({
  default: () => ({
    data: { conversations: [] },
    error: null,
    mutate: mockMutate,
    isLoading: false,
  }),
}));
vi.mock('@/lib/featureFlags', () => ({
  isHistoryEditEnabled: vi.fn(() => true),
}));

describe('HistorySidebar', () => {
  it('renders search input and list area when open', () => {
    const html = renderToStaticMarkup(
      <HistorySidebar open={true} onClose={() => {}} onSelectConversation={() => {}} onNewConversation={() => {}} />,
    );
    expect(html).toContain('검색');
    expect(html).toContain('새 대화');
  });

  it('renders empty state when open and no conversations', () => {
    const html = renderToStaticMarkup(
      <HistorySidebar open={true} onClose={() => {}} onSelectConversation={() => {}} onNewConversation={() => {}} />,
    );
    expect(html).toContain('저장된 대화가 없습니다.');
  });
});
