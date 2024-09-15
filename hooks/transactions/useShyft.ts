// useShyft.ts
import { useState, useEffect } from "react";
import { Network, ShyftSdk } from "@shyft-to/js";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import { CURRENT_NETWORK } from "utils";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { ISolana, isSolanaWallet } from '@dynamic-labs/solana-core';
import useLocalSolana from "./useLocalSolana";
import { TransactionSignature } from "@solana/web3.js";

const useShyft = () => {
  const [shyft, setShyft] = useState<ShyftSdk | null>(null);
  const [connection, setConnection] = useState<Connection | null>(null);
  const { primaryWallet } = useDynamicContext();
  const {provider} = useLocalSolana();



  useEffect(() => {
    const initializeShyft = async () => {
      const shyftInstance = new ShyftSdk({
        apiKey: "JwpOxgz2GUG8VMpA",
        network: CURRENT_NETWORK,
      });
      //const connectionInstance = new Connection(CURRENT_NETWORK, "confirmed");
      setShyft(shyftInstance);
      // setConnection(connectionInstance);
    };

    initializeShyft();
  }, []);

  const sendTransactionWithShyft = async (transaction: Transaction) => {
    const connection = new Connection("https://api.devnet.solana.com");
    const recentBlockhash = await connection.getLatestBlockhash();
    const walletPublicKey = new PublicKey(primaryWallet?.address ?? "");

    console.log("Recent blockhash: " + recentBlockhash.blockhash);
    transaction.recentBlockhash = recentBlockhash.blockhash;
    transaction.feePayer = new PublicKey(
      "2Hu9fgnKUWyxqGwLVLhoUPsG9PJ15YbNxB8boWmCdSqC"
    );
    if(primaryWallet==null || !isSolanaWallet(primaryWallet)) {
      return;
    }
   let signedTransaction = await  (await primaryWallet.getSigner()).signTransaction(transaction);
    if(!signedTransaction){
      throw new Error(`Cannot sign transaction1: ${transaction}`);
    }
    transaction.partialSign();

    console.log(`Seller Signed Transaction:: ${transaction}`);
    // Serialize the transaction
    let serializedTransaction = signedTransaction.serialize({
      requireAllSignatures: false, //because we will sign it by Shyft as well
      verifySignatures: true, // will verify whether signatures are valid or not
    });
    // Convert serialized transaction to base64 string
    let base64Transaction = Buffer.from(serializedTransaction).toString(
      "base64"
    );
    console.log("Tansaction is " + base64Transaction);

    const signature = await shyft?.txnRelayer.sign({
      encodedTransaction: base64Transaction,
      network: CURRENT_NETWORK,
    });
    console.log("Signed Tansaction is " + signature);
    try {
      const txSignature: TransactionSignature = signature as TransactionSignature;
      await connection.confirmTransaction(txSignature, "confirmed");
      console.log(txSignature);
      return txSignature;
    } catch (error) {
      console.error("Error sending transaction:", error);
      throw error;
    }
  };

  const getWalletBalance = async (address: string) => {
    if (shyft == null) {
      return null;
    }
    const balance = await shyft.wallet.getBalance({ wallet: address });
    console.log(balance);
    return balance;
  };

  const getTokenBalance = async (address: string, tokenAddress: string) => {
    if (shyft == null) {
      return null;
    }
    const balance = await shyft.wallet.getTokenBalance({
      token: tokenAddress,
      wallet: address,
    });
    console.log(balance);
    return balance;
  };

  const getAllTokenBalance = async (address: string) => {
    if (shyft == null) {
      return null;
    }
    const balance = await shyft.wallet.getAllTokenBalance({ wallet: address });
    console.log(balance);
    return balance;
  };

  return {
    shyft,
    connection,
    sendTransactionWithShyft,
    getWalletBalance,
    getTokenBalance,
    getAllTokenBalance,
  };
};

export default useShyft;
