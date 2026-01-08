const puppeteer = require('puppeteer');

/**
 * Scrapes price from Rapido
 * @param {Object} params - Ride parameters
 * @param {string} params.pickup - Pickup location
 * @param {string} params.drop - Drop location
 * @param {Object} params.session - User session/cookies
 * @returns {Promise<Object>} Price and ride details
 */
async function scrapeRapidoPrice(params) {
  const { pickup, drop, session } = params;
  
  let browser;
  try {
    console.log('🟢 Starting Rapido scraper...');
    
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    // Set user session if provided
    if (session && session.cookies) {
      await page.setCookie(...session.cookies);
    }

    // Navigate to Rapido booking page
    await page.goto('https://www.rapido.bike', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Enter pickup location
    const pickupSelector = 'input[placeholder*="Pickup"], input[name*="pickup"], input[id*="source"]';
    await page.waitForSelector(pickupSelector, { timeout: 10000 });
    await page.click(pickupSelector);
    await page.type(pickupSelector, pickup, { delay: 100 });
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Select first suggestion
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Enter drop location
    const dropSelector = 'input[placeholder*="Drop"], input[placeholder*="destination"], input[name*="drop"]';
    await page.waitForSelector(dropSelector, { timeout: 5000 });
    await page.click(dropSelector);
    await page.type(dropSelector, drop, { delay: 100 });
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Select first suggestion
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Click "Book Ride" or similar button to see prices
    const bookButton = await page.$('button:contains("Book"), button[class*="book"]');
    if (bookButton) {
      await bookButton.click();
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Wait for fare/price to appear
    await page.waitForSelector('[class*="fare"], [class*="price"], [class*="amount"]', { 
      timeout: 15000 
    });

    // Extract pricing information
    const rideData = await page.evaluate(() => {
      const rides = [];
      
      // Rapido typically shows bike, auto, cab options
      const rideElements = document.querySelectorAll(
        '[class*="ride-card"], [class*="vehicle-card"], div[class*="option"]'
      );
      
      rideElements.forEach(el => {
        const nameEl = el.querySelector('[class*="name"], [class*="type"], [class*="title"], img[alt]');
        const priceEl = el.querySelector('[class*="fare"], [class*="price"], [class*="amount"]');
        const etaEl = el.querySelector('[class*="eta"], [class*="time"]');
        
        if (priceEl) {
          const priceText = priceEl.textContent.trim();
          const priceMatch = priceText.match(/₹?\s*(\d+)/);
          
          if (priceMatch) {
            let vehicleType = 'Bike'; // Default
            
            if (nameEl) {
              const nameText = nameEl.textContent || nameEl.alt || '';
              vehicleType = nameText.trim();
            }
            
            rides.push({
              type: vehicleType,
              price: parseInt(priceMatch[1]),
              currency: 'INR',
              eta: etaEl ? etaEl.textContent.trim() : 'N/A',
              priceDisplay: priceText
            });
          }
        }
      });
      
      // If no cards found, try alternative selectors
      if (rides.length === 0) {
        const priceElements = document.querySelectorAll('[class*="price"], [class*="fare"]');
        priceElements.forEach(el => {
          const priceText = el.textContent.trim();
          const priceMatch = priceText.match(/₹?\s*(\d+)/);
          
          if (priceMatch && parseInt(priceMatch[1]) > 10) {
            rides.push({
              type: 'Rapido Bike',
              price: parseInt(priceMatch[1]),
              currency: 'INR',
              eta: 'N/A',
              priceDisplay: priceText
            });
          }
        });
      }
      
      return rides;
    });

    if (rideData.length === 0) {
      throw new Error('Could not extract price information from Rapido');
    }

    console.log('✅ Rapido scraper completed successfully');
    
    // Rapido is usually cheapest with bikes
    const bikeRide = rideData.find(r => r.type.toLowerCase().includes('bike'));
    const cheapestRide = bikeRide || rideData[0];

    return {
      service: 'Rapido',
      success: true,
      price: cheapestRide.price,
      currency: 'INR',
      rideType: cheapestRide.type,
      eta: cheapestRide.eta,
      allOptions: rideData,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Rapido scraper error:', error.message);
    return {
      service: 'Rapido',
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = { scrapeRapidoPrice };
