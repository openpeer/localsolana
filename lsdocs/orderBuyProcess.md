# Order Buy Process

## Overview
The buying process has been simplified into a single step that combines amount input and payment method selection.

### Components Structure

#### 1. BuyPage (`pages/buy/[id].tsx`)
- Entry point for the buying process
- Manages the overall order state
- Handles list data fetching and error states
- Controls mobile/desktop layout
- Key state:
  ```typescript
  const [order, setOrder] = useState<UIOrder>({} as UIOrder);
  ```

#### 2. Amount Component (`components/Buy/Amount.tsx`)
- Main form component
- Handles both amount input and payment method selection
- Includes OrderPaymentMethod as a sub-component
- Manages validation and order creation

#### 3. OrderPaymentMethod (`components/Buy/OrderPaymentMethod.tsx`)
- Sub-component of Amount
- Handles payment method selection
- Adapts UI based on list type (Buy/Sell)
- Manages payment details form when needed

## Data Flow
1. User enters amount
2. User selects payment method
3. System validates inputs
4. Order is created via API
5. User is redirected to order details

## Validation
- Amount within limits
- Payment method selected
- User verification if required
- Balance check for instant escrow

