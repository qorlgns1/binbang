import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect((): (() => void) => {
    const timer = setTimeout((): void => setDebounced(value), delayMs);
    return (): void => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
