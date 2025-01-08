# Requirements for Releasing Funds in the Escrow System

## Overview
The escrow system is designed to facilitate secure transactions between buyers and sellers. The release of funds is a critical operation that requires specific conditions to be met and proper transaction construction.

## Prerequisites

### Order Status Requirements
1. Order must exist in the system
2. Order must be marked as paid
3. Order must not be in a disputed state
4. User must be authorized (either buyer, seller, or arbitrator)

### Account Requirements
1. `escrowState` - PDA derived from:
   - Constant seed: `escrow_state`
   - Seller's public key
2. `escrow` - PDA derived from:
   - Constant seed: `escrow`
   - Order ID

### Transaction Requirements
1. Valid recent blockhash
2. Properly signed transaction
3. Correct instruction data format
4. All required accounts must be included

## Required Fields for Release Funds Transaction

### Core Parameters
- `order_id`: String (required)
  - Must be a valid order ID from the database
  - Must match an existing order in the system

### Required Accounts
1. `escrowState` (writable):
   - PDA account containing escrow state information
   - Must be derived using correct seeds
   
2. `escrow` (writable):
   - PDA account containing order-specific escrow information
   - Must be derived using correct seeds

3. `seller` (writable):
   - Must match the seller's address from the order
   - Must be a signer if seller is initiating the release

4. `feePayer` (writable):
   - Must be a signer
   - Responsible for transaction fees

5. `buyer`:
   - Must match the buyer's address from the order

6. `systemProgram`:
   - Fixed address: `11111111111111111111111111111111`

7. `partner` (optional):
   - Partner account if applicable

### Token-Specific Requirements
For token transactions (non-SOL):
1. `tokenProgram`: Required for token operations
   - Address: `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`
2. `mintAccount`: Token mint address
3. `escrowTokenAccount`: Escrow's token account (writable)
4. `escrowStateTokenAccount`: Escrow state's token account (writable)

## Process Flow

1. **Authorization Check**
   ```javascript
   - User must be either:
     - Seller of the order
     - Buyer of the order
     - Authorized arbitrator (if dispute resolution)
   ```

2. **Order Validation**
   ```javascript
   - Order must exist
   - Order status must be appropriate for release
   - Order must not be disputed
   ```

3. **Transaction Processing**
   ```javascript
   - Transaction must be properly constructed
   - All required accounts must be included
   - Transaction must be signed by appropriate parties
   - Recent blockhash must be included
   ```

4. **Post-Release Actions**
   ```javascript
   - Transaction hash is stored in transactions table
   - Order status is updated
   - Notifications are sent to relevant parties
   ```

## Error Codes and Handling

### Common Error Codes
1. `6013`: "Cannot release funds as order is not marked as paid"
2. `6017`: "This order is disputed. You can't release funds."
3. `6018`: "You're not a valid arbitrator."
4. `6019`: "You're not a seller or buyer for this order."

### Transaction-Related Errors
1. `BlockhashNotFound`: Invalid or expired blockhash
2. `InvalidAccountData`: Incorrect account structure or data
3. `AccountNotFound`: Required account not found

## Best Practices

1. **Transaction Construction**
   - Always use fresh blockhash
   - Include all required accounts
   - Properly derive PDAs
   - Set appropriate account permissions (writable/signer)

2. **Security**
   - Verify user authorization
   - Validate order state
   - Check account ownership
   - Verify transaction signatures

3. **Error Handling**
   - Handle all potential error cases
   - Provide clear error messages
   - Log transaction failures
   - Implement proper rollback mechanisms

4. **Monitoring**
   - Track transaction status
   - Monitor account balances
   - Log all release attempts
   - Implement notification system

## Integration Example

```javascript
// Example structure for release funds transaction
{
  "order_id": "string",
  "accounts": {
    "escrowState": "derived_pda_address",
    "escrow": "derived_pda_address",
    "seller": "seller_public_key",
    "feePayer": "fee_payer_public_key",
    "buyer": "buyer_public_key",
    "systemProgram": "11111111111111111111111111111111"
  },
  "recentBlockhash": "recent_blockhash_value"
}
```