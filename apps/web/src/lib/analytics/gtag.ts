type GtagEventParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function sendGa4Event(eventName: string, params?: GtagEventParams): void {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') return;

  try {
    window.gtag('event', eventName, params);
  } catch {
    // Analytics must never break user experience.
  }
}
