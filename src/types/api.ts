/** Next.js App Router 동적 라우트 params */
export interface RouteParams {
  params: Promise<{ id: string }>;
}

/** 페이지 컴포넌트 props (동적 라우트) */
export interface PageParams {
  params: Promise<{ id: string }>;
}
