const http = require('http');
const url = require('url');
const { getTokenFromCode } = require('./kakao-auth');
const config = require('./config');

const PORT = 3000;

// 인증 URL 출력
const authUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${config.kakao.restApiKey}&redirect_uri=${encodeURIComponent(config.kakao.redirectUri)}&response_type=code&scope=talk_message`;

console.log('\n========================================');
console.log('🔐 카카오 로그인 설정');
console.log('========================================\n');
console.log('아래 URL을 브라우저에서 열어주세요:\n');
console.log(authUrl);
console.log('\n로그인 후 자동으로 토큰이 발급됩니다...\n');

// 콜백 서버 시작
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  if (parsedUrl.pathname === '/callback') {
    const code = parsedUrl.query.code;
    
    if (code) {
      try {
        console.log('📥 인증 코드 수신:', code.substring(0, 20) + '...');
        
        const tokens = await getTokenFromCode(code);
        
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <html>
            <body style="font-family: sans-serif; text-align: center; padding: 50px;">
              <h1>✅ 카카오 연동 완료!</h1>
              <p>이 창을 닫고 터미널을 확인하세요.</p>
            </body>
          </html>
        `);

        console.log('\n========================================');
        console.log('✅ 설정 완료!');
        console.log('========================================');
        console.log('\n토큰이 tokens.json에 저장되었습니다.');
        console.log('\n다음 명령어로 모니터링을 시작하세요:');
        console.log('  npm start\n');
        
        // 서버 종료
        setTimeout(() => {
          server.close();
          process.exit(0);
        }, 1000);
        
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<h1>❌ 오류 발생</h1><p>${error.message}</p>`);
      }
    } else {
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>❌ 인증 코드가 없습니다</h1>');
    }
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`🚀 콜백 서버가 http://localhost:${PORT} 에서 대기 중...`);
});
