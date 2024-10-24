import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isSolanaWallet } from "@dynamic-labs/solana-core";
import { ShyftSdk } from "@shyft-to/js";
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionSignature,
} from "@solana/web3.js";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { CURRENT_NETWORK, CURRENT_NETWORK_URL } from "utils";
import useLocalSolana from "./useLocalSolana";
import { feePayer } from "@/utils/constants";

const useShyft = () => {
  const [shyft, setShyft] = useState<ShyftSdk | null>(null);
  const { primaryWallet } = useDynamicContext();
  const { provider, program, idl, connection } = useLocalSolana();

  useEffect(() => {
    const initializeShyft = async () => {
      const shyftInstance = new ShyftSdk({
        apiKey: 'kQyqadJtuKQUFcBt',//"JwpOxgz2GUG8VMpA",
        network: CURRENT_NETWORK,
      });
      //const connectionInstance = new Connection(CURRENT_NETWORK, "confirmed");
      setShyft(shyftInstance);
      // setConnection(connectionInstance);
    };

    initializeShyft();
  }, []);

  const sendTransactionWithShyft = async (
    transaction: Transaction,
    localSignRequired: boolean
  ) => {
    if (!feePayer) {
      throw new Error("Fee payer is not set in env");
    }
    const connection = new Connection(CURRENT_NETWORK_URL);
    const recentBlockhash = await connection.getLatestBlockhash();
    transaction.recentBlockhash = recentBlockhash.blockhash;
    transaction.feePayer = new PublicKey(feePayer);
    let signedTransaction;
    console.log('Here is localSigning',localSignRequired);
    if (localSignRequired ) {
      if (primaryWallet == null || !isSolanaWallet(primaryWallet)) {
        return;
      }
      console.log('wallet details',primaryWallet);
      try {
        if(!primaryWallet.connector.isEmbeddedWallet) {
          if (!window.solana?.isConnected) {
            await window.solana?.connect();
        }
        }
        // signedTransaction = primaryWallet.connector.isEmbeddedWallet?await (
        //   await primaryWallet.getSigner()
        // ).signTransaction(transaction): await window.solana?.signTransaction(transaction).catch((error)=>{
        //   console.log('Here in error',error);
        // });
        signedTransaction =  await (await primaryWallet.getSigner()).signTransaction(transaction);
        if (!signedTransaction) {
          throw new Error(`Cannot sign transaction1: ${transaction}`);
        }
      } catch (err: any) {
        throw new Error(err);
      }
    } else {
      signedTransaction = transaction;
    }
    // Serialize the transaction
    let serializedTransaction = signedTransaction.serialize({
      requireAllSignatures: false, //because we will sign it by Shyft as well
      verifySignatures: true, // will verify whether signatures are valid or not
    });
    // Convert serialized transaction to base64 string
    let base64Transaction = serializedTransaction.toString(
      "base64"
    );                      //Buffer.from(
    console.log("Tansaction is " + base64Transaction);

    try {
      const signature = await shyft?.txnRelayer.sign({
        encodedTransaction: base64Transaction,
        network: CURRENT_NETWORK,
      });
      console.log("Signed Tansaction is " + signature);
      try {
        const txSignature: TransactionSignature =
          signature as TransactionSignature;
        await connection.confirmTransaction(txSignature, "confirmed");
        console.log(txSignature);
        return txSignature;
      } catch (error) {
        console.error("Error sending transaction:", error);
        throw error;
      }
    } catch (error: any) {
      toast.error(`${error}`, {
        theme: "dark",
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        progress: undefined,
      });

      // Convert the error message to a string, and attempt to parse it
      try {
        const errorMessage = error.message || error.toString();
        const parsedError = JSON.parse(errorMessage.match(/{.*}/)[0]); // Extract the JSON part of the error message

        // Check if it's an InstructionError
        if (
          parsedError.InstructionError &&
          Array.isArray(parsedError.InstructionError)
        ) {
          const [index, instructionError] = parsedError.InstructionError;

          if (instructionError.Custom !== undefined) {
            console.log(
              "This is an InstructionError with a custom error code:",
              instructionError.Custom
            );
            // You can now handle the custom error code, e.g.
            //handleCustomError(instructionError.Custom);
            idl.errors[instructionError.custom];
          } else {
            console.log(
              "This is an InstructionError, but no custom error was found"
            );
          }
        } else {
          console.log("This is not an InstructionError:", parsedError);
        }
      } catch (parsingError) {
        console.error("Failed to parse the error message:", parsingError);
      }
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
    return balance.balance;
  };

  const getAllTokenBalance = async (address: string) => {
    if (shyft == null) {
      return null;
    }
    const balance = await shyft.wallet.getAllTokenBalance({ wallet: address });
    console.log(balance);
    return balance;
  };

  const getAccountInfo = async (address: string) => {
    if (shyft == null) {
      return null;
    }
    const accountInfo = await shyft?.connection.getAccountInfo(
      new PublicKey(address)
    );
    console.log(accountInfo);
    return accountInfo?.data.toString();
  };

  return {
    shyft,
    connection,
    sendTransactionWithShyft,
    getWalletBalance,
    getTokenBalance,
    getAllTokenBalance,
    getAccountInfo,
  };
};

export default useShyft;
