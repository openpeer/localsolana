import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, BN, Program, web3 } from "@coral-xyz/anchor";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isSolanaWallet, SolanaWallet } from "@dynamic-labs/solana-core";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { useEffect, useState } from "react";
import { CURRENT_NETWORK_URL } from "utils";
import idl from "../../idl/local_solana_migrate.json";
import { LocalSolanaMigrate } from "./../../idl/local_solana_migrate";
import { arbitrator, feePayer, feeRecepient } from "@/utils/constants";

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
      if (!primaryWallet) {
        console.error("Wallet is not there");
        return;
      }
      if (!isSolanaWallet(primaryWallet)) {
        return;
      }
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
        .initialize(
          new anchor.BN(100),
        )
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
    if (!program || !provider || !feePayer) {
      throw new Error("Program or provider is not initialized");
    }
    console.log("Here buyer", buyer, "seller", seller);
    const tx = new Transaction().add(
      await program.methods
        .createEscrowSol(
          orderId,
          new anchor.BN(amount),
          new anchor.BN(time),
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
    return tx;
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
    if (!program || !provider || !feePayer) {
      throw new Error("Program or provider is not initialized");
    }
    console.log("Here buyer", buyer, "seller", seller);
    const tx = new Transaction().add(
      await program.methods
        .createEscrowSolBuyer(
          orderId,
          new anchor.BN(amount),
          new anchor.BN(time),
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
    return tx;
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
    if (!program || !provider || !feePayer) {
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

    const tx = await program.methods
      .createEscrowToken(
        orderId,
        new anchor.BN(amount),
        new anchor.BN(time),
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
    return tx;
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
    if (!program || !provider || !feePayer) {
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

    const tx = await program.methods
      .createEscrowTokenBuyer(
        orderId,
        new anchor.BN(amount),
        new anchor.BN(time),
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
    return tx;
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
      console.log("Got Transaction");
      return tx;
    } catch (err) {
      console.log("Error", err);
    }
  };

  const releaseFunds = async (
    orderId: string,
    seller: PublicKey,
    buyer: PublicKey,
    token: PublicKey
  ) => {
    if (!program || !provider || !feeRecepient || !feePayer) {
      throw new Error("Program or provider is not initialized");
    }
    let escrowPDA = await getEscrowPDA(orderId);

    let escrowTokenAccount = token==PublicKey.default?null:await getAssociatedTokenAddress(
      token,
      escrowPDA!,
      true
    );
    let feeTokenAccount = token==PublicKey.default?null:await getAssociatedTokenAddress(
      token,
      new PublicKey(feeRecepient),
      true
    );
    let buyerTokenAccount = token==PublicKey.default?null:await getAssociatedTokenAddress(
      token,
      new PublicKey(buyer),
      true
    );
    const tx = await program.methods
      .releaseFunds(orderId)
      .accounts({
        seller: seller,
        buyer: buyer,
        feeRecipient: new PublicKey(feeRecepient),
        mintAccount: token,
        feePayer: new PublicKey(feePayer),
        feeRecipientTokenAccount:feeTokenAccount,
        escrowTokenAccount:escrowTokenAccount,
        buyerTokenAccount:buyerTokenAccount
      })
      .transaction();
    return tx;
  };

  const cancelOrderOnChain = async (
    orderId: string,
    cancelledBy: PublicKey,
    seller:PublicKey,
    token:PublicKey
  ) => {
    if (!program || !provider || !feeRecepient || !feePayer || !arbitrator) {
      throw new Error("Program or provider is not initialized");
    }
    let escrowPDA = await getEscrowPDA(orderId);
    let escrowStatePDA = await getEscrowStatePDA(seller.toBase58());

    let escrowTokenAccount = token==PublicKey.default?null:await getAssociatedTokenAddress(
      token,
      escrowPDA!,
      true
    );
    let escrowStateTokenAccount = token==PublicKey.default?null:await getAssociatedTokenAddress(
      token,
      escrowStatePDA!,
      true
    );
   
    const tx = await program.methods
      .buyerCancel(orderId)
      .accounts({
       seller:cancelledBy,
       feePayer:feePayer,
       escrowStateTokenAccount:escrowStateTokenAccount,
       escrowTokenAccount:escrowTokenAccount
      })
      .transaction();
    return tx;
  };

  const openDispute = async (
    orderId: string,
    payer: PublicKey,
  ) => {
    if (!program || !provider) {
      throw new Error("Program or provider is not initialized");
    }
    const tx = await program.methods
      .openDispute(orderId)
      .accounts({
       payer:payer,
       feePayer:feePayer
      })
      .transaction();
    return tx;
  };

  const resolveDispute = async (
    orderId: string,
    seller: PublicKey,
    buyer: PublicKey,
    winner:PublicKey,
    token: PublicKey
  ) => {
    if (!program || !provider || !feeRecepient || !feePayer || !arbitrator) {
      throw new Error("Program or provider is not initialized");
    }
    let escrowPDA = await getEscrowPDA(orderId);

    let escrowTokenAccount = token==PublicKey.default?null:await getAssociatedTokenAddress(
      token,
      escrowPDA!,
      true
    );
    let feeTokenAccount = token==PublicKey.default?null:await getAssociatedTokenAddress(
      token,
      new PublicKey(feeRecepient),
      true
    );
    let buyerTokenAccount = token==PublicKey.default?null:await getAssociatedTokenAddress(
      token,
      new PublicKey(buyer),
      true
    );
    let sellerTokenAccount = token==PublicKey.default?null:await getAssociatedTokenAddress(
      token,
      new PublicKey(seller),
      true
    );
    const tx = await program.methods
      .resolveDispute(orderId,winner)
      .accounts({
        arbitrator:new PublicKey(arbitrator),
        seller: seller,
        buyer: buyer,
        feeRecipient: new PublicKey(feeRecepient),
        mintAccount: token,
        feePayer: new PublicKey(feePayer),
        feeRecipientTokenAccount:feeTokenAccount,
        escrowTokenAccount:escrowTokenAccount,
        buyerTokenAccount:buyerTokenAccount,
        sellerTokenAccount:sellerTokenAccount
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
    releaseFunds,
    createEscrowSolBuyer,
    createEscrowTokenBuyer,openDispute,resolveDispute,cancelOrderOnChain
  };
};

export default useLocalSolana;
