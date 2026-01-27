# 🏨 Accommodation Monitor

Airbnb, Agoda 숙소의 예약 가능 여부를 주기적으로 확인하고, 예약이 가능해지면 **카카오톡**으로 알림을 보내주는 모니터링 도구입니다.

> 인기 숙소의 취소 건을 잡기 위해 만들었습니다. 🇨🇭

## ✨ 주요 기능

- **Airbnb, Agoda** 숙소 모니터링 지원
- **카카오톡 나에게 보내기**로 즉시 알림
- 예약 가능 시 **가격 정보 + 바로가기 URL** 포함
- **중복 알림 방지** (상태 변화 시에만 알림)
- **토큰 자동 갱신** (access_token 만료 시 자동 처리)
- **Docker 지원** (EC2, 개인 서버 배포 가능)

## 📋 요구사항

- Node.js 18+
- 카카오 개발자 계정

## 🚀 설치 및 설정

### 1. 프로젝트 클론

```bash
git clone https://github.com/qorlgns1/accommodation-monitor.git

cd accommodation-monitor

npm install
```

### 2. 카카오 개발자 앱 설정

1. [카카오 개발자](https://developers.kakao.com) 접속 → 로그인
2. **내 애플리케이션** → **애플리케이션 추가하기**
3. 앱 생성 후 **앱 키** 메뉴에서 `REST API 키` 복사
4. **보안** 메뉴 → Client Secret **생성** 및 **활성화**
5. **카카오 로그인** 메뉴:
   - 상태: **ON**
   - Redirect URI: `http://localhost:3000/callback` 추가
6. **동의항목** 메뉴:
   - `카카오톡 메시지 전송` → **선택 동의** 또는 **필수 동의** 설정

### 3. 환경변수 설정

```bash
cp .env.example .env
```

`.env` 파일 수정:

```env
KAKAO_REST_API_KEY=your_rest_api_key_here
KAKAO_CLIENT_SECRET=your_client_secret_here
KAKAO_REDIRECT_URI=http://localhost:3000/callback

# 스케줄 설정 (10분마다)
SCHEDULE=*/10 * * * *
```

### 4. 모니터링할 숙소 추가

`src/config.js` 파일의 `accommodations` 배열에 숙소 추가:

```javascript
accommodations: [
  {
    name: '그린델발트 샬레',
    platform: 'airbnb',  // 'airbnb' 또는 'agoda'
    url: 'https://www.airbnb.co.kr/rooms/12345678',
    checkIn: '2026-08-01',
    checkOut: '2026-08-05',
    adults: 2,
  },
  {
    name: 'Jungfrau Lodge',
    platform: 'agoda',
    url: 'https://www.agoda.com/ko-kr/jungfrau-lodge/hotel/grindelwald-ch.html',
    checkIn: '2026-08-01',
    checkOut: '2026-08-05',
    adults: 2,
  },
],
```

### 5. 카카오톡 연동

```bash
npm run setup
```

출력된 URL을 브라우저에서 열고 카카오 로그인 → 동의하면 자동으로 토큰이 발급됩니다.

### 6. 테스트

```bash
# 카카오톡 알림 테스트
npm run test-notify

# 모니터링 시작
npm start
```

## 📱 카카오톡 알림 예시

```
🏨 숙소 예약 가능! 🎉

📍 그린델발트 샬레
📅 2026-08-01 ~ 2026-08-05
💰 ₩450,000

🔗 https://www.airbnb.co.kr/rooms/12345678?check_in=...

지금 바로 확인하세요!
```

## ⏰ 스케줄 설정

`.env`에서 cron 표현식으로 설정:

```env
# 10분마다 (권장)
SCHEDULE=*/10 * * * *

# 30분마다
SCHEDULE=*/30 * * * *

# 매시간 정각
SCHEDULE=0 * * * *

# 5분마다 (주의: 차단 위험)
SCHEDULE=*/5 * * * *
```

> ⚠️ **주의**: 너무 자주 체크하면 (3분 이하) IP 차단될 수 있습니다. 최소 10분 이상 권장.

## 🐳 Docker로 실행

### 로컬에서 먼저 토큰 발급

```bash
npm run setup
```

### Docker Compose로 실행

```bash
docker-compose up -d
```

### 로그 확인

```bash
docker-compose logs -f
```

## ☁️ EC2 배포

1. EC2 인스턴스 생성 (t3.small 이상 권장, 메모리 2GB+)
2. Docker, Docker Compose 설치
3. 프로젝트 업로드
4. `.env` 파일과 `src/tokens.json` 복사
5. `docker-compose up -d` 실행

```bash
# EC2에서
git clone https://github.com/qorlgns1/accommodation-monitor.git
cd accommodation-monitor

# .env 파일 생성
nano .env

# tokens.json 복사 (로컬에서 scp로 전송)
# scp src/tokens.json ec2-user@your-ec2-ip:~/accommodation-monitor/src/

# 실행
docker-compose up -d
```

## 📁 프로젝트 구조

```
accommodation-monitor/
├── src/
│   ├── index.js          # 메인 스케줄러
│   ├── config.js         # 설정 (숙소 목록)
│   ├── notifier.js       # 카카오톡 알림
│   ├── kakao-auth.js     # 카카오 OAuth
│   ├── setup-kakao.js    # 최초 토큰 발급
│   ├── test-notify.js    # 알림 테스트
│   ├── tokens.json       # 토큰 저장 (자동 생성)
│   └── checkers/
│       ├── index.js      # 체커 라우터
│       ├── airbnb.js     # Airbnb 체커
│       └── agoda.js      # Agoda 체커
├── .env.example          # 환경변수 예시
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

## 🔧 트러블슈팅

### 카카오톡 메시지 전송 실패

- Client Secret이 **활성화** 상태인지 확인
- 동의항목에서 `카카오톡 메시지 전송`이 설정되어 있는지 확인
- `npm run setup`을 다시 실행하여 토큰 재발급

### Puppeteer 오류 (Docker)

Docker 환경에서는 Puppeteer가 필요로 하는 라이브러리가 없을 수 있습니다. 제공된 Dockerfile을 사용하면 자동으로 설치됩니다.

### 예약 가능 여부 오탐

사이트 UI가 변경되면 체커 로직이 작동하지 않을 수 있습니다. `src/checkers/airbnb.js` 또는 `agoda.js`의 패턴을 수정해주세요.

## 📄 라이센스

MIT License

## 🙏 기여

이슈와 PR 환영합니다!
