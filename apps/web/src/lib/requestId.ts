const REQUEST_ID_MAX_LENGTH = 128;

function makeEntropy(): string {
  if (typeof globalThis.crypto !== 'undefined') {
    if (typeof globalThis.crypto.randomUUID === 'function') {
      return globalThis.crypto.randomUUID().slice(0, 8);
    }

    if (typeof globalThis.crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(4);
      globalThis.crypto.getRandomValues(bytes);
      return Array.from(bytes, (value): string => value.toString(16).padStart(2, '0')).join('');
    }
  }

  return Date.now().toString(16).slice(-8).padStart(8, '0');
}

export function createRequestId(): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, '')
    .slice(0, 14);
  return `req_${timestamp}_${makeEntropy()}`;
}

export function resolveRequestId(request: Request): string {
  const headerRequestId = request.headers.get('x-request-id')?.trim();
  if (!headerRequestId) {
    return createRequestId();
  }

  return headerRequestId.slice(0, REQUEST_ID_MAX_LENGTH);
}
