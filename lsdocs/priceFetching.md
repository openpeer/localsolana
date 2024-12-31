# Price Fetching Documentation

## Overview
The system supports multiple price sources and calculation methods for cryptocurrency prices. Here's how prices are fetched and calculated throughout the application.

## Price Sources

### 1. Binance (Primary Source)
```javascript
const getPriceFromBinance = async (token, fiatCurrency, listType, returnFullArray = false)
```

- Used when `fiatCurrency.allow_binance_rates` is true
- Special handling for SOL token
- Returns median price from an array of 3 prices
- Caches results using pattern: `prices/${token.symbol}/${fiatCurrency.code}/${type}`

### 2. CoinGecko (Fallback Source)
```javascript
const getPriceFromCoingecko = (token, fiatCurrency)
```

- Used as fallback when Binance rates aren't available
- Caches results using pattern: `prices/${token.coingecko_id}/${fiatCurrency.code}`

## Price Calculation

### Main Calculation Function
```javascript
calculateListingPrice(listData, fiatCurrency, token)
```

#### Parameters
- `listData`: List information including margin and price type
- `fiatCurrency`: Currency details including code and decimal places
- `token`: Token information including symbol and IDs

#### Price Types
1. **Fixed Rate** (`margin_type === 0`)
   - Returns exact price specified in list
   - No calculations needed

2. **Floating Rate** (`margin_type === 1`)
   - Fetches base price from source
   - Applies margin calculation
   - Rounds to appropriate decimal places

### Decimal Place Rules
```javascript
switch(fiatCode.toUpperCase()) {
  case 'VES':
  case 'COP':
  case 'KES':
    return 2;
  case 'EUR':
  case 'USD':
    return 4;
  default:
    return 4;
}
```

## List Processing

When processing list data (`processListData` function):
1. Fetches token and currency information
2. Calculates price using `calculateListingPrice`
3. Returns calculated price in list response

## Price Source Constants
```javascript
PRICE_SOURCES = {
  FIXED: 0,
  BINANCE: 1,
  COINGECKO: 2
}
```

## Error Handling
- Failed price calculations return `null`
- Price failures are logged with:
  - Token symbol
  - Fiat currency
  - List type
  - Error reason
  - Stack trace (if applicable)

## Utility Functions

### Price Validation
```javascript
validatePriceRange(price, minPrice, maxPrice)
```
- Validates price is within acceptable range

### Price Formatting
```javascript
formatPrice(price, decimals = 2)
```
- Formats price to specified decimal places

### Price Impact
```javascript
calculatePriceImpact(currentPrice, previousPrice)
```
- Calculates percentage change between prices

## Usage Example

```javascript
// Fetch and calculate price for a list
const price = await calculateListingPrice(
  listData,
  fiatCurrency,
  token
);

if (!price) {
  console.error('Price calculation failed');
  return;
}

// Price is now ready to use in order creation
const createOrderObject = {
  // ... other fields
  price: price,
  // ... other fields
};
```

## Important Notes
1. Always check for `null` price returns
2. Different currencies have different decimal place requirements
3. Cache is used extensively to minimize API calls
4. SOL token has special price calculation logic
5. System supports both fixed and floating rates
6. Price source can be configured per list
