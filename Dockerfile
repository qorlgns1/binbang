# Dockerfile (Web)
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Prisma 클라이언트 생성
RUN npx prisma generate

# Next.js 빌드 추가
RUN npm run build

# ❗ 실제 실행은 compose에서 결정
CMD ["npm", "start"]