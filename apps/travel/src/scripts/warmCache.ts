#!/usr/bin/env node
/**
 * Cache warming script for popular destinations and common queries
 * Run this periodically (e.g., via cron) to pre-load frequently accessed data
 */

import { fetchExchangeRate } from '../lib/api/exchangeRate';
import { searchGooglePlaces } from '../lib/api/places';
import { fetchWeatherHistory } from '../lib/api/weather';

// Top 30 popular travel destinations
const POPULAR_DESTINATIONS = [
  'Tokyo',
  'Seoul',
  'Bangkok',
  'Paris',
  'London',
  'New York',
  'Singapore',
  'Dubai',
  'Hong Kong',
  'Barcelona',
  'Rome',
  'Istanbul',
  'Amsterdam',
  'Vienna',
  'Prague',
  'Sydney',
  'Melbourne',
  'Los Angeles',
  'San Francisco',
  'Las Vegas',
  'Miami',
  'Toronto',
  'Vancouver',
  'Berlin',
  'Munich',
  'Zurich',
  'Copenhagen',
  'Stockholm',
  'Oslo',
  'Reykjavik',
];

// Common currency pairs to pre-load
const POPULAR_CURRENCY_PAIRS = [{ base: 'USD', targets: ['KRW', 'JPY', 'EUR'] }];

// Common place types to search
const PLACE_TYPES = ['tourist_attraction', 'restaurant', 'hotel'];

async function warmPlacesCache() {
  console.log('🔥 Warming Places API cache...');
  let count = 0;

  for (const destination of POPULAR_DESTINATIONS) {
    for (const placeType of PLACE_TYPES) {
      try {
        await searchGooglePlaces({
          query: placeType.replace('_', ' '),
          location: destination,
          type: placeType,
        });
        count++;
      } catch (error) {
        console.error(`Failed to cache places for ${destination} (${placeType}):`, error);
      }
    }
  }

  console.log(`✅ Cached ${count} place queries`);
}

async function warmWeatherCache() {
  console.log('🔥 Warming Weather API cache...');
  let count = 0;

  for (const city of POPULAR_DESTINATIONS) {
    try {
      // Cache full year weather data (no month filter)
      await fetchWeatherHistory({ city });
      count++;
    } catch (error) {
      console.error(`Failed to cache weather for ${city}:`, error);
    }
  }

  console.log(`✅ Cached ${count} weather queries`);
}

async function warmExchangeRateCache() {
  console.log('🔥 Warming Exchange Rate API cache...');
  let count = 0;

  for (const pair of POPULAR_CURRENCY_PAIRS) {
    try {
      await fetchExchangeRate({
        baseCurrency: pair.base,
        targetCurrencies: pair.targets,
      });
      count++;
    } catch (error) {
      console.error(`Failed to cache exchange rate for ${pair.base}:`, error);
    }
  }

  console.log(`✅ Cached ${count} exchange rate queries`);
}

async function main() {
  console.log('🚀 Starting cache warming process...\n');

  const startTime = Date.now();

  await Promise.all([warmPlacesCache(), warmWeatherCache(), warmExchangeRateCache()]);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n✨ Cache warming completed in ${duration}s`);
}

main().catch((error) => {
  console.error('❌ Cache warming failed:', error);
  process.exit(1);
});
