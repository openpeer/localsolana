export interface CachePrice {
  value: number | number[];
  ttl: number;
  timeLeft: number;
  age: number;
}

export interface CacheResponse {
  status: number;
  code: number;
  message: string;
  data: {
    [key: string]: CachePrice;
  };
  env: string;
}

export type CacheSource = 'coingecko' | 'binance' | 'synthetic';

export interface ParsedCacheEntry {
  token: string;
  currency: string;
  type?: 'BUY' | 'SELL';
  value: number | [number, number, number];
  formattedValue: string;
  timeLeft: number;
  source: CacheSource;
}