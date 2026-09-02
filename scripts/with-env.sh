#!/bin/sh
# 레포 레벨 명령에 환경변수를 채워 실행한다.
#
# 이 스크립트를 거치는 것은 "앱에 속하지 않은" 명령뿐이다.
#   - db:migrate / db:seed 등 DB 명령
#   - scripts/*.ts 일회성 스크립트
# 값은 binbang-web project 를 기준으로 삼는다. DB 소유 앱이 명확하지 않아
# web 으로 고정한 결정이다(docs/deployment/DOPPLER.md).
#
# 앱 실행(dev)은 여기를 거치지 않는다. 각 앱의 dev 스크립트가 자기
# Doppler project 로 직접 실행한다. 양쪽을 겹치면 안쪽이 이겨서
# 바깥에서 지정한 값이 조용히 덮어써진다.
#
# 검증(lint/typecheck/test/build)도 거치지 않는다. 비밀값이 필요 없고,
# CI 는 더미 env 로 같은 명령을 그대로 돌린다(.github/workflows/ci.yml).

if [ -z "$APP_ENV" ]; then
  # 로컬: Doppler 의 로컬 전용 config 에서 받는다.
  # dev config 는 배포된 dev 서버가 쓰므로 로컬 값(NEXTAUTH_URL 등)을 섞지 않는다.
  exec doppler run --project binbang-web --config dev_personal -- "$@"
fi

# 배포 서버(APP_ENV 설정됨): deploy.yml 이 바깥에서 `doppler run --token` 으로
# 이미 값을 주입한 뒤 호출하므로, 여기서는 아무것도 하지 않고 그대로 넘긴다.
exec "$@"
