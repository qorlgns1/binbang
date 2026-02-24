-- pg_trgm 확장: ILIKE '%...%' 부분 문자열 검색에 GIN 인덱스 사용 가능
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 호텔명(영문) 부분 검색용 GIN 트라이그램 인덱스
CREATE INDEX "agoda_hotels_hotelName_trgm_idx"
  ON "agoda_hotels" USING GIN ("hotelName" gin_trgm_ops);

-- 호텔명(한국어) 부분 검색용 GIN 트라이그램 인덱스
-- hotelTranslatedName이 NULL인 행은 인덱싱되지 않음
CREATE INDEX "agoda_hotels_hotelTranslatedName_trgm_idx"
  ON "agoda_hotels" USING GIN ("hotelTranslatedName" gin_trgm_ops);

-- countryCode 단독 인덱스 → (countryCode, cityId) 복합 인덱스로 교체
-- 복합 인덱스의 leftmost prefix로 countryCode 단독 조회도 커버됨
DROP INDEX "agoda_hotels_countryCode_idx";

CREATE INDEX "agoda_hotels_countryCode_cityId_idx"
  ON "agoda_hotels"("countryCode", "cityId");
