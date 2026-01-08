const express = require('express');
const router = express.Router();

/**
 * POST /api/prices/compare
 * Generate URLs for all cab services
 */
router.post('/compare', async (req, res) => {
  try {
    const { pickup, drop, pickupLat, pickupLng, dropLat, dropLng } = req.body;
    
    if (!pickup || !drop || !pickupLat || !pickupLng || !dropLat || !dropLng) {
      return res.status(400).json({
        error: true,
        message: 'All fields required: pickup, drop, pickupLat, pickupLng, dropLat, dropLng'
      });
    }
    
    console.log('📨 Received comparison request:', { pickup, drop });
    
    // Build Uber pickup/drop JSON objects
    const uberPickup = {
      addressLine1: pickup.split(',')[0].trim(),
      addressLine2: pickup.split(',').slice(1).join(',').trim(),
      fullAddress: pickup,
      latitude: pickupLat,
      longitude: pickupLng,
      provider: "google_places"
    };
    
    const uberDrop = {
      addressLine1: drop.split(',')[0].trim(),
      addressLine2: drop.split(',').slice(1).join(',').trim(),
      fullAddress: drop,
      latitude: dropLat,
      longitude: dropLng,
      provider: "google_places"
    };
    
    const urls = {
      uber: `https://m.uber.com/looking?pickup=${encodeURIComponent(JSON.stringify(uberPickup))}&drop[0]=${encodeURIComponent(JSON.stringify(uberDrop))}`,
      
      ola: `https://book.olacabs.com/?pickup_name=${encodeURIComponent(pickup)}&lat=${pickupLat}&lng=${pickupLng}&drop_lat=${dropLat}&drop_lng=${dropLng}&drop_name=${encodeURIComponent(drop)}`,
      
      rapido: `https://m.rapido.bike/unup-home/seo/${encodeURIComponent(pickup)}/${encodeURIComponent(drop)}?version=v3`
    };
    
    res.json({
      success: true,
      route: { pickup, drop },
      urls,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to generate URLs',
      details: error.message
    });
  }
});

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'price-comparison',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;