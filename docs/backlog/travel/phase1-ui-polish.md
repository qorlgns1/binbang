# Phase 1: UI/UX 고도화 + 모바일 + 에러 핸들링

Status: IN PROGRESS
Priority: HIGH
Depends on: MVP (completed)

## Goal

현재 MVP의 기능적 완성도를 유지하면서, **UI/UX와 시각적 톤은 mindtrip.ai와 유사하게** 유지한다(지도+채팅 레이아웃, 스트리밍 카드, 전체 비주얼). **빈방 브랜드(등대 컨셉·컬러·메시지)**만 그 위에 반영한다. 좌측 채팅·우측 지도 분할 레이아웃을 유지하고, 초기 화면(Empty State)과 장소 카드에서 빈방 알림으로의 전환을 강조한다.

## Reference

- **UI/UX·비주얼 기준**: mindtrip.ai — 지도+채팅 레이아웃, 스트리밍 카드/마커, **전체 시각적 유사도** 참고
- [ROADMAP.md](ROADMAP.md) — 브랜드 정체성(등대·컬러), 타겟, 컬러 팔레트

## Brand-Aligned Theme (컬러)

- **메인 배경/강조**: 딥 네이비 계열 (`#001F3F` 또는 `#1e3a5f`)
- **포인트/CTA**: 앰버·골드 계열 (`#FFBF00` 또는 `#e6a23c`)
- `apps/travel/src/app/globals.css`의 CSS 변수(`--primary`, `--background` 등)에 반영. 확정 색상은 UI 검수 후 선택.

## Tasks

### P1-1: 채팅 UI 리디자인

**현재 파일**: `apps/travel/src/components/chat/ChatPanel.tsx`, `ChatMessage.tsx`, `ChatInput.tsx`

- [ ] P1-1-T1: 메시지 버블 스타일 개선 (사용자/AI 구분, 아바타, 타임스탬프)
- [ ] P1-1-T2: 스트리밍 텍스트 타이핑 애니메이션 추가
- [ ] P1-1-T3: 도구 호출 중 로딩 인디케이터 개선 (현재 "Searching..." → 애니메이션 + 진행 상태)
- [x] P1-1-T4: **초기 화면(Empty State) 브랜드 반영**
  - 중앙 히어로: 따뜻한 앰버·골드 컬러의 **등대 아이콘** + 환영 메시지
  - 환영 문구: "반가워요. 당신의 휴식이 길을 잃지 않도록, 빈방이 밤새 불을 밝혀둘게요."
  - **추천 질문 카드 3개** (유럽·빈방 특화):
    1. "파리 에펠탑 근처, 취소분이 자주 나오는 가성비 숙소 찾아줘."
    2. "런던에서 지금 당장 예약 가능한 4성급 호텔 리스트 보여줘."
    3. "특정 숙소의 빈 방 알림을 설정하고 싶어."
  - 카드 스타일 업그레이드 (포인트 컬러, 호버)
- [ ] P1-1-T5: 메시지 간 구분선/간격 최적화
- [ ] P1-1-T6: 코드 블록, 리스트 등 마크다운 렌더링 스타일 개선

### P1-2: 카드 디자인 개선

**현재 파일**: `apps/travel/src/components/cards/PlaceCard.tsx`, `WeatherCard.tsx`, `CurrencyCard.tsx`

- [ ] P1-2-T1: PlaceCard 리디자인 - 이미지 비율, 평점 별표, 가격 레벨 아이콘
- [x] P1-2-T2: **PlaceCard 하단에 [빈방 알림 설정하기] 버튼 강조** — 지도 마커 클릭 시 뜨는 팝업/카드에서도 동일. (기능은 Phase 2·3 연동 시 구현 가능, UI만 선행)
- [ ] P1-2-T3: WeatherCard 리디자인 - 월별 차트/그래프 시각화, 아이콘 추가
- [ ] P1-2-T4: CurrencyCard 리디자인 - 환율 변화 트렌드, 계산기 UI
- [ ] P1-2-T5: 카드 클릭 시 지도에서 해당 장소 하이라이트 연동 강화
- [ ] P1-2-T6: 카드 스켈레톤 로딩 UI (도구 호출 대기 중)

### P1-3: Google Maps 안정화

**현재 파일**: `apps/travel/src/components/map/MapPanel.tsx`

- [x] P1-3-T1: Maps JavaScript API 로딩 실패 시 fallback UI (에러 메시지 + 재시도 버튼)
- [ ] P1-3-T2: 마커 클러스터링 (많은 장소가 표시될 때)
- [ ] P1-3-T3: 마커 디자인 커스터마이징 (카테고리별 아이콘: 호텔, 식당, 관광지)
- [x] P1-3-T4: **마커 클릭 시 인포윈도우/팝업** — PlaceCard 내용 표시, 하단에 **[빈방 알림 설정하기]** 버튼 강조
- [ ] P1-3-T5: 지도-채팅 간 양방향 상호작용 강화 (마커 클릭 → 채팅에서 해당 장소 하이라이트)

### P1-4: 모바일 반응형

**현재 파일**: `apps/travel/src/app/page.tsx`

- [x] P1-4-T1: **모바일에서 채팅/지도 전환 UX 개선** — 하단 탭 바(채팅 / 지도) 추가, 헤더 토글 제거
- [ ] P1-4-T2: 모바일 헤더 최적화 (컴팩트 디자인)
- [ ] P1-4-T3: 터치 인터랙션 최적화 (카드 스와이프, 지도 제스처)
- [ ] P1-4-T4: 모바일 입력 UI 개선 (키보드 올라올 때 레이아웃 처리)
- [ ] P1-4-T5: 태블릿 레이아웃 (채팅과 지도 비율 조정)

### P1-5: 에러 핸들링

- [x] P1-5-T1: **AI API 실패 시 사용자 친화적 에러 메시지** — 채팅 하단 배너 + "다시 시도" / "닫기" 버튼
- [ ] P1-5-T2: 네트워크 끊김 감지 및 알림 (온/오프라인 상태 표시)
- [ ] P1-5-T3: 도구 호출(Places/Weather/Currency API) 실패 시 부분 응답 처리
- [ ] P1-5-T4: Rate limit 초과 시 안내 메시지
- [x] P1-5-T5: 전역 에러 바운더리 (React Error Boundary) 적용
- [x] P1-5-T6: Toast 알림 시스템 도입 (sonner 또는 react-hot-toast)

### P1-6: 로딩/스켈레톤 UI

- [x] P1-6-T1: **페이지 초기 로딩 스켈레톤** — `app/loading.tsx` (헤더·채팅·지도 영역 스켈레톤)
- [ ] P1-6-T2: 채팅 메시지 스트리밍 중 타이핑 인디케이터
- [x] P1-6-T3: **지도 로딩 중 플레이스홀더** — Maps API 로드 전 스피너 + "지도 불러오는 중..." 오버레이
- [ ] P1-6-T4: 카드 데이터 로딩 중 스켈레톤

## Acceptance Criteria

- [x] mindtrip.ai와 시각적으로 유사한 수준의 UI 완성도 + 브랜드(등대·빈방) 반영 초기 화면: 등대 아이콘, 환영 문구, 유럽·빈방 특화 추천 질문 3개
- [x] PlaceCard 및 지도 팝업에 [빈방 알림 설정하기] 버튼이 강조되어 노출
- [x] 컬러: 딥 네이비 계열 + 앰버·골드 포인트가 globals.css에 반영 (확정 색상은 검수 후)
- [ ] 모바일(375px)에서 모든 기능이 자연스럽게 동작
- [x] 네트워크 에러/API 실패 시 사용자에게 명확한 피드백 (지도 로딩 실패 fallback + 재시도)
- [ ] Lighthouse 모바일 성능 점수 80+ (Performance, Accessibility)
- [ ] 카드 클릭 ↔ 지도 마커 양방향 연동 동작

## Technical Notes

- UI 컴포넌트: shadcn/ui 기반, Tailwind CSS v4
- 아이콘: lucide-react (이미 사용 중)
- 토스트: sonner 추천 (shadcn/ui와 호환성 좋음)
- 차트: recharts (WeatherCard 월별 차트용, monorepo에 이미 의존성 있을 수 있음)
- 마커 클러스터링: @googlemaps/markerclusterer
