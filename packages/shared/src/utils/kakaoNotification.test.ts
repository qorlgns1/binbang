import { describe, expect, it } from 'vitest';

import { buildKakaoNotificationSender, prependKakaoNotificationSender } from './kakaoNotification';

describe('buildKakaoNotificationSender', () => {
  it('닉네임이 있으면 그대로 사용한다', () => {
    expect(
      buildKakaoNotificationSender({
        name: '마르코',
        email: 'marco@example.com',
        userId: 'user_12345678',
      }),
    ).toEqual({
      displayName: '마르코',
      label: '[마르코]',
    });
  });

  it('닉네임이 없으면 이메일 앞부분을 사용한다', () => {
    expect(
      buildKakaoNotificationSender({
        email: 'marco.dev@example.com',
        userId: 'user_12345678',
      }),
    ).toEqual({
      displayName: 'marco.dev',
      label: '[marco.dev]',
    });
  });

  it('닉네임과 이메일이 없으면 userId 앞부분을 사용한다', () => {
    expect(buildKakaoNotificationSender({ userId: 'abcdef1234567890' })).toEqual({
      displayName: 'abcdef12',
      label: '[abcdef12]',
    });
  });

  it('표시 가능한 값이 없으면 unknown으로 표기한다', () => {
    expect(buildKakaoNotificationSender({})).toEqual({
      displayName: 'unknown',
      label: '[unknown]',
    });
  });
});

describe('prependKakaoNotificationSender', () => {
  it('메시지 첫 줄에 닉네임 표기를 추가한다', () => {
    expect(
      prependKakaoNotificationSender('알림 본문', {
        name: '개발용 계정',
      }),
    ).toBe('[개발용 계정]\n알림 본문');
  });
});
