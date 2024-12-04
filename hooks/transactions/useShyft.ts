import { getAuthToken, useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isSolanaWallet } from "@dynamic-labs/solana-core";
import { Network, ShyftSdk } from "@shyft-to/js";
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionSignature,
} from "@solana/web3.js";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { BLOCK_EXPLORER, CURRENT_NETWORK, CURRENT_NETWORK_URL } from "utils";
import useLocalSolana from "./useLocalSolana";
import { feePayer } from "@/utils/constants";
import snakecaseKeys from "snakecase-keys";

// Helper function to convert string network to ShyftSdk Network enum
const getShyftNetwork = (network: string): Network => {
  switch (network.toLowerCase()) {
    case "mainnet-beta":
    case "mainnet":
      return Network.Mainnet;
    case "devnet":
      return Network.Devnet;
    case "testnet":
      return Network.Testnet;
    default:
      return Network.Devnet; // Default to devnet if unknown
  }
};

const useShyft = () => {
  const [shyft, setShyft] = useState<ShyftSdk | null>(null);
  const { primaryWallet } = useDynamicContext();
  const { provider, program, idl, connection } = useLocalSolana();

  useEffect(() => {
    const initializeShyft = async () => {
      const apiKey = process.env.NEXT_PUBLIC_SHYFT_API_KEY ;
      if(!apiKey){
        throw new Error("Error Initializing signer");
      }
      const shyftInstance = new ShyftSdk({
        apiKey: apiKey,
        network: getShyftNetwork(CURRENT_NETWORK), // Convert string to Network enum
      });
      setShyft(shyftInstance);
    };

    initializeShyft();
  }, []);

  const sendTransactionWithShyft = async (
    transaction: Transaction,
    localSignRequired: boolean,
    orderId?: string
  ) => {
    if(!shyft){
      throw new Error("Shyft SDK not initialized");
    }
    if (!feePayer) {
      throw new Error("Fee payer is not set in env");
    }
    const connection = new Connection(CURRENT_NETWORK_URL);
    const recentBlockhash = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = recentBlockhash.blockhash;
    transaction.feePayer = new PublicKey(feePayer);
    let signedTransaction;

    if (localSignRequired) {
      if (primaryWallet == null || !isSolanaWallet(primaryWallet)) {
        return;
      }
      try {
        signedTransaction = await (await primaryWallet.getSigner()).signTransaction(transaction);
        if (!signedTransaction) {
          throw new Error(`Cannot sign transaction: ${transaction}`);
        }
      } catch (err: any) {
        throw new Error(err);
      }
    } else {
      signedTransaction = transaction;
    }

    const serializedTransaction = signedTransaction.serialize({
      requireAllSignatures: false,
      verifySignatures: true,
    });
    const base64Transaction = serializedTransaction.toString("base64");

    // try {
    //   const signature = await shyft?.txnRelayer.sign({
    //     encodedTransaction: base64Transaction,
    //     network: getShyftNetwork(CURRENT_NETWORK),
    //   });

    //   if (signature) {
    //     const txSignature: TransactionSignature = signature as TransactionSignature;
    //     await connection.confirmTransaction(txSignature, "confirmed");
    //     return txSignature;
    //   }
    // } catch (error: any) {

    //   try {
    //     const errorMessage = error.message || error.toString();
    //     const parsedError = JSON.parse(errorMessage.match(/{.*}/)[0]);

    //     if (
    //       parsedError.InstructionError &&
    //       Array.isArray(parsedError.InstructionError)
    //     ) {
    //       const [index, instructionError] = parsedError.InstructionError;
    //       if (instructionError.Custom !== undefined) {
    //         console.log(
    //           "This is an InstructionError with a custom error code:",
    //           instructionError.Custom
    //         );
    //         idl.errors[instructionError.custom];
    //       }
    //     }
    //   } catch (parsingError) {
    //     console.error("Failed to parse the error message:", parsingError);
    //     toast.error(`${error}`, {
    //       theme: "dark",
    //       position: "top-right",
    //       autoClose: 5000,
    //       hideProgressBar: false,
    //       closeOnClick: true,
    //       pauseOnHover: true,
    //       draggable: false,
    //       progress: undefined,
    //     });
    //   }
    // }

    // here use fetch to hit an api to send orderid and base64Transaction in port request
    const result = await fetch("/api/processTransaction/", {
      method: "POST",
      body: JSON.stringify(
        snakecaseKeys(
          {
            orderId: orderId,
            transaction: base64Transaction
          },
          { deep: true }
        )
      ),
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        "Content-Type": "application/json",
      },
    });
    const { data,status,message } = await result.json();
    console.log('Response of Signing',data, 'status is ',status,message);
    if(status !== 200){
      try {
            const errorMessage = message.message || message.toString();
            const parsedError = JSON.parse(errorMessage.match(/{.*}/)[0]);
            let finalMessage;
            if (
              parsedError.InstructionError &&
              Array.isArray(parsedError.InstructionError)
            ) {
              const [index, instructionError] = parsedError.InstructionError;
              if (instructionError.Custom !== undefined) {
               finalMessage= idl.errors.find(error => error.code == instructionError.Custom)?.msg || "Unable to process transaction";
              }else{
                finalMessage = instructionError;
              }
              toast.error(`${finalMessage}`, {
                theme: "dark",
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: false,
                progress: undefined,
              });
              return null;
            }else{
              toast.error(`${parsedError || errorMessage}`, {
                theme: "dark",
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: false,
                progress: undefined,
              });
              return null;
            }
          } catch (parsingError) {
            toast.error(`${parsingError}`, {
              theme: "dark",
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: false,
              progress: undefined,
            });
          }
          return null;
    }else{
      toast.success(`Transaction Successful.`, {
        theme: "dark",
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        progress: undefined,
      });
      return data;
    }
    
  };

  const getWalletBalance = async (address: string) => {
    if (!connection) return null;
    const balance = await connection.getBalance(new PublicKey(address));
    return balance/1e9;
  };

  const getTokenBalance = async (address: string, tokenAddress: string) => {
    if (!shyft) return null;
    const balance = await shyft.wallet.getTokenBalance({
      token: tokenAddress,
      wallet: address,
    });
    return balance.balance;
  };

  const getAllTokenBalance = async (address: string) => {
    if (!shyft) return null;
    const balance = await shyft.wallet.getAllTokenBalance({ wallet: address });
    return balance;
  };

  const getAccountInfo = async (address: string) => {
    if (!connection) return null;
    
    const accountInfo = await connection.getAccountInfo(
      new PublicKey(address)
    );
    return accountInfo;
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