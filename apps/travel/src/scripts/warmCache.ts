#!/usr/bin/env node
/**
 * Cache warming script for popular destinations and common queries
 * Run this periodically (e.g., via cron) to pre-load frequently accessed data
 */

import { closeRedisConnection } from '../lib/redis';
import { runTravelCachePrewarm } from '../services/cache-prewarm.service';

async function main() {
  console.log('🚀 Starting cache warming process...\n');

  const startTime = Date.now();

  const result = await runTravelCachePrewarm();

  console.log(
    [
      `✅ Places: warmed=${result.places.warmed}, skipped=${result.places.skipped}, failed=${result.places.failed}`,
      `✅ Weather: warmed=${result.weather.warmed}, skipped=${result.weather.skipped}, failed=${result.weather.failed}`,
      `✅ Exchange: warmed=${result.exchangeRate.warmed}, skipped=${result.exchangeRate.skipped}, failed=${result.exchangeRate.failed}`,
    ].join('\n'),
  );

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n✨ Cache warming completed in ${duration}s`);
}

main()
  .catch((error) => {
    console.error('❌ Cache warming failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await closeRedisConnection();
  });
