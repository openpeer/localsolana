# Mark As Paid

1. **File Structure**:
```
components/Buy/MarkAsPaidButton.tsx                        # UI Component
hooks/transactions/markAsPaid/useGaslessMarkAsPaid.ts      # Main hook
hooks/transactions/useLocalSolana.ts                       # Solana integration
hooks/transactions/useShyft.ts                             # Shyft SDK integration
idl/local_solana_migrate.ts                               # Contract interface
```

2. **Complete Flow**:
```
MarkAsPaidButton.tsx -> useGaslessMarkAsPaid.ts -> useLocalSolana.ts -> useShyft.ts -> API -> Blockchain
```

3. **Component Level** (`MarkAsPaidButton.tsx`):
   - Takes `order` and `updateOrder` props
   - Uses `useGaslessMarkAsPaid` hook
   - Handles transaction feedback and order updates
   - Updates trade status after successful transaction

4. **Transaction Hook** (`useGaslessMarkAsPaid.ts`):
   - Takes `orderID`, `buyer`, and `seller` parameters
   - Creates transaction using `markAsPaid` from `useLocalSolana`
   - Handles transaction signing and submission

5. **Solana Integration** (`useLocalSolana.ts`):
   ```typescript
   const markAsPaid = async (orderId: string, buyer: PublicKey, seller: PublicKey) => {
     const escrowPDA = await getEscrowPDA(orderId);
     return program.methods
       .markAsPaid(orderId)
       .accounts({
         buyer,
         seller,
         escrow: escrowPDA,
         systemProgram: web3.SystemProgram.programId
       })
       .transaction();
   }
   ```

6. **Contract Interface** (from IDL):
   ```typescript
   markAsPaid: {
     accounts: [
       { name: "escrow", writable: true, pda: true },
       { name: "buyer", writable: true, signer: true },
       { name: "seller", writable: false },
       { name: "systemProgram", address: "11111111111111111111111111111111" }
     ],
     args: [
       { name: "orderId", type: "string" }
     ]
   }
   ```

7. **Error Handling**:
   - Contract level errors:
     - `cannotReleaseFundsYet`: "Cannot release funds as order is not marked as paid"
     - `disputed`: "This order is disputed. You can't release funds."
     - `invalidAuthority`: "You're not a seller or buyer for this order."
   - Frontend validation:
     - Wallet connection check
     - Transaction simulation
     - Signature verification

8. **State Updates**:
   - Order status updates after successful transaction
   - UI feedback through transaction status
   - Trade record updates in backend

9. **Security Considerations**:
   - Only buyer can mark as paid (enforced by contract)
   - Requires valid signatures
   - Validates escrow state
   - Checks for disputes

10. **Transaction Construction Details**:

   a. **Transaction Initiation** (`MarkAsPaidButton.tsx`):
   ```typescript
   const onPaymentDone = async() => {
     if (!isConnected) return;
     await marksAsPaid?.();
   };
   ```

   b. **Transaction Hook Layer** (`useGaslessMarkAsPaid.ts`):
   ```typescript
   const marksAsPaid = async () => {
     try {
       setIsLoading(true);
       // Create transaction
       const tx = await markAsPaid(orderID, new PublicKey(buyer), new PublicKey(seller));
       // Send through Shyft
       const finalTx = await sendTransactionWithShyft(tx, true, orderID);
       // Handle response
       if(finalTx) {
         setIsSuccess(true);
         updateData({hash: finalTx});
       }
     } catch (error) {
       console.error('error', error);
       setIsSuccess(false);
     } finally {
       setIsLoading(false);
     }
   };
   ```

   c. **Solana Transaction Creation** (`useLocalSolana.ts`):
   ```typescript
   const markAsPaid = async (orderId: string, buyer: PublicKey, seller: PublicKey) => {
     if (!program || !provider) {
       throw new Error("Program or provider is not initialized");
     }
     
     // Get the escrow PDA for this order
     const escrowPDA = await getEscrowPDA(orderId);
     
     // Create the transaction
     const tx = await program.methods
       .markAsPaid(orderId)
       .accounts({
         buyer: buyer,         // Signer (must be buyer)
         seller: seller,       // Read-only
         escrow: escrowPDA,    // PDA, writable
         systemProgram: web3.SystemProgram.programId
       })
       .transaction();
     
     return tx;
   };
   ```

   d. **PDA Derivation**:
   ```typescript
   const getEscrowPDA = (orderId: string) => {
     const [escrowPda, _bump] = PublicKey.findProgramAddressSync(
       [Buffer.from("escrow"), Buffer.from(orderId)],
       program.programId
     );
     return escrowPda;
   };
   ```

   e. **Transaction Processing** (`useShyft.ts`):
   - Adds recent blockhash
   - Sets fee payer
   - Handles local signing when required
   - Simulates transaction
   - Sends to Shyft API for processing

11. **Transaction Requirements**:
    - Buyer must be the signer
    - Valid escrow PDA must exist
    - Order must be in valid state
    - Escrow account must be writable
    - System program must be included
    - All public keys must be valid
    - Transaction must include valid recent blockhash
    - Fee payer must be set correctly

12. **State Transitions**:
    - Pre-state: Order status "CREATED" or "PENDING"
    - Post-state: Order status "PAID"
    - Escrow account state updated
    - Trade record updated in backend

13. **Transaction Relay Process**:

    a. **Prerequisites**:
    ```typescript
    // Environment Requirements
    - NEXT_PUBLIC_SHYFT_API_KEY
    - NEXT_PUBLIC_SOLANA_RPC
    - NEXT_PUBLIC_SOLANA_NETWORK
    - Fee Payer Public Key
    ```

    b. **Initialization**:
    ```typescript
    // Shyft SDK initialization
    const shyftInstance = new ShyftSdk({
      apiKey: SHYFT_API_KEY,
      network: getShyftNetwork(SOLANA_NETWORK)
    });
    ```

    c. **Transaction Preparation**:
    1. **Blockhash and Fee Payer**:
    ```typescript
    const connection = new Connection(SOLANA_RPC_URL);
    const recentBlockhash = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = recentBlockhash.blockhash;
    transaction.feePayer = new PublicKey(feePayer);
    ```

    2. **Transaction Simulation**:
    ```typescript
    const simulation = await connection.simulateTransaction(transaction);
    if (simulation.value.err) {
      throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
    }
    ```

    d. **Signing Process**:
    1. **Local Signing** (when required):
    ```typescript
    if (localSignRequired) {
      signedTransaction = await (await primaryWallet.getSigner()).signTransaction(transaction);
    }
    ```
    
    2. **Transaction Serialization**:
    ```typescript
    const serializedTransaction = signedTransaction.serialize({
      requireAllSignatures: false,
      verifySignatures: true
    });
    const base64Transaction = serializedTransaction.toString("base64");
    ```

    e. **API Submission**:
    ```typescript
    const result = await fetch("/api/processTransaction/", {
      method: "POST",
      body: JSON.stringify({
        order_id: orderId,
        transaction: base64Transaction
      }),
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        "Content-Type": "application/json"
      }
    });
    ```

    f. **Error Handling**:
    1. **Custom Program Errors**:
    ```typescript
    if (status !== 200) {
      const errorMessage = message.message || message.toString();
      const parsedError = JSON.parse(errorMessage);
      if (parsedError.InstructionError) {
        const [index, instructionError] = parsedError.InstructionError;
        // Map custom program error codes to messages
        finalMessage = idl.errors.find(
          error => error.code == instructionError.Custom
        )?.msg || "Unable to process transaction";
      }
    }
    ```

    2. **Response Validation**:
    - Checks for HTTP status 200
    - Validates transaction signature
    - Verifies program response
    - Handles custom program errors

14. **Security Considerations in Transaction Relay**:
    - Transaction simulation before signing
    - Signature verification
    - Authorization token required
    - Fee payer validation
    - Recent blockhash verification
    - Program ID validation
    - Account ownership checks
    - Instruction data validation

15. **Network Considerations**:
    - RPC endpoint reliability
    - Blockhash expiry time
    - Network confirmation levels
    - Transaction size limits
    - Rate limiting
    - Fee calculation and management