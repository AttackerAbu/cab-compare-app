# Cab Compare Mobile App 📱

React Native app for comparing cab prices across Ola, Uber, Rapido, and Namma Yatri.

## 🎯 Features

- 🔐 Connect all 4 cab services (one-time setup)
- 📍 Enter pickup/drop location once
- ⚡ Real-time price comparison
- 💰 See cheapest option highlighted
- 🔗 One-tap booking (deep links to apps)
- 🧮 Split fare calculator
- 📊 Price history & stats

## 📦 Prerequisites

### For Development:
- Node.js (v16+)
- React Native CLI
- Android Studio (for Android)
- Xcode (for iOS, Mac only)

### For Running the App:
- Your backend server running
- Android 8.0+ OR iOS 13+

## 🚀 Quick Start

### Step 1: Setup React Native Environment

**Windows/Mac/Linux:**
```bash
# Install React Native CLI globally
npm install -g react-native-cli

# Verify installation
npx react-native --version
```

**Android Setup:**
1. Download Android Studio
2. Install Android SDK
3. Set ANDROID_HOME environment variable
4. Add platform-tools to PATH

**iOS Setup (Mac only):**
```bash
# Install Xcode from Mac App Store
# Install CocoaPods
sudo gem install cocoapods
```

### Step 2: Install Dependencies

```bash
cd mobile-app
npm install

# For iOS only:
cd ios && pod install && cd ..
```

### Step 3: Configure Backend URL

Create `config.js`:
```javascript
export const API_BASE_URL = 'http://localhost:3000'; // Development
// export const API_BASE_URL = 'https://your-backend.railway.app'; // Production
```

### Step 4: Run the App

**Android:**
```bash
# Start Metro bundler
npm start

# In another terminal, run Android
npm run android
```

**iOS (Mac only):**
```bash
npm run ios
```

## 🏗️ App Structure

```
mobile-app/
├── App.js                 # Main app component
├── src/
│   ├── screens/
│   │   ├── OnboardingScreen.js
│   │   ├── ConnectServicesScreen.js
│   │   ├── HomeScreen.js
│   │   ├── ComparisonScreen.js
│   │   └── ProfileScreen.js
│   ├── components/
│   │   ├── ServiceCard.js
│   │   ├── PriceCard.js
│   │   └── SplitFareCalculator.js
│   ├── services/
│   │   ├── api.js         # Backend API calls
│   │   └── storage.js     # AsyncStorage utilities
│   ├── utils/
│   │   └── helpers.js
│   └── navigation/
│       └── AppNavigator.js
└── android/               # Android native code
└── ios/                   # iOS native code
```

## 🔧 Key Features Implementation

### 1. Connect Services (WebView Login)

Users log into each service once:

```javascript
import { WebView } from 'react-native-webview';

function ConnectOlaScreen() {
  const [cookies, setCookies] = useState(null);
  
  const handleNavigationStateChange = (navState) => {
    // Capture cookies after successful login
    if (navState.url.includes('success') || navState.url.includes('dashboard')) {
      WebView.getCookies('https://book.olacabs.com')
        .then(cookies => {
          // Save cookies to backend
          saveCookies('ola', cookies);
        });
    }
  };
  
  return (
    <WebView
      source={{ uri: 'https://book.olacabs.com' }}
      onNavigationStateChange={handleNavigationStateChange}
    />
  );
}
```

### 2. Price Comparison

```javascript
import axios from 'axios';

async function comparePrice(pickup, drop) {
  const response = await axios.post(`${API_BASE_URL}/api/prices/compare`, {
    pickup,
    drop,
    sessions: await getStoredSessions()
  });
  
  return response.data;
}
```

### 3. Deep Linking

```javascript
import { Linking } from 'react-native';

function bookWithService(service, deepLink) {
  Linking.openURL(deepLink)
    .catch(err => {
      // Fallback to web if app not installed
      Linking.openURL(service.webUrl);
    });
}
```

## 📱 User Flow

### First Time User:
1. **Onboarding** → Explain how it works
2. **Connect Services** → Login to Ola, Uber, Rapido, Namma Yatri
3. **Grant Location** → For automatic pickup detection
4. **Ready to Use!**

### Returning User:
1. **Open App** → Auto-detect current location
2. **Enter Destination** → Type or select
3. **See Comparison** → All 4 prices in 3-5 seconds
4. **Book** → Tap cheapest option → Opens app

## 🎨 UI/UX Guidelines

### Design Principles:
- **Fast**: Show results in < 5 seconds
- **Clear**: Cheapest option is obvious
- **Simple**: Minimal taps to book
- **Beautiful**: Professional, modern design

### Color Scheme:
```javascript
const colors = {
  primary: '#4CAF50',      // Green for cheapest
  secondary: '#2196F3',    // Blue
  warning: '#FF9800',      // Orange
  danger: '#F44336',       // Red for expensive
  background: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575'
};
```

### Key Screens:

**Home Screen:**
- Current location (auto-detected)
- Destination input (autocomplete)
- Recent searches
- "Compare Prices" button

**Comparison Screen:**
- 4 cards (one per service)
- Price prominently displayed
- Cheapest has green border
- ETA shown
- "Book" button on each

**Profile Screen:**
- Connected services status
- Disconnect/reconnect options
- Settings
- About

## 🔐 Security

### Handling Sessions:
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Securely store cookies
async function storeCookies(service, cookies) {
  // Encrypt cookies before storing (use react-native-keychain in production)
  await AsyncStorage.setItem(`${service}_cookies`, JSON.stringify(cookies));
  
  // Also send to backend
  await axios.post(`${API_BASE_URL}/api/auth/save-session`, {
    userId: await getUserId(),
    service,
    cookies
  });
}
```

### Permissions:
```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

## 📦 Building for Production

### Android APK:
```bash
cd android

# Generate release APK
./gradlew assembleRelease

# APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

### iOS (Mac only):
```bash
# Open Xcode
open ios/CabCompare.xcworkspace

# Product → Archive → Distribute
```

## 🚀 Publishing

### Google Play Store:
1. Create developer account ($25 one-time)
2. Prepare store listing
3. Upload APK/AAB
4. Submit for review

**Timeline:** 1-3 days for approval

### Apple App Store:
1. Create developer account ($99/year)
2. Prepare store listing
3. Upload via Xcode
4. Submit for review

**Timeline:** 1-2 weeks for approval

## 💰 App Development Cost

### Option 1: You Learn & Build
- **Time:** 2-4 weeks
- **Cost:** ₹0 (just your time)
- **Resources:** 
  - React Native docs
  - YouTube tutorials
  - This codebase as reference

### Option 2: Hire Freelancer
- **Time:** 1-2 weeks
- **Cost:** ₹30,000 - ₹50,000
- **Platform:** Upwork, Fiverr, Freelancer.com

### Option 3: Development Agency
- **Time:** 2-4 weeks
- **Cost:** ₹1,00,000 - ₹3,00,000
- **Better quality but expensive**

## 📚 Learning Resources

### For React Native:
- Official docs: reactnative.dev
- Free course: YouTube "React Native Tutorial"
- Community: Reddit r/reactnative

### For Your Specific Needs:
1. **WebView authentication:** 
   - Search: "React Native WebView cookie handling"
2. **Deep linking:**
   - Search: "React Native deep linking tutorial"
3. **API integration:**
   - Search: "React Native axios tutorial"

## 🐛 Common Issues

### Issue: Metro bundler not starting
```bash
# Clear cache
npx react-native start --reset-cache
```

### Issue: Android build failed
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### Issue: iOS pods error
```bash
cd ios
pod deintegrate
pod install
cd ..
```

## 🎯 Next Steps

1. ✅ Set up React Native environment
2. ✅ Run the app locally
3. ✅ Connect to your backend
4. ✅ Test with real Chennai routes
5. ✅ Customize UI/branding
6. ✅ Build APK
7. ✅ Test with 10-20 users
8. ✅ Publish to Play Store

## 💡 Pro Tips

### For Faster Development:
- Use Expo if you don't need native modules
- Test on real device, not just emulator
- Use React Native Debugger
- Hot reload saves tons of time

### For Better UX:
- Show loading states
- Handle offline mode
- Cache recent searches
- Add haptic feedback
- Smooth animations

### For Production:
- Enable ProGuard (Android)
- Optimize images
- Minimize bundle size
- Test on low-end devices
- Handle errors gracefully

---

**Built with React Native ⚛️ Made in India 🇮🇳**
