# Dockerfile (Web)
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# ❗ 실제 실행은 compose에서 결정
CMD ["node"]
