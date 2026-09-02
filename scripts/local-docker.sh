#!/bin/sh
# `docker compose`는 컨테이너에 env를 주입할 때 파일(`env_file:`)만 읽고
# 이 스크립트를 실행 중인 셸의 process env는 자동으로 전파하지 않는다.
# 그래서 Doppler에서 받은 값을 로컬 파일로 한 번 내려받은 뒤 compose를 실행한다.
# 이 파일들은 .gitignore의 `.env.*` 규칙에 걸려 커밋되지 않는다.
set -e

doppler secrets download --no-file --format env --project binbang-web --config dev > .env.doppler.local.web
doppler secrets download --no-file --format env --project binbang-worker --config dev > .env.doppler.local.worker

docker compose -f docker/docker-compose.local.yml "$@"
