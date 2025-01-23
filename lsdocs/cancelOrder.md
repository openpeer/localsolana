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

## Seller Cancellation Rules

Sellers face specific restrictions on when they can cancel orders. These rules are implemented across multiple components:

### 1. Time-based Restrictions

Located in `components/Buy/CancelOrderButton/BlockchainCancelButton.tsx`:
```typescript
const sellerCanCancelAfter = ((escrowData?.sellerCanCancelAfter ?? new BN(0)) as BN).toNumber();
const sellerCanCancelAfterSeconds = parseInt(sellerCanCancelAfter.toString(), 10);
const now = Date.now() / 1000;
const sellerCantCancel = isSeller && (sellerCanCancelAfterSeconds <= 1 || sellerCanCancelAfterSeconds > now);
```

### 2. Payment Status Restrictions

Located in `components/Buy/Payment.tsx`:
```typescript
const timeLimitForPayment =
  status === 'escrowed' && order.escrow && sellerCanCancelAfter && sellerCanCancelAfterSeconds > 0
    ? sellerCanCancelAfterSeconds * 1000
    : 0;
const paymentTimeLeft = timeLimitForPayment > 0 ? timeLimitForPayment - new Date().getTime() : 0;
```

### 3. Cancellation Rules Summary

1. **Time Window Restrictions**:
   - Sellers cannot cancel immediately after escrow
   - Must wait for `sellerCanCancelAfter` seconds to pass
   - Time window starts when order is marked as paid

2. **Payment Status Restrictions**:
   - Cannot cancel if order is marked as paid AND within payment time limit
   - Payment time limit is set during escrow creation
   - Displayed to users in UI via countdown timer

3. **Implementation Details**:
   - Time checks are done both client-side and on-chain
   - Uses blockchain timestamp for validation
   - Enforced in `BlockchainCancelButton` component
   - Additional validation in `useLocalSolana.ts`

4. **UI Feedback**:
   - Button is disabled when seller cannot cancel
   - Shows remaining time before cancellation is possible
   - Displays "You cannot cancel" message during restricted period

## Blockchain Implementation

The core blockchain cancellation logic is implemented in `hooks/transactions/useLocalSolana.ts`. This hook provides the interface between our frontend and the Solana program.

### Key Implementation Details

```typescript
const cancelOrderOnChain = async (
  orderId: string,
  cancelledBy: PublicKey,
  seller: PublicKey,
  token: PublicKey
) => {
  // ... initialization checks ...
  
  let escrowPDA = await getEscrowPDA(orderId);
  let escrowStatePDA = await getEscrowStatePDA(seller.toBase58());

  // Set up token accounts if needed
  let escrowTokenAccount =
    token == PublicKey.default
      ? null
      : await getAssociatedTokenAddress(token, escrowPDA!, true);
  let escrowStateTokenAccount =
    token == PublicKey.default
      ? null
      : await getAssociatedTokenAddress(token, escrowStatePDA!, true);

  // Create the cancellation transaction
  const tx = await program.methods
    .buyerCancel(orderId)
    .accounts({
      seller: seller, // Always use actual seller address for correct fund routing
      feePayer: feePayer,
      escrowStateTokenAccount: escrowStateTokenAccount,
      escrowTokenAccount: escrowTokenAccount,
    })
    .transaction();
  return tx;
};
```

### Program Derived Addresses (PDAs)

1. **Escrow PDA**:
   ```typescript
   const getEscrowPDA = (orderId: string) => {
     const [escrowPda_, _escrowStateBump] = PublicKey.findProgramAddressSync(
       [Buffer.from("escrow"), Buffer.from(orderId)],
       program.programId
     );
     return escrowPda_;
   };
   ```
   - Unique address for each order's escrow account
   - Derived from order ID and program ID
   - Holds escrowed funds and order state

2. **Escrow State PDA**:
   ```typescript
   const getEscrowStatePDA = (address: string) => {
     const [escrowStatePda_, _escrowStateBump] = PublicKey.findProgramAddressSync(
       [Buffer.from("escrow_state"), new PublicKey(address).toBuffer()],
       program.programId
     );
     return escrowStatePda_;
   };
   ```
   - Tracks seller's escrow state
   - Derived from seller's address
   - Used for token account management

### Error Handling

1. **Initialization Checks**:
   ```typescript
   if (!program || !provider || !feeRecepient || !feePayer || !arbitrator) {
     throw new Error("Program or provider is not initialized");
   }
   ```

2. **Transaction Validation** (in `useGaslessEscrowCancel.ts`):
   ```typescript
   const cancelOrder = async () => {
     try {
       setIsLoading(true);
       const tx = await cancelOrderOnChain(/*...*/);
       const finalTx = await sendTransactionWithShyft(tx, true, orderID);
       // ... success handling
     } catch (error) {
       console.error('error', error);
       setIsLoading(false);
       setIsSuccess(false);
       return false;
     }
   };
   ```

3. **UI Error Feedback**:
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

### Important Notes

1. **Program Constraints**:
   - The Solana program only provides a `buyer_cancel` instruction
   - No separate `seller_cancel` instruction exists
   - The transaction always requires the correct seller address for proper fund routing

2. **Fund Routing**:
   - The `seller` parameter in the transaction determines where funds are returned
   - Must always be the original seller's address, regardless of who initiates cancellation
   - This ensures escrowed funds return to their rightful owner

3. **Token Handling**:
   - Supports both native SOL and SPL tokens
   - For SPL tokens, additional token accounts are set up
   - Uses PDAs (Program Derived Addresses) for escrow accounts

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