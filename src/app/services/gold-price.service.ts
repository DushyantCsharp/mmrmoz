import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { GoldPrice, Currency, Weight, PriceData, ConversionRates } from '../models/gold.model';

@Injectable({
  providedIn: 'root'
})
export class GoldPriceService {
  private currentPriceSubject = new BehaviorSubject<GoldPrice | null>(null);
  public currentPrice$: Observable<GoldPrice | null> = this.currentPriceSubject.asObservable();

  private historicalDataSubject = new BehaviorSubject<PriceData[]>([]);
  public historicalData$: Observable<PriceData[]> = this.historicalDataSubject.asObservable();

  // Current conversion rates (these would normally come from an API)
  private conversionRates: ConversionRates = {
    USD_ZAR: 18.50, // 1 USD = 18.50 ZAR
    USD_MZN: 63.75  // 1 USD = 63.75 MZN
  };

  // Weight conversion constants (all relative to troy ounce)
  private weightConversions = {
    oz: 1,           // Troy ounce (base unit)
    g: 31.1035,      // 1 troy oz = 31.1035 grams
    kg: 0.0311035    // 1 troy oz = 0.0311035 kg
  };

  constructor() {
    this.initializeMockData();
    this.startPriceUpdates();
  }

  private initializeMockData(): void {
    // Initialize with historical data for the past 30 days
    const historicalData: PriceData[] = [];
    const basePrice = 2050; // Base gold price per troy ounce in USD
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Add some realistic variation
      const variation = Math.sin(i / 5) * 30 + Math.random() * 20;
      const price = basePrice + variation;
      
      historicalData.push({
        date,
        price: Math.round(price * 100) / 100
      });
    }

    this.historicalDataSubject.next(historicalData);
    
    // Set initial current price
    this.updateCurrentPrice(historicalData[historicalData.length - 1].price);
  }

  private startPriceUpdates(): void {
    // Update price every 5 seconds with small variations
    interval(5000).subscribe(() => {
      const currentData = this.historicalDataSubject.value;
      const lastPrice = currentData[currentData.length - 1].price;
      
      // Small random variation (-0.5% to +0.5%)
      const variation = (Math.random() - 0.5) * lastPrice * 0.01;
      const newPrice = lastPrice + variation;
      
      this.updateCurrentPrice(newPrice);
      
      // Add to historical data
      const newData = [...currentData, {
        date: new Date(),
        price: Math.round(newPrice * 100) / 100
      }];
      
      // Keep only last 30 data points
      if (newData.length > 30) {
        newData.shift();
      }
      
      this.historicalDataSubject.next(newData);
    });
  }

  private updateCurrentPrice(priceUSD: number): void {
    const price: GoldPrice = {
      usd: Math.round(priceUSD * 100) / 100,
      zar: Math.round(priceUSD * this.conversionRates.USD_ZAR * 100) / 100,
      mzn: Math.round(priceUSD * this.conversionRates.USD_MZN * 100) / 100,
      timestamp: new Date()
    };
    
    this.currentPriceSubject.next(price);
  }

  public convertPrice(basePrice: number, fromWeight: Weight, toWeight: Weight): number {
    // Convert from source weight to troy ounce, then to target weight
    const pricePerOz = basePrice / this.weightConversions[fromWeight];
    const convertedPrice = pricePerOz * this.weightConversions[toWeight];
    return Math.round(convertedPrice * 100) / 100;
  }

  public getPrice(currency: Currency, weight: Weight = 'oz'): number | null {
    const current = this.currentPriceSubject.value;
    if (!current) return null;

    let basePrice: number;
    switch (currency) {
      case 'USD':
        basePrice = current.usd;
        break;
      case 'ZAR':
        basePrice = current.zar;
        break;
      case 'MZN':
        basePrice = current.mzn;
        break;
    }

    // Price is stored per troy ounce, convert if needed
    return this.convertPrice(basePrice, 'oz', weight);
  }

  public getHistoricalData(currency: Currency): PriceData[] {
    const historicalData = this.historicalDataSubject.value;
    
    if (currency === 'USD') {
      return historicalData;
    }
    
    // Convert to selected currency
    const rate = currency === 'ZAR' ? this.conversionRates.USD_ZAR : this.conversionRates.USD_MZN;
    
    return historicalData.map(data => ({
      date: data.date,
      price: Math.round(data.price * rate * 100) / 100
    }));
  }

  public getCurrencySymbol(currency: Currency): string {
    switch (currency) {
      case 'USD': return '$';
      case 'ZAR': return 'R';
      case 'MZN': return 'MT';
    }
  }

  public getWeightLabel(weight: Weight): string {
    switch (weight) {
      case 'oz': return 'Troy Ounce';
      case 'g': return 'Gram';
      case 'kg': return 'Kilogram';
    }
  }
}
