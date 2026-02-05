export type Currency = 'USD' | 'ZAR' | 'MZN';
export type Weight = 'oz' | 'g' | 'kg';

export interface GoldPrice {
  usd: number;
  zar: number;
  mzn: number;
  timestamp: Date;
}

export interface PriceData {
  date: Date;
  price: number;
}

export interface ConversionRates {
  USD_ZAR: number;
  USD_MZN: number;
}
