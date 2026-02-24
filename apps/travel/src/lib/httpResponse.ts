export function jsonResponse<T>(body: T, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}

export function jsonError(status: number, error: string, extra: Record<string, unknown> = {}): Response {
  return jsonResponse(
    {
      error,
      ...extra,
    },
    { status },
  );
}
