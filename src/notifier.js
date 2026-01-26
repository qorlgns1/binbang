const axios = require('axios');
const { getValidAccessToken } = require('./kakao-auth');

/**
 * 카카오톡 나에게 보내기
 * @param {string} title - 메시지 제목
 * @param {string} description - 메시지 내용
 * @param {string} buttonText - 버튼 텍스트
 * @param {string} buttonUrl - 버튼 클릭 시 이동할 URL
 */
async function sendKakaoMessage(title, description, buttonText = '확인하기', buttonUrl = '') {
  try {
    const accessToken = await getValidAccessToken();

    // 텍스트 템플릿 사용 (가장 간단)
    const template = {
      object_type: 'text',
      text: `🏨 ${title}\n\n${description}`,
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
      }
    );

    if (response.data.result_code === 0) {
      console.log('  ✅ 카카오톡 메시지 전송 성공');
      return true;
    } else {
      console.error('  ❌ 카카오톡 메시지 전송 실패:', response.data);
      return false;
    }
  } catch (error) {
    console.error('  ❌ 카카오톡 메시지 전송 오류:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 숙소 예약 가능 알림 보내기
 * @param {Object} accommodation - 숙소 정보
 * @param {Object} result - 체크 결과 { available, price, checkUrl }
 */
async function notifyAvailable(accommodation, result) {
  const title = '숙소 예약 가능! 🎉';
  const bookingUrl = result.checkUrl || accommodation.url;
  
  const lines = [
    `📍 ${accommodation.name}`,
    `📅 ${accommodation.checkIn} ~ ${accommodation.checkOut}`,
  ];

  // 가격 정보가 있으면 추가
  if (result.price) {
    lines.push(`💰 ${result.price}`);
  }

  lines.push('');
  lines.push(`🔗 ${bookingUrl}`);
  lines.push('');
  lines.push('지금 바로 확인하세요!');

  const description = lines.join('\n');

  return await sendKakaoMessage(title, description, '예약하러 가기', bookingUrl);
}

module.exports = {
  sendKakaoMessage,
  notifyAvailable,
};
