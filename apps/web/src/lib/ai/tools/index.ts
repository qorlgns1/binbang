import { getExchangeRateTool } from './getExchangeRate';
import { getWeatherHistoryTool } from './getWeatherHistory';
import { createSearchAccommodationTool } from './searchAccommodation';
import { createSearchEsimTool } from './searchEsim';
import { searchPlacesTool } from './searchPlaces';
import type { TravelToolsOptions } from './affiliateUtils';

export function createTravelTools(options: TravelToolsOptions = {}) {
  return {
    searchPlaces: searchPlacesTool,
    getWeatherHistory: getWeatherHistoryTool,
    getExchangeRate: getExchangeRateTool,
    searchAccommodation: createSearchAccommodationTool(options),
    searchEsim: createSearchEsimTool(options),
  };
}

export const travelTools = createTravelTools();
