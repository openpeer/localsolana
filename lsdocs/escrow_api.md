I'll analyze the codebase to create a comprehensive guide about how the escrow system works.

Search files...


Let me create a comprehensive guide about how the escrow system works in this repository.

# Solana Escrow System Documentation

## Overview

This repository implements a secure escrow system on Solana that supports both SOL and SPL tokens. The system allows for safe peer-to-peer trading with built-in dispute resolution and automatic escrow capabilities.

## Core Components

### 1. Escrow Accounts
- **Escrow State Account**: A PDA (Program Derived Address) that stores the escrow's global state including:
  - Seller's public key
  - Fee basis points
  - Arbitrator's public key
  - Fee recipient's public key
  - Initialization status

- **Escrow Account**: A PDA specific to each order that manages the transaction details

### 2. Types of Escrow

#### SOL Escrow
1. `createEscrowSol`: Created by seller
2. `createEscrowSolBuyer`: Created by buyer
- Handles native SOL transactions
- Uses system program for transfers

#### Token Escrow
1. `createEscrowToken`: Created by seller
2. `createEscrowTokenBuyer`: Created by buyer
- Handles SPL token transactions
- Requires associated token accounts
- Supports any SPL token

### 3. Key Features

#### Automatic Escrow
- Configurable via `automatic_escrow` parameter
- Allows instant release of funds when conditions are met
- Verified through `InstantEscrowVerifier`

#### Dispute Resolution
- Built-in arbitration system
- Arbitrator can resolve disputes between buyer and seller
- Supports partial refunds and split decisions

#### Waiting Periods
- Configurable seller waiting time
- Prevents premature cancellations
- Ensures fair trading conditions

## Transaction Flow

### 1. Creating an Escrow

```plaintext
Seller/Buyer -> Create Escrow -> Deposit Funds -> Escrow Account Created
```

Required parameters:
- `order_id`: Unique identifier for the transaction
- `amount`: Transaction amount
- `seller_waiting_time`: Lockup period
- `automatic_escrow`: Enable/disable automatic release
- `token` (for SPL tokens): Token mint address

### 2. Depositing Funds

Two methods available:
1. `depositToEscrow`: Direct deposit to escrow account
2. `depositToEscrowState`: Deposit to escrow state account

### 3. Releasing Funds

Conditions for release:
- Order marked as paid
- No active disputes
- Waiting period elapsed (if applicable)
- Proper authorization (seller/buyer/arbitrator)

## Security Features

1. **Account Validation**
   - PDA verification
   - Signer checks
   - Balance verification

2. **Error Handling**
   - Invalid amounts
   - Insufficient funds
   - Unauthorized access
   - Invalid timing

3. **Access Control**
   - Seller permissions
   - Buyer permissions
   - Arbitrator permissions

## Error Codes

Common error types:
- `6000`: Invalid amount
- `6001`: Invalid seller waiting time
- `6002`: Escrow not found
- `6008`: Insufficient funds
- `6013`: Cannot release funds yet
- `6017`: Order is disputed

## Best Practices

1. **Creating Escrows**
   - Always verify account addresses
   - Set appropriate waiting times
   - Consider automatic escrow for trusted parties

2. **Managing Disputes**
   - Document all communications
   - Wait for arbitrator decisions
   - Follow proper dispute procedures

3. **Releasing Funds**
   - Verify all conditions are met
   - Check for active disputes
   - Ensure proper authorization

## Integration Points

1. **Database Integration**
   - Orders table
   - Transactions table
   - User records
   - Token information

2. **External Services**
   - Solana RPC connection
   - Token program integration
   - Associated token program

3. **Monitoring**
   - Balance verification
   - Transaction status tracking
   - Instant escrow verification

This escrow system provides a robust foundation for peer-to-peer trading on Solana, with comprehensive security features and flexible configuration options. The system is designed to handle both simple transfers and complex dispute scenarios while maintaining security and usability.
