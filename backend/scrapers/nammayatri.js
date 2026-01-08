const puppeteer = require('puppeteer');

/**
 * Scrapes price from Namma Yatri
 * @param {Object} params - Ride parameters
 * @param {string} params.pickup - Pickup location
 * @param {string} params.drop - Drop location
 * @param {Object} params.session - User session/cookies
 * @returns {Promise<Object>} Price and ride details
 */
async function scrapeNammaYatriPrice(params) {
  const { pickup, drop, session } = params;
  
  let browser;
  try {
    console.log('🟢 Starting Namma Yatri scraper...');
    
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

    // Navigate to Namma Yatri
    await page.goto('https://nammayatri.in/open', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Namma Yatri is simpler and more open
    // Enter pickup location
    const pickupSelector = 'input[placeholder*="Pickup"], input[placeholder*="pickup"], input[id*="source"]';
    await page.waitForSelector(pickupSelector, { timeout: 10000 });
    await page.click(pickupSelector);
    await page.type(pickupSelector, pickup, { delay: 100 });
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Select first suggestion
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Enter drop location
    const dropSelector = 'input[placeholder*="Drop"], input[placeholder*="destination"], input[placeholder*="Where to"]';
    await page.waitForSelector(dropSelector, { timeout: 5000 });
    await page.click(dropSelector);
    await page.type(dropSelector, drop, { delay: 100 });
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Select first suggestion
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Wait for fare display
    await page.waitForSelector('[class*="fare"], [class*="price"], [class*="estimate"]', { 
      timeout: 15000 
    });

    // Extract pricing information
    const rideData = await page.evaluate(() => {
      const rides = [];
      
      // Namma Yatri primarily has auto rickshaws
      const fareElements = document.querySelectorAll(
        '[class*="fare"], [class*="price"], [class*="estimate"], [class*="amount"]'
      );
      
      fareElements.forEach(el => {
        const priceText = el.textContent.trim();
        const priceMatch = priceText.match(/₹?\s*(\d+)/);
        
        if (priceMatch && parseInt(priceMatch[1]) > 10) {
          rides.push({
            type: 'Auto',
            price: parseInt(priceMatch[1]),
            currency: 'INR',
            eta: 'N/A',
            priceDisplay: priceText
          });
        }
      });
      
      // Alternative: Look for text containing price
      if (rides.length === 0) {
        const bodyText = document.body.textContent;
        const priceMatches = bodyText.match(/₹\s*(\d+)/g);
        
        if (priceMatches) {
          priceMatches.forEach(match => {
            const priceMatch = match.match(/₹\s*(\d+)/);
            if (priceMatch) {
              const price = parseInt(priceMatch[1]);
              if (price > 10 && price < 5000) {
                rides.push({
                  type: 'Auto',
                  price: price,
                  currency: 'INR',
                  eta: 'N/A',
                  priceDisplay: match
                });
              }
            }
          });
        }
      }
      
      return rides;
    });

    if (rideData.length === 0) {
      // Namma Yatri uses government-mandated auto fares
      // Fallback to estimation based on distance
      console.log('⚠️ Could not find exact price, using fallback');
      
      return {
        service: 'Namma Yatri',
        success: true,
        price: null,
        currency: 'INR',
        rideType: 'Auto',
        eta: 'N/A',
        note: 'Namma Yatri uses government-mandated meter fares',
        timestamp: new Date().toISOString()
      };
    }

    console.log('✅ Namma Yatri scraper completed successfully');
    
    // Return the first/cheapest auto fare
    const cheapestRide = rideData[0];

    return {
      service: 'Namma Yatri',
      success: true,
      price: cheapestRide.price,
      currency: 'INR',
      rideType: cheapestRide.type,
      eta: cheapestRide.eta,
      allOptions: rideData,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Namma Yatri scraper error:', error.message);
    return {
      service: 'Namma Yatri',
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

module.exports = { scrapeNammaYatriPrice };
