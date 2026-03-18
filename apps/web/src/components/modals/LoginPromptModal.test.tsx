/**
 * P2-UI-002, P2-UI-003: 로그인 유도 모달 트리거 정책 및 UI/접근성
 * 요구사항-테스트 매핑: TC-P2-02, TC-P2-03
 */
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { LoginPromptModal, TRIGGER_MESSAGES } from './LoginPromptModal';

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}));

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
