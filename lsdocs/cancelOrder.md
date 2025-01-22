# Order Cancellation Process

This document outlines the order cancellation process in the LocalSolana platform, including both simple cancellations and blockchain-based cancellations.

## Overview

The order cancellation process can take two paths:
1. Simple Cancellation - For orders that haven't been escrowed yet
2. Blockchain Cancellation - For orders that have funds in escrow

## Components Involved

- `CancelOrderButton` - Main component that handles order cancellation
- `BlockchainCancelButton` - Handles blockchain-based cancellations
- `CancelReasons` - Component for collecting cancellation reasons
- `Cancelled` - Component displayed after successful cancellation

## Cancellation Types

### Simple Cancellation
Used when:
- Order status is 'created'
- No escrow data exists (`escrowData` is null)

```typescript
const simpleCancel: boolean = (!escrowData || escrowData==null) && order.status === 'created';
```

### Blockchain Cancellation
Required when:
- Order has funds in escrow
- Requires on-chain transaction
- Different rules apply for buyers and sellers

## Handling of Escrowed Funds

When an order with escrowed funds is cancelled, the following process occurs:

1. **Fund Return Logic**:
   - Escrowed funds are automatically returned to their original source
   - If buyer cancels: funds return to the seller
   - If seller cancels: funds return to the seller (as original depositor)

2. **Blockchain Transaction**:
   - Cancellation creates a blockchain transaction via `cancelOrderOnChain`
   - Transaction is processed through Shyft (gasless transaction service)
   - Transaction includes:
     ```typescript
     const tx = await cancelOrderOnChain(
       orderID,
       new PublicKey(address),
       new PublicKey(seller),
       new PublicKey(token.address)
     );
     ```

3. **Validation Checks**:
   - System verifies cancellation eligibility:
     - Order must not be already cancelled/closed
     - User must be buyer or seller
     - Seller-specific time restrictions apply
     - Order must not be in dispute

4. **State Updates**:
   After successful cancellation:
   - Blockchain transaction releases escrowed funds
   - Order status updates to 'cancelled' in database
   - UI updates to reflect cancellation
   - Transaction hash is stored for reference

## Cancellation Process

### 1. Initiating Cancellation

The process starts in `CancelOrderButton.tsx`:

```typescript
const onCancelOrder = () => {
    if (cancelIsNotAvailable) return;
    
    if (!cancelConfirmed) {
        setModalOpen(true);
        return;
    }
    
    if (simpleCancel) {
        cancelOrder();
    }
};
```

### 2. Cancellation Reasons

Users must provide a reason for cancellation from these options:
```typescript
export const cancelReasons = {
    tookTooLong: 'Trade took too long to complete',
    hasntCompletedNextSteps: "Other trader hasn't completed next steps",
    dontWantToTrade: "Don't want to trade with other trader",
    dontUnderstand: "Don't understand OpenPeer",
    other: 'Other'
};
```

### 3. API Endpoint

The cancellation is processed through the following endpoint:
```typescript
POST /api/orders/${id}/cancel
Headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ${authToken}'
}
Body: {
    cancellation: CancellationReason,
    other_reason?: string
}
```

### 4. Blockchain Cancellation Process

For orders with escrowed funds:

1. **Seller Restrictions**:
```typescript
const sellerCanCancelAfterSeconds = parseInt(sellerCanCancelAfter.toString(), 10);
const now = Date.now() / 1000;
const sellerCantCancel = isSeller && (sellerCanCancelAfterSeconds <= 1 || sellerCanCancelAfterSeconds > now);
```

2. **Transaction Creation**:
```typescript
const cancelOrder = async () => {
    const tx = await cancelOrderOnChain(
        orderID,
        new PublicKey(address),
        new PublicKey(seller),
        new PublicKey(token.address)
    );
    const finalTx = await sendTransactionWithShyft(tx, true, orderID);
};
```

## State Changes

After successful cancellation:
1. Order status is updated to 'cancelled'
2. If blockchain cancellation, escrowed funds are returned
3. UI updates to show cancellation status
4. User is redirected or page is reloaded

## Error Handling

The system handles various error cases:
- Invalid cancellation attempts
- Transaction failures
- API errors
- Network issues

Error feedback is provided through toast notifications:
```typescript
toast.error('Error cancelling the order', {
    theme: 'dark',
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: false,
    progress: undefined
});
```

## Restrictions

Orders cannot be cancelled when:
1. Status is already 'cancelled' or 'closed'
2. User is neither buyer nor seller
3. For sellers, when within the cancellation time window
4. Order is in dispute

## UI Components

### Cancel Button States
- Normal: "Cancel Order"
- Processing: "Processing..."
- Completed: "Done"
- Restricted: "You cannot cancel"

### Confirmation Modal
Displays:
1. Cancellation confirmation message
2. Reason selection
3. Optional additional comments
4. Action buttons (Confirm/Close)

## Post-Cancellation

After successful cancellation:
1. Order status updates
2. Cancellation timestamp is recorded
3. User sees cancellation confirmation
4. Navigation options are provided
5. If blockchain cancellation, transaction hash is stored 