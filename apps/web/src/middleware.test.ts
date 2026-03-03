import { describe, expect, it } from 'vitest';

import { NextRequest } from 'next/server';

import { middleware } from './middleware';

describe('middleware locale canonicalization', () => {
  it('redirects default locale prefix /ko to canonical unprefixed path', () => {
    const request = new NextRequest('http://localhost:3000/ko/availability');
    const response = middleware(request);

    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe('http://localhost:3000/availability');
  });

  it('rewrites public path to /ko when default locale is negotiated', () => {
    const request = new NextRequest('http://localhost:3000/availability', {
      headers: {
        'accept-language': 'ko-KR,ko;q=0.9,en;q=0.8',
      },
    });
    const response = middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('x-middleware-rewrite')).toContain('/ko/availability');
  });
});
