const { sendKakaoMessage } = require('./notifier');

async function testNotify() {
  console.log('🔔 카카오톡 알림 테스트 중...\n');

  const success = await sendKakaoMessage(
    '테스트 알림',
    '숙소 모니터링이 정상적으로 설정되었습니다!\n\n30분마다 예약 가능 여부를 체크합니다.',
    '설정 완료',
    'https://www.airbnb.co.kr'
  );

  if (success) {
    console.log('\n✅ 카카오톡에서 메시지를 확인하세요!');
  } else {
    console.log('\n❌ 메시지 전송에 실패했습니다. 토큰을 확인하세요.');
  }
}

testNotify().catch(console.error);
