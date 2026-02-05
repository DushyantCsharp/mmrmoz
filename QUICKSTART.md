# Quick Start Guide - MMR Gold Tracker

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Run the App
```bash
npm start
```
or
```bash
ionic serve
```

### Step 3: Open in Browser
The app will automatically open at `http://localhost:8100`

---

## 📱 Build for Mobile

### For Android:
```bash
# First time only
ionic capacitor add android

# Build and run
ionic build
ionic capacitor sync android
ionic capacitor open android
```

### For iOS (macOS only):
```bash
# First time only
ionic capacitor add ios

# Build and run
ionic build
ionic capacitor sync ios
ionic capacitor open ios
```

---

## 🎨 What You'll See

- **Live Gold Prices** in USD, ZAR, and MZN
- **Interactive Chart** showing 30-day price history
- **Weight Converter** for Ounces, Grams, and Kilograms
- **Beautiful Black & Gold Theme**
- **Real-time Updates** every 5 seconds

---

## ⚙️ Common Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start development server |
| `npm run build` | Build for production |
| `ionic serve` | Run in browser with live reload |
| `ionic build` | Build the app |
| `ionic capacitor sync` | Sync web code to native projects |

---

## 🔧 Configuration

### Update Currency Rates
Edit `src/app/services/gold-price.service.ts`:
```typescript
private conversionRates = {
  USD_ZAR: 18.50, // 1 USD = 18.50 ZAR
  USD_MZN: 63.75  // 1 USD = 63.75 MZN
};
```

### Connect Real API
1. Get API key from gold price provider
2. Update `src/environments/environment.ts`
3. Modify `GoldPriceService` to fetch from API

---

## 📊 Features

✅ Real-time gold price tracking
✅ Multi-currency support (USD, ZAR, MZN)
✅ Multiple weight units (oz, g, kg)
✅ Historical price charts
✅ Responsive design
✅ Cross-platform (iOS, Android, Web)
✅ Black & Gold premium theme

---

## 🆘 Need Help?

**App not starting?**
```bash
rm -rf node_modules package-lock.json
npm install
npm start
```

**Port already in use?**
```bash
ionic serve --port=8101
```

**Build errors?**
1. Delete `node_modules` folder
2. Run `npm install`
3. Try again

---

## 📖 Full Documentation

See `README.md` for complete documentation including:
- Detailed installation instructions
- Platform-specific build guides
- Customization options
- API integration examples
- Troubleshooting guide

---

**Enjoy tracking gold prices with MMR! 🏆**
