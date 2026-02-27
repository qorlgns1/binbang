# AFFILIATE LONG TAIL SEARCH API  
## Agoda Partnership Guideline

All material herein © 2005 – 2018 Agoda Company Pte. Ltd., All Rights Reserved.  
AGODA ® is a registered trademark of AGIP LLC, used under license by Agoda Company Pte. Ltd.  
Agoda is part of Booking Holdings Inc. (NASDAQ:BKNG)

---

# Revision History

| Date        | Version | Who | Description       |
|------------|---------|-----|-------------------|
| 07 Feb 2018 | 1.0     |     | Initial document  |

---

# Table of Contents

- Revision History  
- Introduction  
- Affiliate Long Tail Availability Work Flow  
- HTTPS  
- URL  
- Request header  
- Long Tail Search Request  
  - City search example request  
  - Hotel List Search example request  
- Request Parameter Schema  
- Long Tail Search Response  
  - Response example (Correct case)  
  - Response example (error case)  
- Response Schema  
- Appendix  
  - Response Codes  
  - Success Status  
  - Error Status  
  - Languages  
  - Currencies  

---

# Introduction

Our Long Tail Search API makes search functionality available to our Long Tail Search Partners, via synchronous request-response RESTful web services.

---

# Affiliate Long Tail Availability Work Flow

Affiliate Long Tail Search Request  
→ Schema Validation, Security and Search  
→ Return Affiliate Long Tail Availability  

---

# HTTPS

To utilize https, please contact your account manager for more information.

---

# URL

Main endpoint:

```
http://affiliateapi7643.agoda.com/affiliateservice/lt_v1
```

If the domain is unknown, please contact your manager.

---

# Request Header

All requests must include:

```
Accept-Encoding: gzip,deflate
```

Authorization header must include:

```
Authorization: siteid:apikey
```

Example:

```
Authorization 123456:00000000-0000-0000-0000-000000000000
```

Authorization header must match siteid and apikey in request body.

---

# Long Tail Search Request

There are 2 types of search:

1. City Search  
2. Hotel List Search  

---

## City Search Example

```json
{
  "criteria": {
    "additional": {
      "currency": "USD",
      "dailyRate": {
        "maximum": 10000,
        "minimum": 1
      },
      "discountOnly": false,
      "language": "en-us",
      "maxResult": 10,
      "minimumReviewScore": 0,
      "minimumStarRating": 0,
      "occupancy": {
        "numberOfAdult": 2,
        "numberOfChildren": 1
      },
      "sortBy": "PriceAsc"
    },
    "checkInDate": "2018-09-02",
    "checkOutDate": "2018-09-03",
    "cityId": 9395
  }
}
```

---

## Hotel List Search Example

```json
{
  "criteria": {
    "additional": {
      "currency": "USD",
      "discountOnly": false,
      "language": "en-us",
      "occupancy": {
        "numberOfAdult": 2,
        "numberOfChildren": 1
      }
    },
    "checkInDate": "2018-09-02",
    "checkOutDate": "2018-09-03",
    "hotelId": [407854]
  }
}
```

---

# Request Parameter Schema

| Element | Required | Type | Description |
|----------|----------|------|-------------|
| cityId / hotelId | Y | Integer / List | City Id or Hotel Id list |
| checkInDate | Y | Date | YYYY-MM-DD |
| checkOutDate | Y | Date | YYYY-MM-DD |
| language | N | String | Default: en-us |
| currency | N | String | Default: USD |
| sortBy | N | String | Recommended / PriceDesc / PriceAsc / StarRatingDesc / StarRatingAsc / AllGuestsReviewScore / BusinessTravellerReviewScore / CouplesReviewScore / SoloTravellersReviewScore / FamiliesWithYoungReviewScore / FamiliesWithTeenReviewScore / GroupsReviewScore |
| maxResult | N | Integer (1-30) | Default: 10 |
| discountOnly | N | Boolean | Default: false |
| minimumStarRating | N | Double (0-5) | Default: 0 |
| minimumReviewScore | N | Double (1-10) | Default: 0 |
| dailyRate.minimum | N | Decimal | Default: 0 |
| dailyRate.maximum | N | Decimal | Default: 100000 |
| occupancy.numberOfAdult | N | Integer | Default: 2 |
| occupancy.numberOfChildren | N | Integer | Default: 0 |
| occupancy.childrenAges | N | Integer[] | Must match numberOfChildren |

---

# Long Tail Search Response

## Correct Case Example

```json
{
  "results": [
    {
      "crossedOutRate": 50.34,
      "currency": "USD",
      "dailyRate": 18.54,
      "discountPercentage": 0,
      "freeWifi": true,
      "hotelId": 463019,
      "hotelName": "Decor Do Hostel",
      "imageURL": "http://pix6.agoda.net/hotelImages/463/463019/463019_16030116190040357686.jpg?s=800x600",
      "includeBreakfast": false,
      "landingURL": "https://www.agoda.com/partners/partnersearch.aspx?...",
      "reviewScore": 8.1,
      "starRating": 2
    }
  ]
}
```

---

## Error Case Example

```json
{
  "error": {
    "id": 911,
    "message": "No search result"
  }
}
```

---

# Response Schema

| Element | Required | Type | Description |
|----------|----------|------|-------------|
| hotelId | Y | Integer | Hotel ID |
| hotelName | Y | String | Hotel name |
| roomtypeName | O | String | Hotel List only |
| starRating | Y | Double (0-5) | Star rating |
| reviewScore | Y | Double (0-10) | Review score |
| reviewCount | Y | Integer | Number of reviews |
| currency | Y | String | Currency code |
| dailyRate | Y | Decimal | Sell exclusive |
| crossedOutRate | Y | Decimal | Original rate |
| discountPercentage | Y | Double | Promotion discount |
| imageURL | Y | String | Main image |
| landingURL | Y | String | Agoda landing page |
| includeBreakfast | Y | Boolean | true/false |
| freeWifi | Y | Boolean | true/false |

---

# Appendix

## Success Status

| Code | Meaning |
|------|---------|
| 200 | Okay |
| 202 | Accepted |
| 204 | No Content |
| 206 | Partial Content |

---

## Error Status

| Code | Meaning |
|------|---------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | File Not Found |
| 410 | Gone |
| 500 | Internal Server Error |
| 503 | Service Unavailable |
| 506 | Partial Confirm |

---

# Supported Languages

(en-us default)

en-us, fr-fr, de-de, it-it, es-es, ja-jp, zh-hk, zh-cn, ko-kr, el-gr, ru-ru, pt-pt, nl-nl, en-ca, en-in, en-gb, en-za, en-au, en-sg, zh-tw, en-nz, th-th, ms-my, vi-vn, sv-se, id-id, pl-pl, nb-no, da-dk, fi-fi, cs-cz, tr-tr, ca-es, hu-hu, hi-in, bg-bg, ro-ro, sl-si, he-il, ar-ae, nl-be, en-ie, pt-br, es-ar, es-mx, lt-lt, lv-lv, hr-hr, et-ee, uk-ua

---

# Supported Currencies

EUR, GBP, HKD, MYR, SGD, THB, USD, NZD, AUD, JPY, ZAR, CAD, AED, CNY, PHP, CHF, DKK, SEK, CZK, PLN, IDR, KRW, INR, TWD, NOK, OMR, FJD, BHD, ARS, XPF, VND, HUF, UAH, JOD, KWD, MXN, NGN, ILS, PKR, QAR, RUB, SAR, KZT, TRY, BGN, RON, KHR, LAK, LKR, MVR, EGP

---