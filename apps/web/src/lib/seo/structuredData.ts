interface BreadcrumbNode {
  name: string;
  url: string;
}

interface ItemListEntry {
  name: string;
  url: string;
}

interface BuildItemListJsonLdInput {
  items: ItemListEntry[];
  name?: string;
  url?: string;
  description?: string;
  includeContext?: boolean;
}

interface BuildLodgingBusinessJsonLdInput {
  name: string;
  url: string;
  description?: string | null;
  imageUrl?: string | null;
  addressLocality?: string | null;
  addressRegion?: string | null;
  addressCountry?: string | null;
  sameAs?: string[];
}

function compact<T>(values: Array<T | null | undefined>): T[] {
  return values.filter((value): value is T => value !== null && value !== undefined);
}

function normalizeText(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function buildBreadcrumbJsonLd(items: BreadcrumbNode[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildItemListJsonLd(input: BuildItemListJsonLdInput): Record<string, unknown> {
  const itemList = {
    '@type': 'ItemList',
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    numberOfItems: input.items.length,
    itemListElement: input.items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  } as Record<string, unknown>;

  const name = normalizeText(input.name);
  const url = normalizeText(input.url);
  const description = normalizeText(input.description);
  if (name) itemList.name = name;
  if (url) itemList.url = url;
  if (description) itemList.description = description;

  if (input.includeContext === false) {
    return itemList;
  }

  return {
    '@context': 'https://schema.org',
    ...itemList,
  };
}

export function buildLodgingBusinessJsonLd(input: BuildLodgingBusinessJsonLdInput): Record<string, unknown> {
  const description = normalizeText(input.description);
  const imageUrl = normalizeText(input.imageUrl);
  const addressLocality = normalizeText(input.addressLocality);
  const addressRegion = normalizeText(input.addressRegion);
  const addressCountry = normalizeText(input.addressCountry);

  const address =
    addressLocality || addressRegion || addressCountry
      ? {
          '@type': 'PostalAddress',
          ...(addressLocality ? { addressLocality } : {}),
          ...(addressRegion ? { addressRegion } : {}),
          ...(addressCountry ? { addressCountry } : {}),
        }
      : null;

  const sameAs = Array.from(new Set(compact([...(input.sameAs ?? []).map((value) => normalizeText(value))])));

  return {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: input.name,
    url: input.url,
    ...(description ? { description } : {}),
    ...(imageUrl ? { image: imageUrl } : {}),
    ...((address ? { address } : {}) as Record<string, unknown>),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}
