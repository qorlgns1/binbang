const puppeteer = require('puppeteer');
const path = require('path');

async function launchBrowser() {
  try {
    // Docker 환경이면 기존 설정 사용
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      return await puppeteer.launch({
        headless: 'new',
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920,1080',
        ],
      });
    }

    // 로컬 환경 설정
    return await puppeteer.launch({
      headless: 'new',
    });
  } catch (error) {
    console.error('Browser launch error:', error);
    throw error;
  }
}

module.exports = { launchBrowser };