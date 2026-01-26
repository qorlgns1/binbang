const axios = require('axios');
const fs = require('fs');
const path = require('path');

const config = require('./config');
const configPath = path.join(__dirname, 'config.js');

// 토큰 파일 경로 (config.js와 별도로 관리)
const tokenPath = path.join(__dirname, 'tokens.json');

/**
 * 저장된 토큰 불러오기
 */
function loadTokens() {
  try {
    if (fs.existsSync(tokenPath)) {
      const data = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
      return data;
    }
  } catch (error) {
    console.error('토큰 파일 읽기 실패:', error.message);
  }
  return { accessToken: '', refreshToken: '' };
}

/**
 * 토큰 저장하기
 */
function saveTokens(accessToken, refreshToken) {
  const data = { accessToken, refreshToken, updatedAt: new Date().toISOString() };
  fs.writeFileSync(tokenPath, JSON.stringify(data, null, 2));
  console.log('✅ 토큰이 tokens.json에 저장되었습니다.');
}

/**
 * 인증 코드로 토큰 발급받기 (최초 1회)
 */
async function getTokenFromCode(authCode) {
  try {
    const response = await axios.post(
      'https://kauth.kakao.com/oauth/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: config.kakao.restApiKey,
        client_secret: config.kakao.clientSecret,
        redirect_uri: config.kakao.redirectUri,
        code: authCode,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const { access_token, refresh_token } = response.data;
    saveTokens(access_token, refresh_token);

    return { accessToken: access_token, refreshToken: refresh_token };
  } catch (error) {
    console.error('토큰 발급 실패:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * refresh_token으로 access_token 갱신
 */
async function refreshAccessToken() {
  const tokens = loadTokens();
  
  if (!tokens.refreshToken) {
    throw new Error('refresh_token이 없습니다. setup 스크립트를 먼저 실행하세요.');
  }

  try {
    const response = await axios.post(
      'https://kauth.kakao.com/oauth/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: config.kakao.restApiKey,
        client_secret: config.kakao.clientSecret,
        refresh_token: tokens.refreshToken,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const { access_token, refresh_token } = response.data;
    
    // refresh_token은 갱신 시 새로 주는 경우도 있고 안 주는 경우도 있음
    saveTokens(access_token, refresh_token || tokens.refreshToken);

    console.log('✅ access_token 갱신 완료');
    return access_token;
  } catch (error) {
    console.error('토큰 갱신 실패:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * 유효한 access_token 가져오기 (필요시 자동 갱신)
 */
async function getValidAccessToken() {
  const tokens = loadTokens();
  
  if (!tokens.accessToken) {
    throw new Error('access_token이 없습니다. setup 스크립트를 먼저 실행하세요.');
  }

  // 토큰 유효성 체크
  try {
    await axios.get('https://kapi.kakao.com/v1/user/access_token_info', {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    });
    return tokens.accessToken;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('⚠️ access_token 만료됨. 갱신 중...');
      return await refreshAccessToken();
    }
    throw error;
  }
}

module.exports = {
  loadTokens,
  saveTokens,
  getTokenFromCode,
  refreshAccessToken,
  getValidAccessToken,
};
