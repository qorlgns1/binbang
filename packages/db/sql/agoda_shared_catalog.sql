-- Shared Agoda catalog objects.
-- Run this as the shared catalog owner (for example BINBANG_SHARED) or as a privileged DBA.
-- The application schema migrations must not create these tables.

CREATE TABLE "agoda_hotels" (
  "hotelId"             NUMBER        NOT NULL,
  "hotelName"           VARCHAR2(500) NOT NULL,
  "hotelTranslatedName" VARCHAR2(500),
  "cityId"              NUMBER        NOT NULL,
  "cityName"            VARCHAR2(200),
  "countryName"         VARCHAR2(200),
  "countryCode"         VARCHAR2(10),
  "starRating"          BINARY_DOUBLE,
  "ratingAverage"       BINARY_DOUBLE,
  "reviewCount"         NUMBER,
  "latitude"            BINARY_DOUBLE,
  "longitude"           BINARY_DOUBLE,
  "photoUrl"            CLOB,
  "url"                 CLOB,
  CONSTRAINT "PK_agoda_hotels" PRIMARY KEY ("hotelId")
);

CREATE INDEX "IDX_agoda_hotels_cityId" ON "agoda_hotels"("cityId");
CREATE INDEX "IDX_agoda_hotels_country_city" ON "agoda_hotels"("countryCode", "cityId");

CREATE INDEX "agoda_hotels_hotelName_ctx"
  ON "agoda_hotels"("hotelName")
  INDEXTYPE IS CTXSYS.CONTEXT
  PARAMETERS ('SYNC (ON COMMIT)');

CREATE INDEX "agoda_hotels_hotelTranslatedName_ctx"
  ON "agoda_hotels"("hotelTranslatedName")
  INDEXTYPE IS CTXSYS.CONTEXT
  PARAMETERS ('SYNC (ON COMMIT)');

CREATE TABLE "agoda_hotels_search" (
  "hotelId"         NUMBER        NOT NULL,
  "cityId"          NUMBER        NOT NULL,
  "countryCode"     VARCHAR2(10),
  "hotelNameKo"     VARCHAR2(500),
  "hotelNameEn"     VARCHAR2(500),
  "cityNameKo"      VARCHAR2(200),
  "cityNameEn"      VARCHAR2(200),
  "countryNameKo"   VARCHAR2(200),
  "countryNameEn"   VARCHAR2(200),
  "starRating"      BINARY_DOUBLE,
  "ratingAverage"   BINARY_DOUBLE,
  "reviewCount"     NUMBER,
  "latitude"        BINARY_DOUBLE,
  "longitude"       BINARY_DOUBLE,
  "photoUrl"        CLOB,
  "url"             CLOB,
  "searchTextKo"    CLOB          NOT NULL,
  "searchTextEn"    CLOB          NOT NULL,
  "koSourcePresent" NUMBER(1)     DEFAULT 0 NOT NULL,
  "enSourcePresent" NUMBER(1)     DEFAULT 0 NOT NULL,
  "llmAliasFilled"  NUMBER(1)     DEFAULT 0 NOT NULL,
  "mergedAt"        TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
  "updatedAt"       TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT "PK_agoda_hotels_search" PRIMARY KEY ("hotelId")
);

CREATE INDEX "IDX_agoda_hotels_search_cityId" ON "agoda_hotels_search"("cityId");
CREATE INDEX "IDX_agoda_hotels_search_country_city" ON "agoda_hotels_search"("countryCode", "cityId");

CREATE INDEX "agoda_hotels_search_hotelNameKo_ctx"
  ON "agoda_hotels_search"("hotelNameKo")
  INDEXTYPE IS CTXSYS.CONTEXT
  PARAMETERS ('SYNC (ON COMMIT)');

CREATE INDEX "agoda_hotels_search_hotelNameEn_ctx"
  ON "agoda_hotels_search"("hotelNameEn")
  INDEXTYPE IS CTXSYS.CONTEXT
  PARAMETERS ('SYNC (ON COMMIT)');

CREATE INDEX "agoda_hotels_search_searchTextKo_ctx"
  ON "agoda_hotels_search"("searchTextKo")
  INDEXTYPE IS CTXSYS.CONTEXT
  PARAMETERS ('SYNC (ON COMMIT)');

CREATE INDEX "agoda_hotels_search_searchTextEn_ctx"
  ON "agoda_hotels_search"("searchTextEn")
  INDEXTYPE IS CTXSYS.CONTEXT
  PARAMETERS ('SYNC (ON COMMIT)');
