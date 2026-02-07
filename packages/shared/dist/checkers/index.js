import { checkAgoda } from './agoda';
import { checkAirbnb } from './airbnb';
export async function checkAccommodation(accommodation) {
    switch (accommodation.platform) {
        case 'AIRBNB':
            return checkAirbnb(accommodation);
        case 'AGODA':
            return checkAgoda(accommodation);
        default:
            return {
                available: false,
                price: null,
                checkUrl: accommodation.url,
                error: `Unknown platform: ${accommodation.platform}`,
                retryCount: 0,
            };
    }
}
