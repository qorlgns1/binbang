const { checkAirbnb } = require('./airbnb');
const { checkAgoda } = require('./agoda');

/**
 * 플랫폼에 맞는 체커 실행
 */
async function checkAccommodation(accommodation) {
  const { platform } = accommodation;

  switch (platform.toLowerCase()) {
    case 'airbnb':
      return await checkAirbnb(accommodation);
    case 'agoda':
      return await checkAgoda(accommodation);
    default:
      return {
        available: false,
        price: null,
        error: `지원하지 않는 플랫폼: ${platform}`,
      };
  }
}

module.exports = { checkAccommodation };
