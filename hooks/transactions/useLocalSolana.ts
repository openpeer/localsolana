import { LocalSolanaMigrate } from "./../../idl/local_solana_migrate";
import { useState, useEffect } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, web3 } from "@coral-xyz/anchor";
import idl from "../../idl/local_solana_migrate.json";
import { CURRENT_NETWORK, CURRENT_NETWORK_URL } from "utils";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { Keypair } from "@solana/web3.js";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import * as anchor from "@coral-xyz/anchor";
import { Transaction } from "@solana/web3.js";
import { isSolanaWallet, SolanaWallet } from "@dynamic-labs/solana-core";
import { createTransferCheckedInstruction, getOrCreateAssociatedTokenAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token";

const useLocalSolana = () => {
  const [program, setProgram] = useState<Program<LocalSolanaMigrate> | null>(
    null
  );
  const [provider, setProvider] = useState<AnchorProvider | null>(null);
  const { primaryWallet } = useDynamicContext();
  const [connection, setConnection] = useState<Connection | null>(null);
  const [myWallet, setMyWallet] = useState<SolanaWallet | null>(null);

  useEffect(() => {
    const initializeProgram = async () => {
      const connection = new Connection(CURRENT_NETWORK_URL, "confirmed");
      if (!primaryWallet?.isConnected) {
        console.error("Wallet is not there");
        return;
      }
      if (!isSolanaWallet(primaryWallet)) {
        return;
      }
      const key = Uint8Array.from(bs58.decode(primaryWallet?.key));
      //@ts-ignore
      const provider = new AnchorProvider(connection, primaryWallet, {
        commitment: "processed",
      });
      const program = new Program<LocalSolanaMigrate>(
        idl as LocalSolanaMigrate,
        provider
      );

      setProvider(provider);
      setProgram(program);
      setMyWallet(primaryWallet);
      setConnection(connection);
    };

    initializeProgram();
  }, [primaryWallet]);

  const initialiseSolanaAccount = async (address: string) => {
    if (!program || !provider) {
      throw new Error("Program or provider is not initialized");
    }
    const arbitrator = "FAsF12aNXnsJ8rcg2BzAWxG1KZxboDttbzjqz5qPsAV1"; //process.env.NEXT_ARBITRATOR_ADDRESS;
    const feeRecepient = "DrkhNqVahiYsC8f6vfRj7cabECXr9mo9Siyet4JTCmow"; //process.env.NEXT_FEE_RECEPIENT;
    console.log(`arbitrator ${arbitrator} fee: ${feeRecepient}`);
    if (!arbitrator || !feeRecepient) {
      throw new Error("Please set arbitrator and fee recepient in env");
    }

    const tx = new Transaction().add(
      await program.methods
        .initialize(
          new anchor.BN(50),
          new anchor.BN(1000000),
          new PublicKey(feeRecepient)
        )
        .accounts({
          seller: primaryWallet?.address,
          arbitrator: arbitrator,
          feeRecipient: feeRecepient,
          feePayer: new PublicKey( "2Hu9fgnKUWyxqGwLVLhoUPsG9PJ15YbNxB8boWmCdSqC")
        })
        .instruction()
    );

    return tx;
  };

  const getEscrowStatePDA = async (address: string) => {
    if (!program) {
      return;
    }
    const [escrowStatePda_, escrowStateBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow_state"), new PublicKey(address).toBuffer()],
      program.programId
    );
    return escrowStatePda_;
  };

  const getEscrowPDA = async (orderId: string) => {
    if (!program) {
      return;
    }
    const [escrowPda_, escrowStateBump] = PublicKey.findProgramAddressSync(
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
    partner: string
  ) => {
    if (!program || !provider) {
      throw new Error("Program or provider is not initialized");
    }
    const tx = await program.methods
      .createEscrowSol(orderId, new anchor.BN(amount), new anchor.BN(time))
      .accounts({
        buyer: new PublicKey(buyer),
        seller: new PublicKey(seller),
        partner: new PublicKey(partner),
        feePayer: new PublicKey( "2Hu9fgnKUWyxqGwLVLhoUPsG9PJ15YbNxB8boWmCdSqC")
      })
      .transaction();
    return tx;
  };

  const createEscrowToken = async (
    orderId: string,
    time: number,
    amount: number,
    buyer: string,
    seller: string,
    partner: string,
    token:string,
    instantEscrow:boolean,
  ) => {
    if (!program || !provider) {
      throw new Error("Program or provider is not initialized");
    }
    const tx = await program.methods
      .createEscrowToken(orderId, new anchor.BN(amount), new anchor.BN(time), instantEscrow, new PublicKey(token))
      .accounts({
        buyer: new PublicKey(buyer),
        seller: new PublicKey(seller),
        partner: new PublicKey(partner),
        feePayer: new PublicKey("2Hu9fgnKUWyxqGwLVLhoUPsG9PJ15YbNxB8boWmCdSqC"),
        escrowTokenAccount: new PublicKey(seller),
        sellerTokenAccount: new PublicKey(token)
      })
      .transaction();
    return tx;
  };

  const depositFundsToLocalSolana = async (
    amount: number,
    seller: PublicKey,
    escrow:PublicKey,
    token: PublicKey
  ) => {
    if (!program || !provider) {
      throw new Error("Program or provider is not initialized");
    }
    if(token == PublicKey.default){
     const transaction = new Transaction().add(
      web3.SystemProgram.transfer({
        fromPubkey: seller,
        toPubkey: escrow,
        lamports: amount,
      })
    );
    return transaction;
  }else{
    var tokenPubKey = new web3.PublicKey(token);
  var USDC_Token = new Token(
    connection,
    tokenPubKey,
   TOKEN_PROGRAM_ID,
     primaryWallet?.address
  );
  if(connection==null){
    return null;
  }
 // Create associated token accounts for my token if they don't exist yet
var fromTokenAccount = await getOrCreateAssociatedTokenAccount(
  connection,
  new PublicKey(primaryWallet?.address || ''),
  tokenPubKey,
  primaryWallet?.address
);

var toTokenAccount = await USDC_Token.getOrCreateAssociatedAccountInfo(
  new PublicKey(escrow)
);
// Add token transfer instructions to transaction
var transaction = new web3.Transaction()
  .add(
    createTransferCheckedInstruction(
      TOKEN_PROGRAM_ID,
      fromTokenAccount.address,
      toTokenAccount.address,
      new PublicKey(primaryWallet?.address||''),
      amount,
      6
      
    )
  );
    return transaction;
  }
  };

  const depositFundsEscrow = async (
    amount: number,
    seller: PublicKey,
    escrow: PublicKey,
    token: PublicKey
  ) => {
    if (!program || !provider) {
      throw new Error("Program or provider is not initialized");
    }
    // const transaction = new Transaction().add(
    //   web3.SystemProgram.transfer({
    //     fromPubkey: seller,
    //     toPubkey: escrow,
    //     lamports: amount,
    //   })
    // );
    const tx = program.methods.deposit(new anchor.BN(amount),token).accounts(seller).transaction();
    return tx;
  };

  const releaseFunds = async (
   orderId: string,
    seller:PublicKey,
    buyer:PublicKey,
    token: PublicKey
  ) => {
    if (!program || !provider) {
      throw new Error("Program or provider is not initialized");
    }
    const tx = await program.methods
    .releaseFunds(orderId)
    .accounts({
      seller: seller,
      buyer: buyer, 
      feeRecipient: new PublicKey("DrkhNqVahiYsC8f6vfRj7cabECXr9mo9Siyet4JTCmow") 
    })
    .transaction();
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
    releaseFunds
  };
};

export default useLocalSolana;
