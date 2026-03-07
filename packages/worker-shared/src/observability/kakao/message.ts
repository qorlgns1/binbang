import axios from 'axios';
import { buildKakaoNotificationSender, prependKakaoNotificationLabel } from '@workspace/shared/utils/kakaoNotification';

export interface SendMessageParams {
  userId: string;
  title: string;
  description: string;
  buttonText?: string;
  buttonUrl?: string;
  senderDisplayName?: string;
}

export interface SendKakaoMessageHttpParams extends SendMessageParams {
  senderDisplayName: string;
}

/**
 * 카카오톡 나에게 보내기 — 순수 HTTP 전송
 *
 * @returns true 성공, false 일반 실패, 'unauthorized' 토큰 만료 (재시도 필요)
 */
export async function sendKakaoMessageHttp(
  {
    userId,
    title,
    description,
    buttonText = '확인하기',
    buttonUrl = '',
    senderDisplayName,
  }: SendKakaoMessageHttpParams,
  accessToken: string,
): Promise<true | false | 'unauthorized'> {
  const sender = buildKakaoNotificationSender({ name: senderDisplayName });

  try {
    const template = {
      object_type: 'text',
      text: prependKakaoNotificationLabel(`🏨 ${title}\n\n${description}`, sender.label),
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
      console.log(`  ✅ 카카오톡 메시지 전송 성공 (userId=${userId})`);
      return true;
    } else {
      console.error(`  ❌ 카카오톡 메시지 전송 실패 (userId=${userId}):`, response.data);
      return false;
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return 'unauthorized';
    }

    if (axios.isAxiosError(error)) {
      console.error(`  ❌ 카카오톡 메시지 전송 오류 (userId=${userId}):`, error.response?.data);
    } else {
      console.error(
        `  ❌ 카카오톡 메시지 전송 오류 (userId=${userId}):`,
        error instanceof Error ? error.message : error,
      );
    }
    return false;
  }
}
