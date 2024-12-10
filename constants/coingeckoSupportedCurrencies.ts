export const COINGECKO_SUPPORTED_CURRENCIES = [
  "btc", "eth", "ltc", "bch", "bnb", "eos", "xrp", "xlm", "link", "dot", "yfi",
  "usd", "aed", "ars", "aud", "bdt", "bhd", "bmd", "brl", "cad", "chf", "clp",
  "cny", "czk", "dkk", "eur", "gbp", "gel", "hkd", "huf", "idr", "ils", "inr",
  "jpy", "krw", "kwd", "lkr", "mmk", "mxn", "myr", "ngn", "nok", "nzd", "php",
  "pkr", "pln", "rub", "sar", "sek", "sgd", "thb", "try", "twd", "uah", "vef",
  "vnd", "zar", "xdr", "xag", "xau", "bits", "sats"
] as const;

export const BINANCE_SUPPORTED_CURRENCIES = [
  "COP", "VES", "PEN", "KES", "MAD", "EGP"
] as const;

export type CoingeckoSupportedCurrency = typeof COINGECKO_SUPPORTED_CURRENCIES[number];
export type BinanceSupportedCurrency = typeof BINANCE_SUPPORTED_CURRENCIES[number];

export const isCoinGeckoSupported = (currency: string): boolean => 
  COINGECKO_SUPPORTED_CURRENCIES.includes(currency.toLowerCase() as CoingeckoSupportedCurrency);

export const isBinanceSupported = (currency: string): boolean => 
  BINANCE_SUPPORTED_CURRENCIES.includes(currency.toUpperCase() as BinanceSupportedCurrency);