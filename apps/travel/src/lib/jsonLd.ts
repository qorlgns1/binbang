/**
 * JSON-LD 구조화 데이터를 <script> 태그에 안전하게 삽입하기 위한 직렬화 유틸.
 * DB에서 가져온 콘텐츠가 </script> 등의 문자를 포함할 경우 XSS가 발생할 수 있으므로,
 * JSON.stringify 결과에서 HTML 특수문자를 유니코드 이스케이프로 치환한다.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
