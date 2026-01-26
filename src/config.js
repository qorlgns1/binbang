require('dotenv').config();

module.exports = {
  // 카카오 API 설정 (환경변수에서 로드)
  kakao: {
    restApiKey: process.env.KAKAO_REST_API_KEY,
    clientSecret: process.env.KAKAO_CLIENT_SECRET,
    redirectUri: process.env.KAKAO_REDIRECT_URI || 'http://localhost:3000/callback',
  },

  // 모니터링할 숙소 목록
  // 여기에 원하는 숙소를 추가하세요
  accommodations: [
    // Airbnb 예시
    // {
    //   name: '그린델발트 숙소',
    //   platform: 'airbnb',
    //   url: 'https://www.airbnb.co.kr/rooms/12345678',
    //   checkIn: '2026-08-01',
    //   checkOut: '2026-08-05',
    //   adults: 2,
    // },
    
    // Agoda 예시
    // {
    //   name: 'Jungfrau Lodge',
    //   platform: 'agoda',
    //   url: 'https://www.agoda.com/ko-kr/hotel-name/hotel/city.html',
    //   checkIn: '2026-08-01',
    //   checkOut: '2026-08-05',
    //   adults: 2,
    // },
  ],

  // 스케줄 설정 (cron 표현식)
  schedule: process.env.SCHEDULE || '*/10 * * * *',

  // 체크 간격 (밀리초) - 여러 숙소 체크 시 사이 간격
  checkInterval: parseInt(process.env.CHECK_INTERVAL) || 5000,
};
