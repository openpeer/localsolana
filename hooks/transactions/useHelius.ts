// hooks/transactions/useHelius.ts

import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isSolanaWallet } from "@dynamic-labs/solana-core";
import { Connection, PublicKey, Transaction, TransactionSignature, SendOptions, Signer, Keypair } from "@solana/web3.js";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { CURRENT_NETWORK_URL } from "utils";
import { Helius } from "helius-sdk";
import useLocalSolana from "./useLocalSolana";
import { feePayer } from "@/utils/constants";

/**
 * Custom hook for interacting with the Helius SDK and Solana blockchain
 * Provides methods for transaction handling, balance queries, and account information
 * @returns Object containing Helius instance and utility methods
 */
const useHelius = () => {
  // State management for Helius SDK instance
  const [helius, setHelius] = useState<Helius | null>(null);
  // Get Dynamic wallet context for user interactions
  const { primaryWallet } = useDynamicContext();
  // Get local Solana connection and program interfaces
  const { idl, connection } = useLocalSolana();

  /**
   * Initialize Helius SDK on component mount
   * Sets up the SDK with API key from environment variables
   */
  useEffect(() => {
    const initializeHelius = () => {
      const apiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
      if (!apiKey) {
        throw new Error("Helius API key not found");
      }
      const heliusInstance = new Helius(apiKey);
      setHelius(heliusInstance);
    };

    initializeHelius();
  }, []);

  /**
   * Send a transaction using Helius smart transactions
   * Handles local signing if required and manages transaction confirmation
   * @param transaction - The transaction to send
   * @param localSignRequired - Whether the transaction needs local signing
   * @returns Transaction signature if successful
   */
  const sendTransaction = async (
    transaction: Transaction,
    localSignRequired: boolean
  ) => {
    if (!helius) {
      throw new Error("Helius SDK not initialized");
    }
    if (!feePayer) {
      throw new Error("Fee payer is not set in env");
    }

    // Setup transaction with recent blockhash and fee payer
    const connection = new Connection(CURRENT_NETWORK_URL);
    const recentBlockhash = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = recentBlockhash.blockhash;
    transaction.feePayer = new PublicKey(feePayer);
    
    let signedTransaction;
    let signers: Signer[] = [];

    // Handle local signing if required (e.g., for user transactions)
    if (localSignRequired) {
      if (!primaryWallet || !isSolanaWallet(primaryWallet)) {
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

    // Create feePayer keypair and add to signers
    const feePayerKeypair = Keypair.generate();
    signers.push(feePayerKeypair);

    try {
      // Send transaction using Helius smart transactions
      const txSignature = await helius.rpc.sendSmartTransaction(
        signedTransaction.instructions,
        signers,
        [], // lookupTables - empty array as default
        {
          skipPreflight: true, // Skip preflight for faster processing
          maxRetries: 3,      // Retry up to 3 times if failed
          feePayer: feePayerKeypair,
          lastValidBlockHeightOffset: 150 // Blocks until transaction expires
        }
      );

      if (txSignature) {
        await connection.confirmTransaction(txSignature, "confirmed");
        return txSignature;
      }
    } catch (error: any) {
      // Handle and parse transaction errors
      try {
        const errorMessage = error.message || error.toString();
        const parsedError = JSON.parse(errorMessage.match(/{.*}/)[0]);

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
            idl.errors[instructionError.custom];
          }
        }
      } catch (parsingError) {
        console.error("Failed to parse error message:", parsingError);
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
      }
    }
  };

  /**
   * Get SOL balance for a specific wallet address
   * @param address - The wallet address to check
   * @returns Balance in lamports or null if error
   */
  const getWalletBalance = async (address: string) => {
    if (!helius) return null;
    try {
      const connection = new Connection(CURRENT_NETWORK_URL);
      const balance = await connection.getBalance(new PublicKey(address));
      return balance;
    } catch (error) {
      console.error("Error getting wallet balance:", error);
      return null;
    }
  };

  /**
   * Get token balance for a specific token and wallet address
   * @param address - The wallet address to check
   * @param tokenAddress - The token's mint address
   * @returns Object containing balance and decimals
   */
  const getTokenBalance = async (address: string, tokenAddress: string) => {
    if (!helius) return null;
    try {
      const response = await helius.rpc.searchAssets({
        ownerAddress: address,
        tokenType: "fungible" as const,
        grouping: ["collection", tokenAddress],
        page: 1,
        limit: 1
      });
      
      return {
        balance: response.items[0]?.token_info?.balance || 0,
        decimals: response.items[0]?.token_info?.decimals || 0,
      };
    } catch (error) {
      console.error("Error getting token balance:", error);
      return { balance: 0, decimals: 0 };
    }
  };

  /**
   * Get all token balances for a wallet address
   * @param address - The wallet address to check
   * @returns Array of token balances with metadata
   */
  const getAllTokenBalance = async (address: string) => {
    if (!helius) return null;
    try {
      const response = await helius.rpc.searchAssets({
        ownerAddress: address,
        tokenType: "fungible" as const,
        page: 1,
        limit: 1000
      });
      
      return response.items.map(item => ({
        balance: item.token_info?.balance || 0,
        decimals: item.token_info?.decimals || 0,
        mint: item.id,
        tokenName: item.content?.metadata?.name || '',
        symbol: item.content?.metadata?.symbol || '',
      }));
    } catch (error) {
      console.error("Error getting all token balances:", error);
      return [];
    }
  };

  /**
   * Get raw account information for any Solana address
   * @param address - The account address to query
   * @returns Account info or null if error/not found
   */
  const getAccountInfo = async (address: string) => {
    if (!helius) return null;
    try {
      const connection = new Connection(CURRENT_NETWORK_URL);
      return await connection.getAccountInfo(new PublicKey(address));
    } catch (error) {
      console.error("Error getting account info:", error);
      return null;
    }
  };

  // Return hook interface with all methods and state
  return {
    helius,              // Raw Helius SDK instance
    connection,          // Solana RPC connection
    sendTransaction,     // Send and confirm transactions
    getWalletBalance,    // Get SOL balance
    getTokenBalance,     // Get specific token balance
    getAllTokenBalance,  // Get all token balances
    getAccountInfo,      // Get account information
  };
};

export default useHelius;