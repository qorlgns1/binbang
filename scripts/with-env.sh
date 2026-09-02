#!/bin/sh
# 로컬(APP_ENV 미설정)에서는 Doppler(binbang-web/dev_personal)에서 값을 받는다.
# dev config 는 배포된 dev 서버가 쓰므로 로컬 값(NEXTAUTH_URL 등)을 섞지 않는다.
# 서버 배포(APP_ENV=production|development)에서는 건드리지 않는다 — 그쪽은
# deploy.yml이 이미 바깥에서 `doppler run --token ...`으로 감싸서 실제 값을
# 주입한 뒤 이 스크립트를 호출하므로, 여기서 또 Doppler를 부르면 이중으로
# 겹쳐서 prd 배포인데 dev 값을 쓰려 드는 충돌이 생긴다.
if [ -z "$APP_ENV" ]; then
  exec doppler run --project binbang-web --config dev_personal -- "$@"
fi

# 배포 서버(APP_ENV 설정됨): 값이 이미 주입되어 있으므로 그대로 넘긴다.
exec "$@"
