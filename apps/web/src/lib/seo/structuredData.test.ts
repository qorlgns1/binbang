import { describe, expect, it } from 'vitest';

import { buildBreadcrumbJsonLd, buildItemListJsonLd, buildLodgingBusinessJsonLd } from './structuredData';

describe('structuredData helpers', () => {
  it('builds breadcrumb schema with list items and positions', () => {
    const schema = buildBreadcrumbJsonLd([
      { name: 'Home', url: 'https://example.com/' },
      { name: 'Availability', url: 'https://example.com/availability' },
    ]);

    expect(schema['@type']).toBe('BreadcrumbList');
    expect((schema.itemListElement as Array<{ position: number }>)[0]?.position).toBe(1);
  });

  it('builds item list schema with required fields', () => {
    const schema = buildItemListJsonLd({
      name: 'Availability list',
      url: 'https://example.com/availability',
      items: [
        { name: 'Property A', url: 'https://example.com/availability/airbnb/property-a' },
        { name: 'Property B', url: 'https://example.com/availability/airbnb/property-b' },
      ],
    });

    expect(schema['@type']).toBe('ItemList');
    expect(schema.numberOfItems).toBe(2);
  });

  it('builds lodging business schema without aggregateRating', () => {
    const schema = buildLodgingBusinessJsonLd({
      name: 'Property A',
      url: 'https://example.com/availability/airbnb/property-a',
      description: 'Availability trend data',
      imageUrl: 'https://example.com/property-a.jpg',
      addressLocality: 'Jeju',
      addressRegion: 'Jeju-do',
      addressCountry: 'kr',
      sameAs: ['https://source.example.com/property-a'],
    });

    expect(schema['@type']).toBe('LodgingBusiness');
    expect(schema.address).toBeTruthy();
    expect(schema.aggregateRating).toBeUndefined();
    expect(schema.sameAs).toContain('https://source.example.com/property-a');
  });
});
