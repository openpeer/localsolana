import { LocalSolanaMigrate } from "./../../idl/local_solana_migrate";
import { useState, useEffect } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, web3, BN } from "@coral-xyz/anchor";
import idl from "../../idl/local_solana_migrate.json";
import { CURRENT_NETWORK, CURRENT_NETWORK_URL } from "utils";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { Keypair } from "@solana/web3.js";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import * as anchor from "@coral-xyz/anchor";
import { Transaction } from "@solana/web3.js";
import {
  ISolana,
  isSolanaWallet,
  SolanaWallet,
} from "@dynamic-labs/solana-core";
import {
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

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
      //const key = Uint8Array.from(bs58.decode(primaryWallet?.key));
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
          new anchor.BN(100),
          new anchor.BN(1000000),
          new PublicKey(feeRecepient)
        )
        .accounts({
          seller: primaryWallet?.address,
          arbitrator: arbitrator,
          feeRecipient: feeRecepient,
          feePayer: new PublicKey(
            "2Hu9fgnKUWyxqGwLVLhoUPsG9PJ15YbNxB8boWmCdSqC"
          ),
        })
        .instruction()
    );

    return tx;
  };

  const getEscrowStatePDA = (address: string) => {
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
    partner: string,
    automaticEscrow: boolean
  ) => {
    if (!program || !provider) {
      throw new Error("Program or provider is not initialized");
    }
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
          feePayer: new PublicKey(
            "2Hu9fgnKUWyxqGwLVLhoUPsG9PJ15YbNxB8boWmCdSqC"
          ),
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
    instantEscrow: boolean
  ) => {
    if (!program || !provider) {
      throw new Error("Program or provider is not initialized");
    }
    var escrow = await getEscrowPDA(orderId);
    if (!escrow) {
      return null;
    }
    var escrowTokenAccount = await getAssociatedTokenAddress(
      new PublicKey(token),
      escrow,
      true
    );

    const tx = await program.methods
      .createEscrowToken(
        orderId,
        new anchor.BN(amount),
        new anchor.BN(time),
        instantEscrow,
        new PublicKey(token)
      )
      .accounts({
        buyer: new PublicKey(buyer),
        seller: new PublicKey(seller),
        partner: new PublicKey(partner),
        feePayer: new PublicKey("2Hu9fgnKUWyxqGwLVLhoUPsG9PJ15YbNxB8boWmCdSqC"),
        escrowTokenAccount: new PublicKey(escrowTokenAccount),
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
    if (!program || !provider || !connection) {
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
      console.log("Here is UseGaslessDepositFunds", token, escrow);
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
            feePayer: new PublicKey(
              "2Hu9fgnKUWyxqGwLVLhoUPsG9PJ15YbNxB8boWmCdSqC"
            ),
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
    orderID: string,decimals: number
  ) => {
    if (!program || !provider) {
      throw new Error("Program or provider is not initialized");
    }
    var escrow = await getEscrowPDA(orderID);
    if (!escrow) {
      throw new Error("Unable to get Escrow PDA");
    }
    try{
    const tx = new Transaction().add(
      await program.methods
        .depositToEscrow(orderID, new anchor.BN((amount * 10 ** decimals)), token, false)
        .accounts({
          seller: seller,
          feePayer: new PublicKey(
            "2Hu9fgnKUWyxqGwLVLhoUPsG9PJ15YbNxB8boWmCdSqC"
          ),
          mintAccount: token != PublicKey.default ? token : null,
          escrowTokenAccount:
            token != PublicKey.default
              ? await getAssociatedTokenAddress(token, escrow, true)
              : null,
        })
        .instruction()
    );
    console.log('Got Transaction');
    return tx;
  }catch(err){
    console.log('Error',err);
  }
  };

  const releaseFunds = async (
    orderId: string,
    seller: PublicKey,
    buyer: PublicKey,
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
        feeRecipient: new PublicKey(
          "5ma3WQEhs1kimMVqDB8Rc9PceTkEUVkm68A6g6cgxWjJ"
        ),
        mintAccount: token,
        feePayer: new PublicKey("2Hu9fgnKUWyxqGwLVLhoUPsG9PJ15YbNxB8boWmCdSqC"),
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
  };
};

export default useLocalSolana;
