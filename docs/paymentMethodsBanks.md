Here's a comprehensive documentation of how banks and payment methods work in the system:

# Banks & Payment Methods Documentation

## Overview

The system handles payment methods differently depending on whether a list is a "BuyList" or "SellList". This distinction is important for understanding how payments are processed and stored.

## Data Models

### Banks
```sql
CREATE TABLE banks (
    id bigint PRIMARY KEY,
    name varchar NOT NULL,
    account_info_schema json,
    color varchar,
    image varchar,
    created_at timestamp,
    updated_at timestamp
);
```

Banks represent financial institutions and contain:
- Basic info (name, color, image)
- `account_info_schema`: JSON schema defining required fields for bank accounts
- Association with fiat currencies through `banks_fiat_currencies` join table

### Payment Methods
```sql
CREATE TABLE payment_methods (
    id bigint PRIMARY KEY,
    user_id bigint NOT NULL,
    bank_id bigint,
    values json,
    type varchar,
    created_at timestamp,
    updated_at timestamp
);
```

Payment methods are user-specific implementations of bank payment options:
- Linked to both a user and a bank
- `values`: Actual account details matching bank's schema
- `type`: Either 'ListPaymentMethod' or 'OrderPaymentMethod'

## List Types & Payment Handling

### BuyList
In a BuyList, the buyer is selling crypto and wants to receive fiat payment.

1. **Storage**:
   - Uses `lists_banks` table to store accepted banks
   - Direct association between list and banks
   ```sql
   CREATE TABLE lists_banks (
       list_id numeric,
       bank_id numeric
   );
   ```

2. **Creation Process**:
```javascript
// For BuyLists
if (type === "BuyList" && payment_methods.length > 0) {
    await handleBuyListPaymentMethods(list.dataValues.id, payment_methods);
}
```

3. **Data Structure**:
   - Payment methods in API response are simplified bank objects
   - No user-specific account details needed since buyer chooses from available banks

### SellList
In a SellList, the seller is selling crypto and will receive fiat payment.

1. **Storage**:
   - Uses `lists_payment_methods` table
   - Links to specific payment method instances
   ```sql
   CREATE TABLE lists_payment_methods (
       list_id numeric,
       payment_method_id numeric
   );
   ```

2. **Creation Process**:
```javascript
// For SellLists
if (type === "SellList" && payment_methods.length > 0) {
    await handleSellListPaymentMethods(list_id, user.id, payment_methods);
}
```

3. **Data Structure**:
   - Payment methods include full bank details and seller's account information
   - Each payment method is user-specific with actual account details

## API Response Structure

Lists include payment information in their response:

```javascript
{
    id: number,
    type: "BuyList" | "SellList",
    // ... other list fields ...
    banks: Bank[],          // Available for both types
    payment_methods: PaymentMethod[]  // Different structure based on type
}
```

Where:
- For BuyLists: `payment_methods` = `banks`
- For SellLists: `payment_methods` = user's payment method instances

## Processing Flow

### List Creation
1. List is created with basic information
2. Based on type:
   - BuyList: Banks are linked directly through `lists_banks`
   - SellList: Payment methods are created/updated and linked through `lists_payment_methods`

### List Processing
```javascript
const paymentMethods = list.dataValues.type === "BuyList" ? 
    banksData : 
    await fetchPaymentMethods(list.dataValues.id);
```

### Order Creation
When creating an order:
1. Payment method is selected from list's available options
2. New OrderPaymentMethod is created with specific account details
3. Order is linked to this payment method

## Important Considerations

1. **Security**:
   - Account details (`values`) are only exposed when necessary
   - Payment methods are always user-specific

2. **Validation**:
   - Banks must be valid for the list's fiat currency
   - Account details must match bank's schema

3. **Maintenance**:
   - Payment methods can be updated without affecting historical orders
   - Banks can be associated with multiple fiat currencies

This architecture allows for flexible payment handling while maintaining clear separation between institutional payment options (banks) and user-specific payment implementations (payment methods).

## Payment Flow Details

### BuyList Flow (Buyer Creates List)
When someone creates a BuyList, they are saying "I want to **buy** crypto and I will **pay** via these banks/payment methods":

1. The BuyList creator (buyer) specifies which banks they will accept payment through
2. These are stored simply as bank references in `lists_banks`
3. When someone takes this order (seller), they must have a payment method matching one of these banks
4. The seller then provides their specific account details for that bank when taking the order

### SellList Flow (Seller Creates List)
When someone creates a SellList, they are saying "I want to **sell** crypto and I will **receive** payment via these methods":

1. The SellList creator (seller) specifies their actual payment methods (bank account details)
2. These are stored as full payment methods in `payment_methods` and linked via `lists_payment_methods`
3. When someone takes this order (buyer), they select one of the seller's pre-specified payment methods
4. The buyer then sends payment to those specific account details

The key difference is:
- BuyLists specify *acceptable banks* (because the buyer will receive payment)
- SellLists specify *actual payment methods* (because the seller will receive payment)

This is reflected in the list processing code:
```javascript
// For BuyLists, use banks as payment methods
const paymentMethods = list.dataValues.type === "BuyList" ? 
    banksData :  // Just the bank information
    await fetchPaymentMethods(list.dataValues.id);  // Full payment method details
```

So both types deal with payment methods, but they handle them differently based on whether the list creator is the one who will be receiving or sending the payment.
