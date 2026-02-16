import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { buildNotificationEmailHtml, sendEmailHttp } from './sender';

// ---------------------------------------------------------------------------
// axios mock
// ---------------------------------------------------------------------------

const mockPost = vi.fn();

vi.mock('axios', () => ({
  default: {
    post: (...args: unknown[]) => mockPost(...args),
    isAxiosError: (e: unknown): boolean => e !== null && typeof e === 'object' && 'isAxiosError' in e,
  },
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('email/sender', (): void => {
  const originalEnv = { ...process.env };

  beforeEach((): void => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = 'test-key';
    process.env.EMAIL_FROM = 'BinBang <test@binbang.co>';
  });

  afterEach((): void => {
    process.env = { ...originalEnv };
  });

  describe('sendEmailHttp', (): void => {
    it('sends email successfully via Resend API', async (): Promise<void> => {
      mockPost.mockResolvedValue({ data: { id: 'email-123' } });

      const result = await sendEmailHttp({
        to: 'user@example.com',
        subject: 'Test Subject',
        html: '<p>Hello</p>',
      });

      expect(result).toBe('sent');
      expect(mockPost).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        {
          from: 'BinBang <test@binbang.co>',
          to: ['user@example.com'],
          subject: 'Test Subject',
          html: '<p>Hello</p>',
        },
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer test-key' }),
        }),
      );
    });

    it('returns invalid_config when RESEND_API_KEY is missing', async (): Promise<void> => {
      delete process.env.RESEND_API_KEY;

      const result = await sendEmailHttp({
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result).toBe('invalid_config');
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('returns invalid_config when EMAIL_FROM is missing', async (): Promise<void> => {
      delete process.env.EMAIL_FROM;

      const result = await sendEmailHttp({
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result).toBe('invalid_config');
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('returns failed when API call throws', async (): Promise<void> => {
      mockPost.mockRejectedValue(new Error('Network error'));

      const result = await sendEmailHttp({
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result).toBe('failed');
    });
  });

  describe('buildNotificationEmailHtml', (): void => {
    it('generates HTML with title and description', (): void => {
      const html = buildNotificationEmailHtml('Test Title', 'Line 1\nLine 2');

      expect(html).toContain('Test Title');
      expect(html).toContain('Line 1<br>Line 2');
      expect(html).toContain('BinBang');
    });

    it('includes button when URL and text are provided', (): void => {
      const html = buildNotificationEmailHtml('Title', 'Desc', 'Click Me', 'https://example.com');

      expect(html).toContain('Click Me');
      expect(html).toContain('https://example.com');
    });

    it('excludes button when URL is not provided', (): void => {
      const html = buildNotificationEmailHtml('Title', 'Desc');

      expect(html).not.toContain('<a href=');
    });

    it('escapes HTML special characters', (): void => {
      const html = buildNotificationEmailHtml('<script>alert("xss")</script>', 'a & b < c');

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
      expect(html).toContain('a &amp; b &lt; c');
    });
  });
});
