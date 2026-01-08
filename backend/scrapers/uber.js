const puppeteer = require('puppeteer');

/**
 * Scrapes price from Uber
 * @param {Object} params - Ride parameters
 * @param {string} params.pickup - Pickup location
 * @param {string} params.drop - Drop location
 * @param {Object} params.session - User session/cookies
 * @returns {Promise<Object>} Price and ride details
 */
async function scrapeUberPrice(params) {
  const { pickup, drop, session } = params;
  
  let browser;
  try {
    console.log('🟢 Starting Uber scraper...');
    
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

    // Navigate to Uber mobile web
    await page.goto('https://m.uber.com', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if login is required
    const loginButton = await page.$('button:contains("Log in"), a[href*="login"]');
    
    if (loginButton && !session) {
      throw new Error('Login required for Uber. Please provide valid session.');
    }

    // Enter pickup location
    const pickupSelector = 'input[placeholder*="Pickup"], input[name*="pickup"], input[id*="pickup"]';
    await page.waitForSelector(pickupSelector, { timeout: 10000 });
    await page.click(pickupSelector);
    await page.type(pickupSelector, pickup);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Select first suggestion
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Enter drop location
    const dropSelector = 'input[placeholder*="Drop"], input[placeholder*="Where to"], input[name*="dropoff"]';
    await page.waitForSelector(dropSelector, { timeout: 5000 });
    await page.click(dropSelector);
    await page.type(dropSelector, drop);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Select first suggestion
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Wait for ride options to load
    await page.waitForSelector('[data-testid*="ride"], [class*="RideOption"], div[role="button"]', { 
      timeout: 15000 
    });

    // Extract pricing information
    const rideData = await page.evaluate(() => {
      const rides = [];
      
      // Multiple selectors to find ride cards
      const rideElements = document.querySelectorAll(
        '[data-testid*="ride"], [class*="RideOption"], [class*="vehicle-view"]'
      );
      
      rideElements.forEach(el => {
        // Find ride name
        const nameEl = el.querySelector('[class*="title"], [class*="name"], h3, h4');
        
        // Find price
        const priceEl = el.querySelector('[class*="fare"], [class*="price"], [class*="amount"]');
        
        // Find ETA
        const etaEl = el.querySelector('[class*="eta"], [class*="time"], small');
        
        if (nameEl && priceEl) {
          const priceText = priceEl.textContent.trim();
          // Match price with or without ₹ symbol
          const priceMatch = priceText.match(/₹?\s*(\d+)/);
          
          if (priceMatch) {
            rides.push({
              type: nameEl.textContent.trim(),
              price: parseInt(priceMatch[1]),
              currency: 'INR',
              eta: etaEl ? etaEl.textContent.trim() : 'N/A',
              priceDisplay: priceText
            });
          }
        }
      });
      
      return rides;
    });

    if (rideData.length === 0) {
      throw new Error('Could not extract price information from Uber');
    }

    console.log('✅ Uber scraper completed successfully');
    
    // Return the cheapest option (usually first one is UberGo)
    const cheapestRide = rideData[0];

    return {
      service: 'Uber',
      success: true,
      price: cheapestRide.price,
      currency: 'INR',
      rideType: cheapestRide.type,
      eta: cheapestRide.eta,
      allOptions: rideData,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Uber scraper error:', error.message);
    return {
      service: 'Uber',
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

module.exports = { scrapeUberPrice };
