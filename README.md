# MMR - Mozambique Metal Refiners
## Gold Price Tracker App

A professional cross-platform mobile and web application for tracking gold prices in real-time, built with Ionic Framework and TypeScript.

![Theme: Black & Gold](https://img.shields.io/badge/Theme-Black%20%26%20Gold-FFD700?style=for-the-badge)
![Platform: iOS | Android | Web](https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Web-blue?style=for-the-badge)

## Features

✨ **Real-time Gold Prices** - Live price updates from market data
📊 **Interactive Charts** - Recent price history visualization
💱 **Multi-Currency Support**:
- USD (US Dollar)
- ZAR (South African Rand)
- MZN (Mozambican Metical)

⚖️ **Multiple Weight Units**:
- Troy Ounces
- Grams
- Kilograms

🎨 **Premium Black & Gold Theme** - Professional, elegant design
📱 **Cross-Platform** - Single codebase for iOS, Android, and Web
⚡ **Real-time Updates** - Automatic price refresh

## Tech Stack

- **Framework**: Ionic 7 + Angular 17
- **Language**: TypeScript 5.2
- **Charts**: Chart.js + ng2-charts
- **Mobile**: Capacitor 5
- **Styling**: SCSS with custom theme

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v18 or higher)
- npm (v9 or higher)
- Ionic CLI: `npm install -g @ionic/cli`
- For iOS development: Xcode (macOS only)
- For Android development: Android Studio with SDK

## Installation

1. **Clone or navigate to the project directory**:
```bash
cd mmr-app
```

2. **Install dependencies**:
```bash
npm install
```

3. **Install Ionic CLI globally** (if not already installed):
```bash
npm install -g @ionic/cli
```

## Running the App

### Web Browser (Development)
```bash
ionic serve
```
or
```bash
npm start
```

The app will open in your browser at `http://localhost:8100`

### iOS (Requires macOS)

1. **Add iOS platform**:
```bash
ionic capacitor add ios
```

2. **Build and sync**:
```bash
ionic build
ionic capacitor sync ios
```

3. **Open in Xcode**:
```bash
ionic capacitor open ios
```

4. Run from Xcode on simulator or connected device

### Android

1. **Add Android platform**:
```bash
ionic capacitor add android
```

2. **Build and sync**:
```bash
ionic build
ionic capacitor sync android
```

3. **Open in Android Studio**:
```bash
ionic capacitor open android
```

4. Run from Android Studio on emulator or connected device

## Building for Production

### Web
```bash
ionic build --prod
```
Output will be in the `www/` directory

### iOS
```bash
ionic build --prod
ionic capacitor sync ios
ionic capacitor open ios
```
Then archive in Xcode for App Store submission

### Android
```bash
ionic build --prod
ionic capacitor sync android
ionic capacitor open android
```
Then build signed APK/AAB in Android Studio

## Project Structure

```
mmr-app/
├── src/
│   ├── app/
│   │   ├── home/              # Main page
│   │   │   ├── home.page.ts   # Page logic
│   │   │   ├── home.page.html # Template
│   │   │   └── home.page.scss # Styles
│   │   ├── services/          # Services
│   │   │   └── gold-price.service.ts
│   │   ├── models/            # Data models
│   │   │   └── gold.model.ts
│   │   ├── app.module.ts
│   │   └── app-routing.module.ts
│   ├── global.scss            # Global styles
│   ├── index.html
│   └── main.ts
├── capacitor.config.json      # Capacitor config
├── ionic.config.json          # Ionic config
├── angular.json               # Angular config
├── package.json
└── tsconfig.json
```

## Key Components

### GoldPriceService
Manages gold price data, currency conversions, and weight calculations.

**Features**:
- Real-time price simulation
- Historical data generation (30 days)
- Currency conversion (USD, ZAR, MZN)
- Weight conversion (oz, g, kg)
- Observable-based data stream

### HomePage
Main dashboard displaying:
- Current gold price
- Currency and weight selectors
- Interactive price chart
- Market information

## Customization

### Changing Currency Conversion Rates

Edit `/src/app/services/gold-price.service.ts`:

```typescript
private conversionRates: ConversionRates = {
  USD_ZAR: 18.50, // Update this
  USD_MZN: 63.75  // Update this
};
```

### Connecting to Real API

This app uses a Vercel Serverless Function to fetch live gold and FX rates.

Set the following environment variable in Vercel:

- `COMMODITYPRICE_API_KEY`

The function is located at `api/gold.ts` and the app calls it via `/api/gold`.

```typescript
// Example with a real API
import { HttpClient } from '@angular/common/http';

constructor(private http: HttpClient) {}

fetchRealPrices() {
  return this.http.get('https://api.example.com/gold-price');
}
```

### Theme Customization

Edit `/src/global.scss` to change colors:

```scss
:root {
  --ion-color-primary: #FFD700; // Gold color
  --ion-color-dark: #000000;    // Black color
}
```

## Features to Add (Future Enhancements)

- [ ] Push notifications for price alerts
- [ ] User authentication
- [ ] Price alert thresholds
- [ ] Multiple precious metals (Silver, Platinum)
- [ ] Portfolio tracking
- [ ] Price predictions using ML
- [ ] Export data to CSV/PDF
- [ ] Social sharing
- [ ] Dark/Light theme toggle
- [ ] Multi-language support

## Troubleshooting

### Port Already in Use
```bash
ionic serve --port=8101
```

### Build Errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### iOS Build Issues
```bash
cd ios/App
pod install
cd ../..
```

### Android Build Issues
```bash
ionic capacitor sync android --force
```

## Support

For issues or questions:
- Check the [Ionic Documentation](https://ionicframework.com/docs)
- Visit [Capacitor Documentation](https://capacitorjs.com/docs)
- Angular [Official Guide](https://angular.io/docs)

## License

This project is private and proprietary to Mozambique Metal Refiners (MMR).

## Version

Current Version: 1.0.0

---

**Built with ❤️ using Ionic Framework**

*For Mozambique Metal Refiners - Tracking Gold Prices with Precision*
