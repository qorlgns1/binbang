import axios from 'axios';
import {
  buildKakaoNotificationSender,
  prependKakaoNotificationSender,
} from '@workspace/shared/utils/kakaoNotification';

export interface SendMessageParams {
  userId: string;
  title: string;
  description: string;
  buttonText?: string;
  buttonUrl?: string;
  senderDisplayName?: string;
}

/**
 * 카카오톡 나에게 보내기 — 순수 HTTP 전송
 *
 * @returns true 성공, false 일반 실패, 'unauthorized' 토큰 만료 (재시도 필요)
 */
export async function sendKakaoMessageHttp(
  { title, description, buttonText = '확인하기', buttonUrl = '', senderDisplayName }: SendMessageParams,
  accessToken: string,
): Promise<true | false | 'unauthorized'> {
  try {
    const sender = buildKakaoNotificationSender({ name: senderDisplayName });
    const template = {
      object_type: 'text',
      text: prependKakaoNotificationSender(`🏨 ${title}\n\n${description}`, { name: sender.displayName }),
      link: {
        web_url: buttonUrl || 'https://www.airbnb.co.kr',
        mobile_web_url: buttonUrl || 'https://www.airbnb.co.kr',
      },
      button_title: buttonText,
    };

    const response = await axios.post(
      'https://kapi.kakao.com/v2/api/talk/memo/default/send',
      new URLSearchParams({
        template_object: JSON.stringify(template),
      }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    if (response.data.result_code === 0) {
      console.log(`  ✅ 카카오톡 메시지 전송 성공 (${sender.displayName})`);
      return true;
    } else {
      console.error(`  ❌ 카카오톡 메시지 전송 실패 (${sender.displayName}):`, response.data);
      return false;
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return 'unauthorized';
    }

    const sender = buildKakaoNotificationSender({ name: senderDisplayName });

    if (axios.isAxiosError(error)) {
      console.error(`  ❌ 카카오톡 메시지 전송 오류 (${sender.displayName}):`, error.response?.data);
    } else {
      console.error(`  ❌ 카카오톡 메시지 전송 오류 (${sender.displayName}):`, error instanceof Error ? error.message : error);
    }
    return false;
  }
}
