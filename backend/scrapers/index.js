const { scrapeOlaPrice } = require('./ola');
const { scrapeUberPrice } = require('./uber');
const { scrapeRapidoPrice } = require('./rapido');
const { scrapeNammaYatriPrice } = require('./nammayatri');

/**
 * Compare prices from all cab services
 * @param {Object} params - Comparison parameters
 * @param {string} params.pickup - Pickup location
 * @param {string} params.drop - Drop location
 * @param {Object} params.sessions - User sessions for each service
 * @returns {Promise<Object>} Comparison results
 */
async function compareAllPrices(params) {
  const { pickup, drop, sessions = {} } = params;
  
  console.log('🚀 Starting price comparison...');
  console.log(`📍 Route: ${pickup} → ${drop}`);
  
  const startTime = Date.now();
  
  // Run all scrapers in parallel for speed
  const results = await Promise.allSettled([
    scrapeOlaPrice({ pickup, drop, session: sessions.ola }),
    scrapeUberPrice({ pickup, drop, session: sessions.uber }),
    scrapeRapidoPrice({ pickup, drop, session: sessions.rapido }),
    scrapeNammaYatriPrice({ pickup, drop, session: sessions.nammayatri })
  ]);
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // Process results
  const prices = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      const services = ['Ola', 'Uber', 'Rapido', 'Namma Yatri'];
      return {
        service: services[index],
        success: false,
        error: result.reason.message,
        timestamp: new Date().toISOString()
      };
    }
  });
  
  // Filter successful results
  const successfulPrices = prices.filter(p => p.success && p.price !== null);
  
  // Find cheapest option
  let cheapest = null;
  if (successfulPrices.length > 0) {
    cheapest = successfulPrices.reduce((min, current) => 
      current.price < min.price ? current : min
    );
  }
  
  // Calculate statistics
  const stats = {
    totalServices: 4,
    successfulServices: successfulPrices.length,
    failedServices: 4 - successfulPrices.length,
    duration: `${duration}s`
  };
  
  if (successfulPrices.length > 0) {
    const priceValues = successfulPrices.map(p => p.price);
    stats.minPrice = Math.min(...priceValues);
    stats.maxPrice = Math.max(...priceValues);
    stats.avgPrice = (priceValues.reduce((a, b) => a + b, 0) / priceValues.length).toFixed(0);
    stats.priceDifference = stats.maxPrice - stats.minPrice;
    stats.savings = stats.priceDifference;
  }
  
  console.log(`✅ Comparison completed in ${duration}s`);
  console.log(`📊 Success rate: ${successfulPrices.length}/4`);
  
  if (cheapest) {
    console.log(`💰 Cheapest: ${cheapest.service} at ₹${cheapest.price}`);
  }
  
  return {
    success: true,
    route: {
      pickup,
      drop
    },
    prices,
    cheapest,
    stats,
    timestamp: new Date().toISOString()
  };
}

/**
 * Get deep link URLs for each service
 * @param {Object} params - Route parameters
 * @returns {Object} Deep link URLs
 */
function getDeepLinks(params) {
  const { pickup, drop, pickupLat, pickupLng, dropLat, dropLng } = params;
  
  return {
    ola: `https://book.olacabs.com/?pickup=${encodeURIComponent(pickup)}&drop=${encodeURIComponent(drop)}`,
    uber: pickupLat && pickupLng && dropLat && dropLng 
      ? `uber://?action=setPickup&pickup[latitude]=${pickupLat}&pickup[longitude]=${pickupLng}&dropoff[latitude]=${dropLat}&dropoff[longitude]=${dropLng}`
      : `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff=${encodeURIComponent(drop)}`,
    rapido: `https://www.rapido.bike/ride?pickup=${encodeURIComponent(pickup)}&drop=${encodeURIComponent(drop)}`,
    nammayatri: `nammayatri://ride?pickup=${encodeURIComponent(pickup)}&drop=${encodeURIComponent(drop)}`
  };
}

module.exports = {
  compareAllPrices,
  getDeepLinks
};
