FROM node:18.19.0-slim

# root 사용자로 작업
USER root

# Puppeteer에 필요한 의존성 설치
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    libgconf-2-4 \
    libxss1 \
    libx11-dev \
    libxext-dev \
    libxtst-dev \
    libnss3 \
    libasound2 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libxshmfence-dev \
    libglu1-mesa \
    libxcomposite-dev \
    libxcursor-dev \
    libxdamage-dev \
    libxi-dev \
    libxrandr-dev \
    libxrender-dev \
    libxt-dev \
    libxv1 \
    libgl1-mesa-glx \
    fonts-liberation \
    xdg-utils \
    chromium \
    && rm -rf /var/lib/apt/lists/*

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./

# 파일 권한 조정
RUN chmod 644 package*.json

# 의존성 설치
RUN npm install --omit=dev

# 전체 소스 복사
COPY . .

# 모든 파일의 권한 조정
RUN chmod -R 755 /app

# Puppeteer 환경 설정
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# 실행 커맨드
CMD ["npm", "start"]