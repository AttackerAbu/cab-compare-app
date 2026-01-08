const puppeteer = require('puppeteer');

/**
 * Scrapes price from Ola Cabs
 * @param {Object} params - Ride parameters
 * @param {string} params.pickup - Pickup location
 * @param {string} params.drop - Drop location
 * @param {Object} params.session - User session/cookies
 * @returns {Promise<Object>} Price and ride details
 */
async function scrapeOlaPrice(params) {
  const { pickup, drop, session } = params;
  
  let browser;
  try {
    console.log('🟢 Starting Ola scraper...');
    
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

    // Navigate to Ola booking page
    await page.goto('https://book.olacabs.com', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Wait for the page to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if login is required
    const isLoggedIn = await page.evaluate(() => {
      // Check for elements that indicate logged-in state
      return !document.querySelector('input[type="tel"]') && 
             !document.querySelector('button:contains("Login")');
    });

    if (!isLoggedIn && !session) {
      throw new Error('Login required for Ola. Please provide valid session.');
    }

    // Enter pickup location
    await page.waitForSelector('input[placeholder*="Pickup"]', { timeout: 10000 });
    await page.type('input[placeholder*="Pickup"]', pickup);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Select first suggestion
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Enter drop location
    await page.type('input[placeholder*="Drop"]', drop);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Select first suggestion
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Wait for fare estimation
    await page.waitForSelector('[class*="fare"], [class*="price"]', { timeout: 15000 });

    // Extract pricing information
    const rideData = await page.evaluate(() => {
      const rides = [];
      
      // Look for fare cards/elements
      const fareElements = document.querySelectorAll('[class*="ride-option"], [class*="cab-card"], [class*="category"]');
      
      fareElements.forEach(el => {
        const nameEl = el.querySelector('[class*="name"], [class*="title"], [class*="category-name"]');
        const priceEl = el.querySelector('[class*="fare"], [class*="price"], [class*="amount"]');
        const etaEl = el.querySelector('[class*="eta"], [class*="time"]');
        
        if (nameEl && priceEl) {
          const priceText = priceEl.textContent.trim();
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
      throw new Error('Could not extract price information from Ola');
    }

    console.log('✅ Ola scraper completed successfully');
    
    // Return the cheapest auto option
    const autoRide = rideData.find(r => r.type.toLowerCase().includes('auto'));
    const cheapestRide = autoRide || rideData[0];

    return {
      service: 'Ola',
      success: true,
      price: cheapestRide.price,
      currency: 'INR',
      rideType: cheapestRide.type,
      eta: cheapestRide.eta,
      allOptions: rideData,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Ola scraper error:', error.message);
    return {
      service: 'Ola',
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

module.exports = { scrapeOlaPrice };
