// hooks/transactions/useHelius.ts

import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isSolanaWallet } from "@dynamic-labs/solana-core";
import { 
  Connection, 
  PublicKey, 
  Transaction, 
  Commitment,
  SendOptions,
  Signer
} from "@solana/web3.js";
import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import { CURRENT_NETWORK_URL } from "utils";
import { Helius } from "helius-sdk";
import useLocalSolana from "./useLocalSolana";

/**
 * Interface for Dynamic wallet integration with Solana capabilities
 * @property getSigner - Returns a signer object that can sign transactions
 * @property publicKey - The wallet's public key string
 */
interface SolanaWallet {
  getSigner: () => Promise<any>;
  publicKey?: string;
}

// Cache connection instance
let cachedConnection: Connection | null = null;

/**
 * Custom hook for interacting with the Helius SDK and Solana blockchain
 * Provides optimized methods for transaction handling, balance queries, and account information
 * Implements connection caching and secure transaction processing
 * @returns Object containing Helius instance and utility methods
 */
const useHelius = () => {
  const [helius, setHelius] = useState<Helius | null>(null);
  const { primaryWallet } = useDynamicContext();
  const { idl, connection: localConnection } = useLocalSolana();
  
  // Use ref to store connection to prevent recreation
  const connectionRef = useRef<Connection | null>(null);

  useEffect(() => {
    const initializeHelius = () => {
      const apiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
      if (!apiKey) {
        throw new Error("Helius API key not found");
      }
      
      // Initialize cached connection if needed
      if (!cachedConnection) {
        cachedConnection = new Connection(CURRENT_NETWORK_URL, {
          commitment: 'confirmed',
          confirmTransactionInitialTimeout: 60000
        });
      }
      connectionRef.current = cachedConnection;

      const heliusInstance = new Helius(apiKey);
      setHelius(heliusInstance);
    };

    initializeHelius();

    // Cleanup
    return () => {
      connectionRef.current = null;
    };
  }, []);

  /**
   * Validates a Solana address format
   * @param address - The address string to validate
   * @returns boolean indicating if address is valid
   * @private internal helper function
   */
  const validateAddress = (address: string): boolean => {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  };

/**
 * Gets cached Solana connection or throws if uninitialized
 * @returns Connection instance for interacting with the Solana network
 * @throws Error if connection not initialized
 * @private internal helper function
 */
  const getConnection = (): Connection => {
    if (!connectionRef.current) {
      throw new Error("Connection not initialized");
    }
    return connectionRef.current;
  };

  /**
   * Send and confirm a transaction with retry logic and configurable options
   * @param transaction - The transaction to send
   * @param localSignRequired - Whether the transaction needs user wallet signing
   * @param options - Optional configuration {commitment, maxRetries, skipPreflight}
   * @returns Transaction signature if successful
   * @throws Error on failed transaction, wallet connection issues, missing public key, or max retries exceeded
   */
  const sendTransaction = async (
    transaction: Transaction,
    localSignRequired: boolean,
    options: {
      commitment?: Commitment;
      maxRetries?: number;
      skipPreflight?: boolean;  
    } = {}
  ) => {
    if (!helius) throw new Error("Helius SDK not initialized");
    if (!primaryWallet || !isSolanaWallet(primaryWallet)) {
      throw new Error("Wallet not connected or not a Solana wallet");
    }
  
    const signer = await primaryWallet.getSigner();
    if (!signer.publicKey) throw new Error("Wallet public key not available");
    
    const publicKey = new PublicKey(signer.publicKey.toString());
    transaction.feePayer = publicKey;
    
    const connection = getConnection();
    
    const {
      commitment = 'confirmed',
      maxRetries = 3,
      skipPreflight = false
    } = options;
  
    let retries = 0;
    while (retries < maxRetries) {
      try {
        const recentBlockhash = await connection.getLatestBlockhash(commitment);
        transaction.recentBlockhash = recentBlockhash.blockhash;
        
        let signedTransaction;
        if (localSignRequired) {
          if (!primaryWallet || !isSolanaWallet(primaryWallet)) {
            throw new Error("Wallet not connected");
          }
          
          signedTransaction = await signer.signTransaction(transaction);
          
          if (!signedTransaction) {
            throw new Error("Failed to sign transaction");
          }
        } else {
          signedTransaction = transaction;
        }
  
        const txSignature = await connection.sendRawTransaction(
          signedTransaction.serialize(),
          {
            skipPreflight,
            preflightCommitment: commitment,
          }
        );
  
        await connection.confirmTransaction({
          signature: txSignature, 
          blockhash: recentBlockhash.blockhash,
          lastValidBlockHeight: recentBlockhash.lastValidBlockHeight
        });
  
        return txSignature;

      } catch (error: any) {
        retries++;
        if (retries === maxRetries) {
          console.error("Transaction failed after max retries:", error);
          
          // Parse and map error
          const errorCode = error?.code || 'unknown';
          const errorMap: Record<string, string> = {
            'AccountNotFound': 'Account not found',
            'InsufficientFunds': 'Insufficient funds',
            // Add more error mappings
          };

          const errorMessage = errorMap[errorCode] || error.message || 'Transaction failed';
          toast.error(errorMessage);
          throw error;
        }
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
      }
    }
  };

  /**
   * Get SOL balance for a Solana address with validation
   * @param address - The wallet address to check
   * @returns Balance in lamports or null if error
   * @throws Error if address invalid
   */
  const getWalletBalance = async (address: string) => {
    if (!validateAddress(address)) throw new Error("Invalid address");
    if (!helius) return null;

    try {
      const connection = getConnection();
      return await connection.getBalance(new PublicKey(address));
    } catch (error) {
      console.error("Error getting wallet balance:", error);
      return null;
    }
  };

  /**
   * Get specific token balance and info for a wallet address
   * @param address - The wallet address to check 
   * @param tokenAddress - The token's mint address
   * @returns Object containing balance and decimals or null
   * @throws Error if addresses invalid
   */
  const getTokenBalance = async (address: string, tokenAddress: string) => {
    if (!validateAddress(address) || !validateAddress(tokenAddress)) {
      throw new Error("Invalid address");
    }
    if (!helius) return null;

    try {
      const response = await helius.rpc.searchAssets({
        ownerAddress: address,
        tokenType: "fungible",
        grouping: ["collection", tokenAddress],
        page: 1,
        limit: 1
      });

      console.log("Full token response:", JSON.stringify(response, null, 2));

      // Try without grouping first
      const alternateResponse = await helius.rpc.searchAssets({
        ownerAddress: address,
        tokenType: "fungible",
        page: 1,
        limit: 1000
      });

      // Find specific token
      const token = alternateResponse.items.find(item => item.id === tokenAddress);
      console.log("Found token:", token);
      
      return {
        balance: token?.token_info?.balance || 0,
        decimals: token?.token_info?.decimals || 0
      };
    } catch (error) {
      console.error("Error getting token balance:", error);
      return { balance: 0, decimals: 0 };
    }
  };

/**
 * Get all token balances and metadata for a wallet address using batching or pagination
 * @param address - The wallet address to check
 * @param batchSize - Number of items per batch (default: 1000)
 * @returns Array of token data including balances, metadata, and USD values
 * @throws Error if address is invalid
 */
const getAllTokenBalances = async (address: string, batchSize: number = 1000) => {
  if (!validateAddress(address)) throw new Error("Invalid address");
  if (!helius) return null;

  try {
      let allTokens: any[] = [];
      let currentPage = 1;

      while (true) {
          // Fetch a batch of token balances
          const response = await helius.rpc.searchAssets({
              ownerAddress: address,
              tokenType: "fungible",
              page: currentPage,
              limit: batchSize,
          });

          // Merge the current batch into the allTokens array
          allTokens = [...allTokens, ...response.items];

          // If the number of items returned is less than the batch size, we've reached the end
          if (response.items.length < batchSize) break;

          // Increment the page for the next batch
          currentPage++;
      }

      // Transform the combined results into the desired format
      return allTokens.map(item => ({
          balance: item.token_info?.balance || 0,
          decimals: item.token_info?.decimals || 0,
          mint: item.id,
          tokenName: item.content?.metadata?.name || '',
          symbol: item.content?.metadata?.symbol || '',
          usdValue: item.token_info?.price_info?.total_price || 0,
      }));
  } catch (error) {
      console.error("Error getting all token balances with batching:", error);
      return [];
  }
};


  /**
   * Get raw account information for any Solana address
   * @param address - The account address to query
   * @returns AccountInfo object or null if error/not found
   * @throws Error if address invalid
   */
  const getAccountInfo = async (address: string) => {
    if (!validateAddress(address)) throw new Error("Invalid address");
    if (!helius) return null;

    try {
      const connection = getConnection();
      const info = await connection.getAccountInfo(new PublicKey(address));
      console.log("Account info response:", info); // Added debug log
      return info;
    } catch (error) {
      console.error("Error getting account info:", error);
      return null;
    }
  };

  return {
    helius,
    connection: connectionRef.current,
    sendTransaction,
    getWalletBalance,
    getTokenBalance, 
    getAllTokenBalances,
    getAccountInfo
  };
};

export default useHelius;