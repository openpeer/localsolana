# Escrow Type Implementation

## Database Schema
- Stored in the `lists` table as an integer column
- Default value is 0
- Defined in both SQL structure and migrations
```sql
escrow_type integer DEFAULT 0
```

## Values and Meanings
There appear to be two possible values:
- `0`: Manual escrow (default)
- `1`: Instant/automatic escrow

This is evidenced by the code that converts the numeric value to a string:
```javascript
escrow_type: element.escrow_type == 0 ? "manual" : "instant"
```

## Usage Contexts

### 1. Automatic Balance Fetching
- The cron job `automatic_balance_fetch_cron.js` specifically looks for listings with `escrow_type: 1`
- Used to monitor balances for instant escrow listings
```javascript
where: { escrow_type: 1 }
```

### 2. List Processing
- Included in list response objects
- Passed through without transformation in most list processing functions
- Used as a filter condition in some queries

### 3. Frontend Display
- The type is exposed in API responses
- Formatted as either "manual" or "instant" for frontend display

## Implementation Details
- Used to determine whether automatic balance checking should occur
- Affects how escrow transactions are handled
- Appears to be part of a system that allows both manual and automatic escrow handling

## Related Features
- Connected to automatic balance fetching for Solana tokens (SOL, USDC, USDT)
- Influences how transactions are processed and monitored
- Part of the larger escrow management system

## Notes
- The system appears designed to support two distinct escrow workflows
- Manual (0) appears to be the default behavior
- Automatic (1) enables additional automated features like balance monitoring
