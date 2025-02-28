import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, BN, Program, web3 } from "@coral-xyz/anchor";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isSolanaWallet, SolanaWallet } from "@dynamic-labs/solana-core";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { Connection, PublicKey, Transaction, VersionedTransaction, Keypair } from "@solana/web3.js";
import { useEffect, useState } from "react";
import idl from "../../idl/local_solana_migrate.json";
import { LocalSolanaMigrate } from "./../../idl/local_solana_migrate";
import { arbitrator, feePayer, feeRecepient } from "@/utils/constants";

// This dummy class has publicKey & payer, plus signTransaction stubs, matching Anchor's Wallet requirement
class NoSignWallet implements anchor.Wallet {
  public payer: Keypair;
  public publicKey: PublicKey;

  constructor() {
    this.payer = Keypair.generate();
    this.publicKey = this.payer.publicKey;
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
    // No local signing needed, so return the unmodified transaction:
    return tx;
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
    // No local signing needed, so return the unmodified transactions:
    return txs;
  }
}

const useLocalSolana = () => {
  const [program, setProgram] = useState<Program<LocalSolanaMigrate> | null>(
    null
  );
  const [provider, setProvider] = useState<AnchorProvider | null>(null);
  const { primaryWallet } = useDynamicContext();
  const [connection, setConnection] = useState<Connection | null>(null);
  const [myWallet, setMyWallet] = useState<SolanaWallet | null>(null);

  const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com';

  // 1) Single place for new Connection
  useEffect(() => {
    const initConnection = async () => {
      try {
        console.debug("[useLocalSolana] Initializing connection to: SOLANA_RPC_URL");
        const conn = new Connection(SOLANA_RPC_URL, {
          commitment: 'confirmed',
          confirmTransactionInitialTimeout: 60000
        });
        
        // Verify connection is working
        await conn.getVersion();
        console.debug("[useLocalSolana] Connection established successfully");
        setConnection(conn);
      } catch (err) {
        console.error("[useLocalSolana] Failed to initialize connection:", err);
        // Retry connection after 2 seconds
        setTimeout(initConnection, 2000);
      }
    };

    if (!connection) {
      initConnection();
    }

    return () => {
      // Cleanup if needed
    };
  }, [connection, SOLANA_RPC_URL]);

  useEffect(() => {
    let mounted = true;
    
    const initializeProgram = async () => {
      try {
        // Wait for DOM to be fully ready
        await new Promise(resolve => {
          if (document.readyState === 'complete') {
            resolve(true);
          } else {
            window.addEventListener('load', resolve);
          }
        });
        
        if (!mounted) return;
        
        if (!primaryWallet) {
          console.debug("[useLocalSolana] No primary wallet available");
          return;
        }

        if (!isSolanaWallet(primaryWallet)) {
          console.warn("[useLocalSolana] Not a Solana wallet");
          return;
        }

        console.debug("[useLocalSolana] Primary wallet found:", primaryWallet.address);

        // 2) Now we rely on the existing connection from the first useEffect:
        const finalConnection = connection;
        if (!mounted || !finalConnection) {
          console.debug("[useLocalSolana] No connection available for program init");
          return;
        }

        const dummyWallet = new NoSignWallet();

        // Create the provider with the dummyWallet
        const anchorProvider = new AnchorProvider(finalConnection, dummyWallet, {
          commitment: "processed",
          preflightCommitment: "processed",
        });
        setProvider(anchorProvider);

        // Create the program instance
        console.debug("[useLocalSolana] Creating program instance");
        const prog = new Program<LocalSolanaMigrate>(
          idl as LocalSolanaMigrate,
          anchorProvider
        );
        console.debug("[useLocalSolana] Program instance created");
        setProgram(prog);
        setMyWallet(primaryWallet);

      } catch (error) {
        console.error("[useLocalSolana] Failed to initialize Solana program:", error);
      }
    };

    initializeProgram();

    return () => {
      mounted = false;
    };
  }, [primaryWallet, connection, SOLANA_RPC_URL]);

  const initialiseSolanaAccount = async (address: string) => {
    const walletAddress = primaryWallet?.address;
    if (!program || !provider) {
      throw new Error("Program or provider is not initialized");
    }

    if (!arbitrator || !feeRecepient || !feePayer) {
      throw new Error("Please set arbitrator and fee recepient in .env");
    }

    if (!walletAddress) {
      throw new Error("Unable to access your wallet");
    }
    const tx = new Transaction().add(
      await program.methods
        .initialize(new anchor.BN(100))
        .accounts({
          seller: walletAddress,
          arbitrator: arbitrator,
          feeRecipient: feeRecepient,
          feePayer: new PublicKey(feePayer),
        })
        .instruction()
    );

    return tx;
  };

  const getEscrowStatePDA = (address: string) => {
    if (!program) {
      return;
    }
    const [escrowStatePda_, _escrowStateBump] =
      PublicKey.findProgramAddressSync(
        [Buffer.from("escrow_state"), new PublicKey(address).toBuffer()],
        program.programId
      );
    return escrowStatePda_;
  };

  const getEscrowPDA = (orderId: string) => {
    if (!program) {
      return;
    }
    const [escrowPda_, _escrowStateBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), Buffer.from(orderId)],
      program.programId
    );
    return escrowPda_;
  };

  const markAsPaid = async (
    orderId: string,
    buyer: PublicKey,
    seller: PublicKey
  ) => {
    if (!program || !provider) {
      throw new Error("Program or provider is not initialized");
    }
    const tx = await program.methods
      .markAsPaid(orderId)
      .accounts({
        buyer: buyer,
        seller: seller,
      })
      .transaction();
    return tx;
  };

  const createEscrowSol = async (
    orderId: string,
    time: number,
    amount: number,
    buyer: string,
    seller: string,
    partner: string,
    automaticEscrow: boolean
  ) => {
    console.debug("[createEscrowSol] Starting escrow creation with params:", {
      orderId,
      time,
      amount,
      buyer,
      seller,
      partner,
      automaticEscrow
    });

    if (!program || !provider || !feePayer) {
      console.error("[createEscrowSol] Missing dependencies:", {
        program: !!program,
        provider: !!provider,
        feePayer
      });
      throw new Error("Program or provider is not initialized");
    }

    try {
      const tx = new Transaction().add(
        await program.methods
          .createEscrowSol(
            orderId,
            new anchor.BN(amount),
            new anchor.BN(time),  // Pass time directly without conversion
            automaticEscrow
          )
          .accounts({
            buyer: new PublicKey(buyer),
            seller: new PublicKey(seller),
            partner: new PublicKey(partner),
            feePayer: new PublicKey(feePayer),
          })
          .instruction()
      );
      console.debug("[createEscrowSol] Transaction created successfully");
      return tx;
    } catch (error) {
      console.error("[createEscrowSol] Error creating escrow:", error);
      throw error;
    }
  };

  const createEscrowSolBuyer = async (
    orderId: string,
    time: number,
    amount: number,
    buyer: string,
    seller: string,
    partner: string,
    automaticEscrow: boolean
  ) => {
    console.debug("[createEscrowSolBuyer] Starting escrow creation with params:", {
      orderId,
      time,
      amount,
      buyer,
      seller,
      partner,
      automaticEscrow
    });

    if (!program || !provider || !feePayer) {
      console.error("[createEscrowSolBuyer] Missing dependencies:", {
        program: !!program,
        provider: !!provider,
        feePayer
      });
      throw new Error("Program or provider is not initialized");
    }

    try {
      const tx = new Transaction().add(
        await program.methods
          .createEscrowSolBuyer(
            orderId,
            new anchor.BN(amount),
            new anchor.BN(time),  // Pass time directly without conversion
            automaticEscrow
          )
          .accounts({
            buyer: new PublicKey(buyer),
            seller: seller,
            partner: partner,
            feePayer: new PublicKey(feePayer),
          })
          .instruction()
      );
      console.debug("[createEscrowSolBuyer] Transaction created successfully");
      return tx;
    } catch (error) {
      console.error("[createEscrowSolBuyer] Error creating escrow:", error);
      throw error;
    }
  };

  const createEscrowToken = async (
    orderId: string,
    time: number,
    amount: number,
    buyer: string,
    seller: string,
    partner: string,
    token: string,
    instantEscrow: boolean,
    fromWallet: boolean
  ) => {
    console.debug("[createEscrowToken] Starting escrow creation with params:", {
      orderId,
      time,
      amount,
      buyer,
      seller,
      partner,
      token,
      instantEscrow,
      fromWallet
    });

    if (!program || !provider || !feePayer) {
      console.error("[createEscrowToken] Missing dependencies:", {
        program: !!program,
        provider: !!provider,
        feePayer
      });
      throw new Error("Program or provider is not initialized");
    }

    var escrow = await getEscrowPDA(orderId);
    var escrowState = await getEscrowStatePDA(seller);
    if (!escrow || !escrowState) {
      return null;
    }
    let escrowTokenAccount = await getAssociatedTokenAddress(
      new PublicKey(token),
      escrow,
      true
    );
    let escrowStateTokenAccount = await getAssociatedTokenAddress(
      new PublicKey(token),
      escrowState,
      true
    );

    try {
      const tx = await program.methods
        .createEscrowToken(
          orderId,
          new anchor.BN(amount),
          new anchor.BN(time),  // Pass time directly without conversion
          instantEscrow,
          new PublicKey(token),
          fromWallet
        )
        .accounts({
          buyer: buyer,
          seller: new PublicKey(seller),
          partner: partner,
          feePayer: new PublicKey(feePayer),
          escrowTokenAccount: new PublicKey(escrowTokenAccount),
          escrowStateTokenAccount: escrowStateTokenAccount,
          mintAccount: new PublicKey(token),
        })
        .transaction();
      console.debug("[createEscrowToken] Transaction created successfully");
      return tx;
    } catch (error) {
      console.error("[createEscrowToken] Error creating escrow:", error);
      throw error;
    }
  };

  const createEscrowTokenBuyer = async (
    orderId: string,
    time: number,
    amount: number,
    buyer: string,
    seller: string,
    partner: string,
    token: string,
    instantEscrow: boolean,
    fromWallet: boolean
  ) => {
    console.debug("[createEscrowTokenBuyer] Starting escrow creation with params:", {
      orderId,
      time,
      amount,
      buyer,
      seller,
      partner,
      token,
      instantEscrow,
      fromWallet
    });

    if (!program || !provider || !feePayer) {
      console.error("[createEscrowTokenBuyer] Missing dependencies:", {
        program: !!program,
        provider: !!provider,
        feePayer
      });
      throw new Error("Program or provider is not initialized");
    }

    var escrow = await getEscrowPDA(orderId);
    var escrowState = await getEscrowStatePDA(seller);
    if (!escrow || !escrowState) {
      return null;
    }
    let escrowTokenAccount = await getAssociatedTokenAddress(
      new PublicKey(token),
      escrow,
      true
    );
    let escrowStateTokenAccount = await getAssociatedTokenAddress(
      new PublicKey(token),
      escrowState,
      true
    );

    try {
      const tx = await program.methods
        .createEscrowTokenBuyer(
          orderId,
          new anchor.BN(amount),
          new anchor.BN(time),  // Pass time directly without conversion
          instantEscrow,
          new PublicKey(token)
        )
        .accounts({
          buyer: new PublicKey(buyer),
          seller: seller,
          partner: partner,
          feePayer: new PublicKey(feePayer),
          escrowTokenAccount: new PublicKey(escrowTokenAccount),
          escrowStateTokenAccount: escrowStateTokenAccount,
          mintAccount: new PublicKey(token),
        })
        .transaction();
      console.debug("[createEscrowTokenBuyer] Transaction created successfully");
      return tx;
    } catch (error) {
      console.error("[createEscrowTokenBuyer] Error creating escrow:", error);
      throw error;
    }
  };
  const depositFundsToLocalSolana = async (
    amount: number,
    seller: PublicKey,
    escrow: PublicKey,
    token: PublicKey
  ) => {
    if (!program || !provider || !connection || !feePayer) {
      throw new Error("Program or provider is not initialized");
    }
    if (token == PublicKey.default) {
      const transaction = new Transaction().add(
        web3.SystemProgram.transfer({
          fromPubkey: seller,
          toPubkey: escrow,
          lamports: amount,
        })
      );
      return transaction;
    } else {
      var escrowTokenAccount = await getAssociatedTokenAddress(
        token,
        escrow,
        true
      );

      const tx = new Transaction().add(
        await program.methods
          .depositToEscrowState(new BN(amount), token)
          .accounts({
            seller: seller,
            feePayer: new PublicKey(feePayer),
            mintAccount: token,
            escrowStateTokenAccount: escrowTokenAccount.toBase58(),
          })
          .instruction()
      );
      return tx;
    }
  };

  const depositFundsEscrow = async (
    amount: number,
    seller: PublicKey,
    token: PublicKey,
    orderID: string,
    decimals: number
  ) => {
    if (!program || !provider || !feePayer) {
      throw new Error("Program or provider is not initialized");
    }
    var escrow = await getEscrowPDA(orderID);
    if (!escrow) {
      throw new Error("Unable to get Escrow PDA");
    }
    try {
      const tx = new Transaction().add(
        await program.methods
          .depositToEscrow(
            orderID,
            new anchor.BN(amount * 10 ** decimals),
            token,
            false
          )
          .accounts({
            seller: seller,
            feePayer: new PublicKey(feePayer),
            mintAccount: token != PublicKey.default ? token : null,
            escrowTokenAccount:
              token != PublicKey.default
                ? await getAssociatedTokenAddress(token, escrow, true)
                : null,
          })
          .instruction()
      );
      //console.log("Got Transaction");
      return tx;
    } catch (err) {
      //console.log("Error", err);
    }
  };

  const releaseFunds = async (
    orderId: string,
    seller: PublicKey,
    buyer: PublicKey,
    token: PublicKey
  ) => {
    console.debug("[useLocalSolana:releaseFunds] Configuration:", {
      programId: program?.programId.toString(),
      orderId,
      seller: seller.toString(),
      buyer: buyer.toString(),
      token: token.toString(),
      feeRecepient,
      feePayer
    });

    if (!program || !provider || !feeRecepient || !feePayer) {
      console.error("[useLocalSolana:releaseFunds] Missing required dependencies", {
        program: !!program,
        provider: !!provider,
        feeRecepient,
        feePayer
      });
      throw new Error("Program or provider is not initialized");
    }

    console.debug("[useLocalSolana:releaseFunds] Getting escrow PDA");
    let escrowPDA = await getEscrowPDA(orderId);
    console.debug("[useLocalSolana:releaseFunds] PDA:", {
      escrowPDA: escrowPDA?.toString()
    });

    if (!escrowPDA) {
      throw new Error("Failed to derive PDA");
    }

    console.debug("[useLocalSolana:releaseFunds] Setting up token accounts");
    const isNativeSol = token.toString() === PublicKey.default.toString() || 
                       token.toString() === "11111111111111111111111111111111";
    
    let escrowTokenAccount = isNativeSol
      ? null
      : await getAssociatedTokenAddress(token, escrowPDA, true);
    let feeTokenAccount = isNativeSol
      ? null
      : await getAssociatedTokenAddress(token, new PublicKey(feeRecepient), true);
    let buyerTokenAccount = isNativeSol
      ? null
      : await getAssociatedTokenAddress(token, buyer, true);

    console.debug("[useLocalSolana:releaseFunds] Token accounts:", {
      isNativeSol,
      escrowTokenAccount: escrowTokenAccount?.toString(),
      feeTokenAccount: feeTokenAccount?.toString(),
      buyerTokenAccount: buyerTokenAccount?.toString()
    });

    try {
      const tx = await program.methods
        .releaseFunds(orderId)
        .accounts({
          seller,
          buyer,
          feeRecipient: new PublicKey(feeRecepient),
          mintAccount: isNativeSol ? PublicKey.default : token,
          feePayer: new PublicKey(feePayer),
          feeRecipientTokenAccount: feeTokenAccount,
          escrowTokenAccount,
          buyerTokenAccount
        })
        .transaction();
      
      console.debug("[useLocalSolana:releaseFunds] Transaction created:", {
        programId: program.programId.toString(),
        instructions: tx.instructions.map(ix => ({
          programId: ix.programId.toString(),
          keys: ix.keys.map(k => ({
            pubkey: k.pubkey.toString(),
            isSigner: k.isSigner,
            isWritable: k.isWritable
          })),
          data: Buffer.from(ix.data).toString('hex')
        }))
      });

      return tx;
    } catch (error) {
      console.error("[useLocalSolana:releaseFunds] Error creating transaction:", error);
      throw error;
    }
  };

  const cancelOrderOnChain = async (
    orderId: string,
    cancelledBy: PublicKey,
    seller: PublicKey,
    token: PublicKey
  ) => {
    if (!program || !provider || !feeRecepient || !feePayer || !arbitrator) {
      throw new Error("Program or provider is not initialized");
    }
    
    let escrowPDA = await getEscrowPDA(orderId);
    let escrowStatePDA = await getEscrowStatePDA(seller.toBase58());

    let escrowTokenAccount =
      token == PublicKey.default
        ? null
        : await getAssociatedTokenAddress(token, escrowPDA!, true);
    let escrowStateTokenAccount =
      token == PublicKey.default
        ? null
        : await getAssociatedTokenAddress(token, escrowStatePDA!, true);

    const tx = await program.methods
      .buyerCancel(orderId)
      .accounts({
        seller: cancelledBy,  // Use the cancelling party's address
        feePayer: feePayer,
        escrowStateTokenAccount: escrowStateTokenAccount,
        escrowTokenAccount: escrowTokenAccount,
      })
      .transaction();
    return tx;
  };

  const openDispute = async (orderId: string, payer: PublicKey) => {
    if (!program || !provider) {
      throw new Error("Program or provider is not initialized");
    }
    const tx = await program.methods
      .openDispute(orderId)
      .accounts({
        payer: payer,
        feePayer: feePayer,
      })
      .transaction();
    return tx;
  };

  const resolveDispute = async (
    orderId: string,
    seller: PublicKey,
    buyer: PublicKey,
    winner: PublicKey,
    token: PublicKey
  ) => {
    if (!program || !provider || !feeRecepient || !feePayer || !arbitrator) {
      throw new Error("Program or provider is not initialized");
    }
    let escrowPDA = await getEscrowPDA(orderId);

    let escrowTokenAccount =
      token == PublicKey.default
        ? null
        : await getAssociatedTokenAddress(token, escrowPDA!, true);
    let feeTokenAccount =
      token == PublicKey.default
        ? null
        : await getAssociatedTokenAddress(
            token,
            new PublicKey(feeRecepient),
            true
          );
    let buyerTokenAccount =
      token == PublicKey.default
        ? null
        : await getAssociatedTokenAddress(token, new PublicKey(buyer), true);
    let sellerTokenAccount =
      token == PublicKey.default
        ? null
        : await getAssociatedTokenAddress(token, new PublicKey(seller), true);
    const tx = await program.methods
      .resolveDispute(orderId, winner)
      .accounts({
        arbitrator: new PublicKey(arbitrator),
        seller: seller,
        buyer: buyer,
        feeRecipient: new PublicKey(feeRecepient),
        mintAccount: token,
        feePayer: new PublicKey(feePayer),
        feeRecipientTokenAccount: feeTokenAccount,
        escrowTokenAccount: escrowTokenAccount,
        buyerTokenAccount: buyerTokenAccount,
        sellerTokenAccount: sellerTokenAccount,
      })
      .transaction();
    return tx;
  };

  const withdrawFundsFromLocalSolana = async (
    amount: number,
    seller: PublicKey,
    escrow: PublicKey,
    token: PublicKey,
    decimals: number
  ) => {
    if (!program || !provider || !connection || !feePayer) {
      throw new Error("Program or provider is not initialized");
    }

    // Check if escrow state exists
    const escrowState = await getEscrowStatePDA(seller.toBase58());
    if (!escrowState) {
      throw new Error("Failed to derive escrow state PDA");
    }

    // Check if escrow state is initialized
    const escrowStateInfo = await connection.getAccountInfo(escrowState);
    if (!escrowStateInfo) {
      // Initialize escrow state first
      const initTx = await initialiseSolanaAccount(seller.toBase58());
      const tx = new Transaction();
      tx.add(initTx);
      
      // Add the withdrawal instruction after initialization
      var escrowTokenAccount = await getAssociatedTokenAddress(
        token,
        escrow,
        true
      );
      var sellerTokenAccount = await getAssociatedTokenAddress(
        token,
        seller,
        true
      );

      tx.add(
        await program.methods
          .withdrawBalance(new BN(amount * 10 ** decimals), token)
          .accounts({
            escrowStateTokenAccount: escrowTokenAccount,
            seller: seller,
            feePayer: new PublicKey(feePayer),
            sellerTokenAccount: sellerTokenAccount,
            mintAccount: token,
          })
          .instruction()
      );
      return tx;
    }

    // If already initialized, just do the withdrawal
    var escrowTokenAccount = await getAssociatedTokenAddress(
      token,
      escrow,
      true
    );
    var sellerTokenAccount = await getAssociatedTokenAddress(
      token,
      seller,
      true
    );

    const tx = new Transaction().add(
      await program.methods
        .withdrawBalance(new BN(amount * 10 ** decimals), token)
        .accounts({
          escrowStateTokenAccount: escrowTokenAccount,
          seller: seller,
          feePayer: new PublicKey(feePayer),
          sellerTokenAccount: sellerTokenAccount,
          mintAccount: token,
        })
        .instruction()
    );
    return tx;
  };

  return {
    program,
    provider,
    myWallet,
    idl,
    connection,
    initialiseSolanaAccount,
    getEscrowStatePDA,
    getEscrowPDA,
    markAsPaid,
    createEscrowSol,
    createEscrowToken,
    depositFundsToLocalSolana,
    depositFundsEscrow,
    releaseFunds,
    createEscrowSolBuyer,
    createEscrowTokenBuyer,
    openDispute,
    resolveDispute,
    cancelOrderOnChain,
    withdrawFundsFromLocalSolana,
  };
};

export default useLocalSolana;
