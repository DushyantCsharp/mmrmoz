import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, timer, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { GoldPrice, Currency, Weight, PriceData, ConversionRates } from '../models/gold.model';

@Injectable({
  providedIn: 'root'
})
export class GoldPriceService {
  private readonly apiUrl = '/api/gold';
  private readonly updateIntervalMs = 60000;
  private readonly maxHistoryPoints = 30;

  private currentPriceSubject = new BehaviorSubject<GoldPrice | null>(null);
  public currentPrice$: Observable<GoldPrice | null> = this.currentPriceSubject.asObservable();

  private historicalDataSubject = new BehaviorSubject<PriceData[]>([]);
  public historicalData$: Observable<PriceData[]> = this.historicalDataSubject.asObservable();

  // Current conversion rates (updated from live API)
  private conversionRates: ConversionRates = {
    USD_ZAR: 18.50,
    USD_MZN: 63.75
  };

  // Weight conversion constants (all relative to troy ounce)
  private weightConversions = {
    oz: 1,           // Troy ounce (base unit)
    g: 31.1035,      // 1 troy oz = 31.1035 grams
    kg: 0.0311035    // 1 troy oz = 0.0311035 kg
  };

  constructor(private http: HttpClient) {
    this.startPriceUpdates();
  }

  private startPriceUpdates(): void {
    // Poll live prices on an interval
    timer(0, this.updateIntervalMs)
      .pipe(
        switchMap(() => this.fetchLivePrice()),
        catchError(err => {
          console.error('Failed to fetch live price', err);
          return of(null);
        })
      )
      .subscribe(payload => {
        if (!payload) return;
        this.applyLivePrice(payload);
      });
  }

  private fetchLivePrice(): Observable<LivePricePayload | null> {
    return this.http.get<LivePricePayload>(this.apiUrl).pipe(
      map(payload => {
        if (!payload || !payload.usdPerOz) return null;
        return payload;
      })
    );
  }

  private applyLivePrice(payload: LivePricePayload): void {
    this.conversionRates = {
      USD_ZAR: payload.usdToZar,
      USD_MZN: payload.usdToMzn
    };

    this.updateCurrentPrice(payload.usdPerOz, payload.timestamp);

    const currentData = this.historicalDataSubject.value;
    const newData = [
      ...currentData,
      {
        date: new Date(payload.timestamp),
        price: Math.round(payload.usdPerOz * 100) / 100
      }
    ];

    if (newData.length > this.maxHistoryPoints) {
      newData.shift();
    }

    this.historicalDataSubject.next(newData);
  }

  private updateCurrentPrice(priceUSD: number, timestamp?: string): void {
    const price: GoldPrice = {
      usd: Math.round(priceUSD * 100) / 100,
      zar: Math.round(priceUSD * this.conversionRates.USD_ZAR * 100) / 100,
      mzn: Math.round(priceUSD * this.conversionRates.USD_MZN * 100) / 100,
      timestamp: timestamp ? new Date(timestamp) : new Date()
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

  public getHistoricalData(currency: Currency, weight: Weight = 'oz'): PriceData[] {
    const historicalData = this.historicalDataSubject.value;
    
    // Convert to selected currency and weight (stored as USD per oz)
    const rate =
      currency === 'USD'
        ? 1
        : currency === 'ZAR'
        ? this.conversionRates.USD_ZAR
        : this.conversionRates.USD_MZN;

    return historicalData.map(data => {
      const priceInCurrencyPerOz = data.price * rate;
      const priceInWeight = this.convertPrice(priceInCurrencyPerOz, 'oz', weight);
      return {
        date: data.date,
        price: priceInWeight
      };
    });
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

interface LivePricePayload {
  timestamp: string;
  usdPerOz: number;
  usdToZar: number;
  usdToMzn: number;
}
