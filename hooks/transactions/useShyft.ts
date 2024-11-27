import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
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
import { 
  NEXT_PUBLIC_SHYFT_API_KEY, 
  NEXT_PUBLIC_SOLANA_NETWORK,
  NEXT_PUBLIC_SHYFT_MAINNET_RPC
} from "utils";
import { feePayer } from "@/utils/constants";

const useShyft = () => {
  const [shyft, setShyft] = useState<ShyftSdk | null>(null);
  const [shyftConnection, setShyftConnection] = useState<Connection | null>(null);
  const { primaryWallet } = useDynamicContext();

  useEffect(() => {
    const initializeShyft = async () => {
      try {
        if (!NEXT_PUBLIC_SHYFT_API_KEY) {
          console.error("Shyft API key not configured");
          return;
        }
        if (!NEXT_PUBLIC_SOLANA_NETWORK) {
          console.error("Solana network not configured");
          return;
        }
        if (!NEXT_PUBLIC_SHYFT_MAINNET_RPC) {
          console.error("Shyft RPC URL not configured");
          return;
        }
  
        // Initialize Shyft SDK with proper network value
        const shyftInstance = new ShyftSdk({ 
          apiKey: NEXT_PUBLIC_SHYFT_API_KEY,
          network: Network.Mainnet
        });
  
        // Test the connection using the SDK method instead of raw fetch
        try {
          // Test with a simple wallet balance check using SDK
          await shyftInstance.wallet.getBalance({
            wallet: "11111111111111111111111111111111",
            network: Network.Mainnet
          });
  
          // Only set the instances if the health check passes
          const connection = new Connection(
            NEXT_PUBLIC_SHYFT_MAINNET_RPC,
            { commitment: 'confirmed' }
          );
          
          setShyftConnection(connection);
          setShyft(shyftInstance);

        } catch (healthError) {
          console.error("Failed health check:", healthError);
          toast.error("Failed to connect to Shyft network");
          return;
        }
  
      } catch (error) {
        console.error("Failed to initialize Shyft:", error);
        toast.error("Failed to initialize Shyft SDK");
      }
    };
  
    initializeShyft();
  }, []);

  const handleTransactionError = (error: any) => {
    try {
      const errorMessage = error.message || error.toString();
      const parsedError = JSON.parse(errorMessage.match(/{.*}/)[0]);

      if (parsedError.InstructionError && Array.isArray(parsedError.InstructionError)) {
        const [index, instructionError] = parsedError.InstructionError;
        if (instructionError.Custom !== undefined) {
          console.log(
            "This is an InstructionError with a custom error code:",
            instructionError.Custom
          );
          toast.error(`Transaction failed with error code: ${instructionError.Custom}`);
        }
      }
    } catch (parsingError) {
      console.error("Failed to parse error:", parsingError);
      toast.error(error.message || "Transaction failed", {
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
  };

  const sendTransactionWithShyft = async (
    transaction: Transaction,
    localSignRequired: boolean
  ) => {
    if (!shyft) {
      throw new Error("Shyft SDK not initialized");
    }
    if (!feePayer) {
      throw new Error("Fee payer is not set in env");
    }
    if (!shyftConnection) {
      throw new Error("Shyft connection not initialized");
    }

    const recentBlockhash = await shyftConnection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = recentBlockhash.blockhash;
    transaction.feePayer = new PublicKey(feePayer);
    let signedTransaction;

    if (localSignRequired) {
      if (!primaryWallet || !isSolanaWallet(primaryWallet)) {
        throw new Error("Solana wallet not connected");
      }
      try {
        signedTransaction = await (await primaryWallet.getSigner()).signTransaction(transaction);
        if (!signedTransaction) {
          throw new Error("Failed to sign transaction");
        }
      } catch (err: any) {
        throw new Error(`Signing error: ${err.message}`);
      }
    } else {
      signedTransaction = transaction;
    }

    const serializedTransaction = signedTransaction.serialize({
      requireAllSignatures: false,
      verifySignatures: true,
    });
    const base64Transaction = serializedTransaction.toString("base64");

    try {
      const signature = await shyft?.txnRelayer.sign({
        encodedTransaction: base64Transaction,
        network: NEXT_PUBLIC_SOLANA_NETWORK as Network,
      });

      if (signature && shyftConnection) {
        const txSignature: TransactionSignature = signature as TransactionSignature;
        await shyftConnection.confirmTransaction(txSignature, "confirmed");
        return txSignature;
      }
    } catch (error: any) {
      handleTransactionError(error);
    }
  };

  const getWalletBalance = async (address: string) => {
    if (!shyftConnection) {
      console.error("Shyft connection not initialized");
      return null;
    }

    const balance = await shyftConnection.getBalance(new PublicKey(address));
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
    if (!shyftConnection) {
      console.error("Shyft connection not initialized");
      return null;
    }
    const accountInfo = await shyftConnection.getAccountInfo(
      new PublicKey(address)
    );
    return accountInfo;
  };

  return {
    shyft,
    connection: shyftConnection,
    sendTransactionWithShyft,
    getWalletBalance,
    getTokenBalance,
    getAllTokenBalance,
    getAccountInfo,
  };
};

export default useShyft;