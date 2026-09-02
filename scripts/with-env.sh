#!/bin/sh
# 로컬(APP_ENV 미설정)에서는 Doppler(binbang-web/dev)에서 값을 받는다.
# 서버 배포(APP_ENV=production|development)에서는 건드리지 않는다 — 그쪽은
# deploy.yml이 이미 바깥에서 `doppler run --token ...`으로 감싸서 실제 값을
# 주입한 뒤 이 스크립트를 호출하므로, 여기서 또 Doppler를 부르면 이중으로
# 겹쳐서 prd 배포인데 dev 값을 쓰려 드는 충돌이 생긴다.
set -e

if [ -z "$APP_ENV" ]; then
  exec doppler run --project binbang-web --config dev -- "$@"
else
  exec dotenv -e ".env.${APP_ENV}.local" -e ".env.${APP_ENV}" -- "$@"
fi
