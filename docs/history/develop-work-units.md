# develop Work Units (vs main)

기준:

- 비교 범위: `main..develop`
- 정렬: 오래된 커밋 -> 최신 커밋
- 머지 커밋 제외 (`--no-merges`)
- 생성 시점: 2026-02-07

## Work Unit 1 - 관리자/모니터링 기반 기능 구축

- 목적: 관리자 기능, 설정 관리, 워커 상태 추적, 보안/레이트리밋 기반 추가
- 커밋:
  - `7c175aa` `b4351cc` `133a9bb` `8724195` `4da0ca7` `9b7496e`
  - `faa4bf0` `2bde681` `90f36cc` `05dd9c4` `76df8da` `eb9eb9f`

## Work Unit 2 - CI/배포 및 Docker/Prisma 안정화

- 목적: ARM 러너 전환 실험, deploy/workflow 정리, Prisma 마이그레이션/컨테이너 구조 안정화
- 커밋:
  - `500a86d` `b926bcb` `4c2e83c` `51ba2d1` `f7312a4` `5a43831`
  - `7727adf` `9b5306b` `f628539` `87bff0d` `0004e06` `403086e` `92501a4`
  - `caeeb95` `798852f` `0509e07` `66c4be6` `ebd2bde` `77e76cd` `b58f2df`
  - `9f60882` `b0f2684` `865fe41` `c317ece` `5a09151` `fe5fae6` `595ef86`
  - `60e66bf` `1b49f3d` `df2da34` `b264de0`

## Work Unit 3 - 가격 데이터 모델/통계/인증-RBAC 1차

- 목적: CheckLog 확장, 가격 통계 API, 인증/권한 모델 도입
- 커밋:
  - `bb80647` `991997e` `5f6143c` `7b88bd9` `77cbf64`
  - `354923e` `b8a0126` `1930e4f` `013c260`

## Work Unit 4 - RBAC UI/요금제/관리자 UX 고도화

- 목적: RBAC UI 확장, 플랜/프라이싱 페이지, 네비게이션/레이아웃 개선
- 커밋:
  - `44d2183` `8d8f1c5` `6cca936` `934c283` `5841987` `593a9a4`
  - `ee2b5a6` `8a50a21` `3be93ab` `c6fe363` `5a85390` `2beaed1` `073a7ae`
  - `0aeb2e1` `80389ad` `3126b84` `f0f9113` `78fb5e4` `0e966b2`
  - `e622d46` `22600cc`

## Work Unit 5 - 크롤링/규칙 정비 및 서비스 레이어 리팩터링

- 목적: 체커 정확도 개선, 플랫폼 동적화, 프로젝트 규칙/레이어 정비
- 커밋:
  - `79e7fa8` `9ed0792` `27b0caf` `6a26e99` `79e4325`
  - `b2e5fff` `45a0312` `c3937c6`

## Work Unit 6 - 모노레포 전환 1차 (골격 이동)

- 목적: pnpm workspace + turborepo 도입, apps/packages 구조로 이동
- 커밋:
  - `2970de7` `2b69761` `97b5d7c` `f517d02`
  - `82f1eb4` `132b5a7` `836c36b`

## Work Unit 7 - 모노레포 전환 2차 (환경/DB/shared 정합성)

- 목적: env 구조 정리, db/shared 빌드/경계 정리, docker/runtime 스크립트 보강
- 커밋:
  - `24b6a56` `f0d4bef` `4464d2c` `e2584c1` `8d2d93c` `bc1735f`
  - `7d3e27c` `9a0d7c5` `6d5a10a` `e1b686b` `2811b4c`
  - `e421884` `c71774e` `f384ddd`

## Work Unit 8 - 규칙 문서/터보/마감 정리

- 목적: 규칙 문서 최종화, turbo 태스크 및 포맷/생성물 정리
- 커밋:
  - `e0d0afa` `41e1d95` `1247c1c` `81121ce`

## 빠른 검토 명령

- 전체 범위 확인: `git log --oneline --no-merges main..develop`
- 특정 Work Unit diff 확인(예: Unit 6):
  - `git show --stat 2970de7`
  - `git show --stat 836c36b`
  - `git log --oneline --no-merges 2970de7^..836c36b`

## 참고

- 기존 브랜치 히스토리는 유지했습니다(비파괴).
- 이 문서를 기준으로 원하면 다음 단계에서 `main` 기준 새 정리 브랜치를 만들어
  Work Unit 단위 스쿼시 커밋으로 재구성할 수 있습니다.
