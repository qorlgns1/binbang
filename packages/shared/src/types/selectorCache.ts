/**
 * Selector cache types (worker-shared).
 * Defined in shared so browser and runtime can use them without browser → runtime dependency.
 */
export interface SelectorConfig {
  id: string;
  name: string;
  selector: string;
  extractorCode?: string | null;
  priority: number;
}

export interface PlatformSelectorCache {
  selectors: {
    price: SelectorConfig[];
    availability: SelectorConfig[];
    metadata: SelectorConfig[];
    platformId: SelectorConfig[];
  };
  patterns: {
    available: string[];
    unavailable: string[];
  };
  extractorCode: string;
  loadedAt: number;
}
