/** 카카오톡 나에게 보내기 메시지 템플릿 */
export interface KakaoMemoTemplate {
  object_type: 'text';
  text: string;
  link: {
    web_url: string;
    mobile_web_url: string;
  };
  button_title: string;
}

const REQUEST_TIMEOUT_MS = 10_000;

/**
 * 카카오톡 나에게 보내기 API를 호출한다.
 * 실패 시 false를 반환하며 예외를 전파하지 않는다.
 */
export async function sendKakaoMemo(template: KakaoMemoTemplate, accessToken: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch('https://kapi.kakao.com/v2/api/talk/memo/default/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        template_object: JSON.stringify(template),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    return response.ok;
  } catch {
    return false;
  }
}
