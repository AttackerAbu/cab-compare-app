# Cab Compare Backend 🚕

Real-time price comparison backend for Ola, Uber, Rapido, and Namma Yatri.

## 🎯 What This Does

This backend service:
- Scrapes real-time prices from 4 cab services
- Runs all scrapers in parallel (fast!)
- Manages user sessions/cookies
- Provides REST API for mobile app
- Generates deep links for booking

## 📦 Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- 2GB RAM minimum
- Linux/Mac/Windows

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your settings (optional for testing)
nano .env
```

### 3. Run the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will start on `http://localhost:3000`

## 📡 API Endpoints

### 1. Health Check
```bash
GET /health
```
**Response:**
```json
{
  "status": "ok",
  "message": "Cab Compare Backend is running",
  "timestamp": "2025-01-07T15:30:00.000Z"
}
```

### 2. Compare Prices
```bash
POST /api/prices/compare
Content-Type: application/json

{
  "pickup": "Sivaprakasam Nagar, Chennai",
  "drop": "Anna Nagar, Chennai",
  "sessions": {
    "ola": { "cookies": [...] },
    "uber": { "cookies": [...] },
    "rapido": { "cookies": [...] },
    "nammayatri": { "cookies": [...] }
  }
}
```

**Response:**
```json
{
  "success": true,
  "route": {
    "pickup": "Sivaprakasam Nagar, Chennai",
    "drop": "Anna Nagar, Chennai"
  },
  "prices": [
    {
      "service": "Ola",
      "success": true,
      "price": 120,
      "currency": "INR",
      "rideType": "Auto",
      "eta": "5 mins"
    },
    {
      "service": "Uber",
      "success": true,
      "price": 135,
      "currency": "INR",
      "rideType": "UberGo",
      "eta": "4 mins"
    },
    {
      "service": "Rapido",
      "success": true,
      "price": 95,
      "currency": "INR",
      "rideType": "Bike",
      "eta": "3 mins"
    },
    {
      "service": "Namma Yatri",
      "success": true,
      "price": 110,
      "currency": "INR",
      "rideType": "Auto",
      "eta": "6 mins"
    }
  ],
  "cheapest": {
    "service": "Rapido",
    "price": 95,
    "currency": "INR",
    "rideType": "Bike"
  },
  "stats": {
    "totalServices": 4,
    "successfulServices": 4,
    "failedServices": 0,
    "duration": "4.32s",
    "minPrice": 95,
    "maxPrice": 135,
    "avgPrice": "115",
    "priceDifference": 40,
    "savings": 40
  },
  "deepLinks": {
    "ola": "https://book.olacabs.com/?pickup=...",
    "uber": "uber://?action=setPickup&...",
    "rapido": "https://www.rapido.bike/ride?...",
    "nammayatri": "nammayatri://ride?..."
  },
  "timestamp": "2025-01-07T15:30:00.000Z"
}
```

### 3. Save User Session
```bash
POST /api/auth/save-session
Content-Type: application/json

{
  "userId": "user123",
  "service": "ola",
  "cookies": [
    {
      "name": "session_id",
      "value": "abc123...",
      "domain": ".olacabs.com"
    }
  ]
}
```

### 4. Get User Sessions
```bash
GET /api/auth/get-sessions/user123
```

### 5. Get Deep Links
```bash
GET /api/prices/deep-links?pickup=Location1&drop=Location2
```

## 🔧 Configuration

### Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Sessions
SESSION_SECRET=your-secret-key

# CORS
ALLOWED_ORIGINS=http://localhost:3000

# Scraping
SCRAPING_TIMEOUT=30000
MAX_CONCURRENT_SCRAPES=4
```

## 🏗️ Project Structure

```
backend/
├── server.js              # Main Express server
├── package.json           # Dependencies
├── .env                   # Environment variables
├── routes/
│   ├── prices.js         # Price comparison endpoints
│   └── auth.js           # Session management endpoints
├── scrapers/
│   ├── index.js          # Main comparison orchestrator
│   ├── ola.js            # Ola scraper
│   ├── uber.js           # Uber scraper
│   ├── rapido.js         # Rapido scraper
│   └── nammayatri.js     # Namma Yatri scraper
└── data/
    └── sessions.json     # User sessions (file-based storage)
```

## 🐛 Testing

### Test Health Endpoint
```bash
curl http://localhost:3000/health
```

### Test Price Comparison (without sessions)
```bash
curl -X POST http://localhost:3000/api/prices/compare \
  -H "Content-Type: application/json" \
  -d '{
    "pickup": "Sivaprakasam Nagar, Chennai",
    "drop": "Anna Nagar, Chennai"
  }'
```

**Note:** Without valid sessions, scrapers may fail at login stage.

## 📱 Mobile App Integration

The mobile app should:

1. **First Time Setup:**
   - User opens each service in WebView
   - User logs in
   - App captures cookies/tokens
   - App sends to backend via `/api/auth/save-session`

2. **Every Comparison:**
   - User enters pickup/drop
   - App calls `/api/prices/compare` with user sessions
   - App displays results
   - User clicks "Book with X" using deep links

## 🚀 Deployment

### Option 1: Railway.app (Easiest)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway up
```
**Cost:** Free tier available, then ~₹2000/month

### Option 2: DigitalOcean
1. Create a Droplet (Ubuntu 22.04)
2. Install Node.js
3. Clone your code
4. Run with PM2:
```bash
npm install -g pm2
pm2 start server.js --name cab-compare
pm2 save
```
**Cost:** ₹500-2000/month depending on size

### Option 3: Render.com
1. Connect GitHub repo
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Deploy

**Cost:** Free tier available

## ⚠️ Important Notes

### 1. Legal Considerations
- Web scraping may violate terms of service
- This is for educational purposes
- Consider reaching out to services for official API access
- Use responsibly

### 2. Session Management
- Current implementation uses file storage
- For production, use Redis or database
- Implement proper encryption for cookies
- Add session expiry logic

### 3. Rate Limiting
- Services may block excessive requests
- Implement caching (5-10 min)
- Add request delays between scrapes
- Monitor for IP blocks

### 4. Error Handling
- Scrapers may fail due to website changes
- Always have fallback mechanisms
- Log errors for debugging
- Update selectors as needed

## 🔒 Security

### Before Production:
1. ✅ Change SESSION_SECRET in .env
2. ✅ Enable HTTPS
3. ✅ Implement rate limiting
4. ✅ Add authentication for API
5. ✅ Encrypt stored sessions
6. ✅ Use environment variables for secrets
7. ✅ Set up monitoring/logging

## 📊 Monitoring

### Recommended Tools:
- **Sentry**: Error tracking
- **PM2**: Process management
- **Logs**: Use Winston or Pino
- **Uptime**: UptimeRobot (free)

## 🤝 Contributing

This is your project! Improve it as needed:
- Add caching layer
- Improve scraper selectors
- Add more error handling
- Optimize performance

## 📞 Support

For issues:
1. Check logs: `pm2 logs cab-compare`
2. Verify network access to cab sites
3. Update Puppeteer if sites change
4. Check session validity

## 📝 License

MIT License - Use freely for your startup!

---

Built with ❤️ for comparing cab prices in India 🇮🇳
