# LocalSolana List Types & Order Flow Documentation

## Understanding List Types

### BuyList (List 95 Example)
When a user creates a "BuyList", they are offering to **BUY** cryptocurrency (in this case SOL) using fiat currency.

Let's break down List 95:
- **List Owner** (seller_id: 2): Is offering to **BUY** SOL
- **Currency**: EUR (fiat_currency_id: 18)
- **Amount Range**: 
  - Minimum: 20 EUR
  - Maximum: 500 EUR
- **Available Amount**: 5 SOL total to buy
- **Price**: 0.95 of market price (5% below market)
- **Type**: "BuyList" - means "I want to buy SOL"

#### BuyList Flow
1. List Owner (ID 2) creates a BuyList saying "I want to buy SOL for EUR"
2. You (ID 1) see this list and think "I want to sell my SOL for EUR"
3. When you create an order on this BuyList:
   - You are the **SELLER** (providing SOL)
   - List Owner is the **BUYER** (providing EUR)

### SellList (Opposite Case)
A "SellList" is when someone is offering to **SELL** cryptocurrency for fiat currency.

#### SellList Flow
1. List Owner creates a SellList saying "I want to sell SOL for EUR"
2. Another user sees this list and thinks "I want to buy SOL with EUR"
3. When someone creates an order on a SellList:
   - They are the **BUYER** (providing EUR)
   - List Owner is the **SELLER** (providing SOL)

## Key Points
- The list type ("BuyList" or "SellList") indicates what the **list creator wants to do**
- When you interact with a list, you're taking the opposite role:
  - BuyList → You're selling to them
  - SellList → You're buying from them

## Current Scenario
In your case with List 95:
1. List Owner (ID 2) created a BuyList saying "I want to buy up to 5 SOL, paying in EUR"
2. You (ID 1) are creating an order to sell your SOL to them
3. Therefore:
   - You should be recorded as the **seller** (seller_id: 1)
   - List Owner should be recorded as the **buyer** (buyer_id: 2)

This is why we identified the ID swap issue in the backend code.
