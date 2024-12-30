# Front End Testing

### Profile Management
- View profile details
- Update profile information (name, email, etc)
- View trade history
- View online/offline status
- View number of completed trades
- Configure trade availability settings

### List Management (SellList - Selling Crypto)
1. Create SellList:
   - Set token type and amount
   - Set fiat currency
   - Set margin type (fixed/percentage)
   - Set price/margin
   - Set min/max limits
   - Configure payment methods with bank details
   - Set terms
   - Set deposit time limit
   - Set payment time limit
   - Set verification requirements
   - Choose escrow type (manual/instant)
   - Set price source (coingecko/binance)
   - Enable/disable automatic approval

2. Edit SellList:
   - Modify all creation parameters
   - Update payment methods
   - Change status (active/inactive/cancelled)

### List Management (BuyList - Buying Crypto)
1. Create BuyList:
   - Set token type and amount
   - Set fiat currency
   - Set margin type (fixed/percentage)
   - Set price/margin
   - Set min/max limits
   - Select accepted banks
   - Set terms
   - Set deposit time limit
   - Set payment time limit
   - Set verification requirements
   - Set price source (coingecko/binance)
   - Enable/disable automatic approval

2. Edit BuyList:
   - Modify all creation parameters
   - Update accepted banks
   - Change status (active/inactive/cancelled)

### Trading Operations
1. Buy Crypto (from SellList):
   - View available listings
   - Filter listings by:
     - Amount
     - Currency
     - Payment method
     - Token type
   - Select payment method
   - Enter trade amount
   - Place buy order
   - Chat with seller
   - Confirm payment sent
   - View order status

2. Sell Crypto (from BuyList):
   - View available listings
   - Filter listings by:
     - Amount
     - Currency
     - Payment method
     - Token type
   - Select bank for payment
   - Enter trade amount
   - Place sell order
   - Chat with buyer
   - Confirm payment received
   - View order status

### Escrow Management
1. Manual Escrow:
   - Deploy escrow contract
   - Deposit funds
   - View escrow balance
   - Release funds
   - Cancel escrow
   - Withdraw funds

2. Instant Escrow:
   - Deploy escrow contract
   - Deposit funds
   - View escrow balance
   - Automatic fund release
   - Withdraw funds

### Quick Trading
1. Quick Buy:
   - Enter desired crypto amount
   - Select currency
   - View available options
   - Select from available listings
   - Place order

2. Quick Sell:
   - Enter crypto amount to sell
   - Select currency to receive
   - View available options
   - Select from available listings
   - Place order

### Payment Methods Management
1. Bank Account Management:
   - Add bank accounts
   - View bank accounts
   - Edit bank account details
   - Delete bank accounts

2. Payment Method Configuration:
   - Add payment methods
   - View payment methods
   - Edit payment method details
   - Delete payment methods

### List Viewing & Filtering
- View all active listings
- Filter by:
  - Buy/Sell type
  - Token
  - Currency
  - Payment method
  - Amount range
- Sort listings
- Hide low amount listings
- View seller/buyer profiles
- View trade counts and ratings
