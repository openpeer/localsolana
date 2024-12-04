export const priceSourceMap = {
  0: 'coingecko',
  1: 'binance_median',
  2: 'binance_min',
  3: 'binance_max'
} as const;

export type PriceSourceNumber = keyof typeof priceSourceMap;

// Reverse mapping for string to number conversion
export const priceSourceToNumber = Object.entries(priceSourceMap).reduce((acc, [num, str]) => {
  acc[str] = Number(num);
  return acc;
}, {} as Record<string, number>);

console.log('Price source map:', priceSourceMap);
console.log('Price source to number:', priceSourceToNumber);