/**
 * P2-UI-002, P2-UI-003: 로그인 유도 모달 트리거 정책 및 UI/접근성
 * 요구사항-테스트 매핑: TC-P2-02, TC-P2-03
 */
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { LoginPromptModal } from './LoginPromptModal';

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}));

const TRIGGER_MESSAGES = {
  save: {
    title: '로그인하고 대화를 저장하세요',
    description: '대화 내역을 저장하고 언제든 다시 보려면 로그인이 필요해요.',
  },
  history: {
    title: '이전 대화를 보려면 로그인하세요',
    description: '저장된 대화 내역을 보려면 로그인이 필요해요.',
  },
  bookmark: {
    title: '북마크를 저장하려면 로그인하세요',
    description: '북마크 기능을 사용하려면 로그인이 필요해요.',
  },
  limit: {
    title: '계속 사용하려면 로그인하세요',
    description: '게스트 한도에 도달했어요. 로그인하면 더 많은 대화를 이어갈 수 있어요.',
  },
} as const;

describe('LoginPromptModal', () => {
  it('returns null when open is false', () => {
    const html = renderToStaticMarkup(<LoginPromptModal open={false} onClose={() => {}} trigger='save' />);
    expect(html).toBe('');
  });

  it('renders save trigger title and description (copy.session.save)', () => {
    const html = renderToStaticMarkup(<LoginPromptModal open={true} onClose={() => {}} trigger='save' />);
    expect(html).toContain(TRIGGER_MESSAGES.save.title);
    expect(html).toContain(TRIGGER_MESSAGES.save.description);
  });

  it('renders history trigger title and description', () => {
    const html = renderToStaticMarkup(<LoginPromptModal open={true} onClose={() => {}} trigger='history' />);
    expect(html).toContain(TRIGGER_MESSAGES.history.title);
    expect(html).toContain(TRIGGER_MESSAGES.history.description);
  });

  it('renders bookmark trigger title and description', () => {
    const html = renderToStaticMarkup(<LoginPromptModal open={true} onClose={() => {}} trigger='bookmark' />);
    expect(html).toContain(TRIGGER_MESSAGES.bookmark.title);
    expect(html).toContain(TRIGGER_MESSAGES.bookmark.description);
  });

  it('renders limit trigger title and description', () => {
    const html = renderToStaticMarkup(<LoginPromptModal open={true} onClose={() => {}} trigger='limit' />);
    expect(html).toContain(TRIGGER_MESSAGES.limit.title);
    expect(html).toContain(TRIGGER_MESSAGES.limit.description);
  });

  it('has role="dialog" and aria-modal="true" for accessibility', () => {
    const html = renderToStaticMarkup(<LoginPromptModal open={true} onClose={() => {}} trigger='save' />);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
  });

  it('includes close and "나중에" controls', () => {
    const html = renderToStaticMarkup(<LoginPromptModal open={true} onClose={() => {}} trigger='save' />);
    expect(html).toContain('aria-label="모달 닫기"');
    expect(html).toContain('나중에');
  });
});
