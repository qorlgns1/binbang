# Pricing Policy v1 (P0-10-T1)

목적: `P0-10` 견적 엔진의 계산 규칙을 고정해 동일 입력 시 동일 금액을 재현한다.

## 정책 메타

- `pricingPolicyVersion`: `v1`
- 상태: 적용 중 (2026-02-15 기준)
- 기준 문서:
  - `docs/backlog/roadmap/master-backlog-executable-tickets.md` (`P0-10-T1`)
  - `docs/backlog/master-backlog-and-roadmap.md` (5.2)

## 계산식

```text
computedAmountKrw = baseFee + durationWeight + difficultyWeight + urgencyWeight + frequencyWeight
roundedAmountKrw = round(computedAmountKrw / 1000) * 1000
roundedAmountKrw = clamp(roundedAmountKrw, 10000, 500000)
```

- 반올림: `1,000원` 단위
- 하한/상한: `10,000원` / `500,000원`
- 저장 규칙:
  - `computedAmountKrw`: 반올림/보정 전 합계
  - `roundedAmountKrw`: 반올림 + 하한/상한 적용 최종 금액

## 입력값과 가중치 정의

### `baseFee`

| platform | baseFee |
|---|---:|
| `AIRBNB` | 19,000 |
| `AGODA` | 17,000 |
| `OTHER` | 19,000 |

### `durationWeight` (Q5)

| 요청 기간 구간 | weight |
|---|---:|
| `<= 24h` | 0 |
| `>24h and <=72h` | 5,000 |
| `>72h and <=7d` | 12,000 |
| `>7d` | 20,000 |

### `difficultyWeight` (Q4)

| 난이도 | 기준 | weight |
|---|---|---:|
| `L` | 조건 3개 이하 | 0 |
| `M` | 조건 4~6개 | 7,000 |
| `H` | 조건 7개 이상 또는 조합 조건 | 15,000 |

### `urgencyWeight` (체크인 임박도)

| 임박도 | weight |
|---|---:|
| `D-0 ~ D-1` | 12,000 |
| `D-2 ~ D-3` | 7,000 |
| `D-4+` | 0 |

### `frequencyWeight` (Q6)

| 체크 빈도 | weight |
|---|---:|
| `15m` | 5,000 |
| `30m` | 0 |
| `>=60m` | -2,000 |

## 샘플 입력 10건

| case | platform | duration | difficulty | urgency | frequency | computed | rounded(final) |
|---|---|---|---|---|---|---:|---:|
| C01 | AIRBNB | `<=24h` | L | `D-4+` | `30m` | 19,000 | 19,000 |
| C02 | AGODA | `>24h<=72h` | M | `D-2~D-3` | `15m` | 41,000 | 41,000 |
| C03 | AIRBNB | `>72h<=7d` | H | `D-0~D-1` | `15m` | 63,000 | 63,000 |
| C04 | AGODA | `>7d` | H | `D-0~D-1` | `30m` | 64,000 | 64,000 |
| C05 | AIRBNB | `<=24h` | M | `D-4+` | `>=60m` | 24,000 | 24,000 |
| C06 | AGODA | `>24h<=72h` | L | `D-2~D-3` | `>=60m` | 27,000 | 27,000 |
| C07 | AIRBNB | `>7d` | H | `D-0~D-1` | `>=60m` | 64,000 | 64,000 |
| C08 | AGODA | `>72h<=7d` | M | `D-4+` | `15m` | 41,000 | 41,000 |
| C09* | OVERRIDE | guardrail | guardrail | guardrail | guardrail | 7,000 | 10,000 |
| C10* | OVERRIDE | guardrail | guardrail | guardrail | guardrail | 550,000 | 500,000 |

- `C09`, `C10`은 하한/상한 검증용 guardrail 벡터다.
- `OVERRIDE`는 실제 입력 플랫폼 값이 아니며 guardrail 계산 전용 placeholder다.
- `guardrail` 필드는 검증/테스트 전용 표기이며 실제 운영 입력 필드값이 아니다.

## 정책 변경 절차

1. 정책 변경안 작성 (`weight`, `threshold`, `formula` 변경점 명시)
2. 샘플 10건 재계산 + 영향 비교표 작성
3. 운영 리뷰 1회 반영 후 버전 결정
4. 버전 규칙:
   - `v1.x`: 가중치/임계값 조정(필드/계산 단계 불변)
   - `v2`: 계산 단계/필드/라운딩 규칙 변경
5. 코드 반영 시 `pricingPolicyVersion`을 명시적으로 함께 배포

## 운영 리뷰 코멘트 반영 (2026-02-15)

- 코멘트(운영): "가격 변경 이력은 남는데, 사유 문구가 제각각이면 분쟁 대응 시 비교가 어렵다."
- 반영:
  - `changeReason`은 자유 텍스트이되 아래 템플릿을 기본으로 사용한다.
    - `factor: <duration|difficulty|urgency|frequency|platform>, from: <old>, to: <new>, note: <free-text>`
  - 최소 1개 factor 변경을 명시하고, note에는 운영 맥락(예: 고객 요청, SLA 임박)을 1문장으로 작성한다.
  - 템플릿 미준수 요청은 저장 전 운영 검토 대상으로 분류한다.

## 검증 로그

- `docs/backlog/roadmap/validation/p0-10-t1-policy-simulation.log`
