import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isSolanaWallet } from "@dynamic-labs/solana-core";
import { 
  PublicKey, 
  Transaction, 
  Commitment,
} from "@solana/web3.js";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Helius } from "helius-sdk";
import { NEXT_PUBLIC_SOLANA_RPC, NEXT_PUBLIC_BLOCK_EXPLORER_URL, NEXT_PUBLIC_SOLANA_NETWORK } from 'utils';
import { useConnection } from '@/contexts/ConnectionContext';

// Interfaces
interface TokenInfo {
  balance: number;
  decimals: number;
  mint: string;
  tokenName: string;
  symbol: string;
  usdValue: number;
}

interface TransactionOptions {
  commitment?: Commitment;
  maxRetries?: number;
  skipPreflight?: boolean;
  simulation?: boolean;
}

// Cache implementation
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

const getFromCache = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setInCache = (key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// Error mapping
const ERROR_MAP: Record<string, string> = {
  'AccountNotFound': 'Account not found',
  'InsufficientFunds': 'Insufficient funds',
  'InvalidAddress': 'Invalid wallet address',
  'SignatureRequestDenied': 'Transaction signing rejected',
  'TransactionExpired': 'Transaction expired - please try again',
  'WalletConnectionError': 'Please connect your wallet',
  'RpcError': 'Network error - please try again',
  'SimulationFailed': 'Transaction simulation failed',
  'InvalidInstruction': 'Invalid transaction instruction',
  'BlockhashNotFound': 'Network congestion - please try again'
};

const useHelius = () => {
  const [helius, setHelius] = useState<Helius | null>(null);
  const { primaryWallet } = useDynamicContext();
  const [isConnectionReady, setIsConnectionReady] = useState(false);
  const { getConnection } = useConnection();

  useEffect(() => {
    const initializeHelius = async () => {
      const apiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
      if (!apiKey) {
        console.error("Missing Helius API key");
        toast.error("Helius API configuration error");
        return;
      }
    
      try {
        // Test connection
        const connection = getConnection();
        await connection.getLatestBlockhash();
        
        const heliusInstance = new Helius(apiKey);
        setHelius(heliusInstance);
        setIsConnectionReady(true);
      } catch (error) {
        console.error("Failed to initialize Helius:", error);
        toast.error("Failed to connect to Solana network");
      }
    };
  
    initializeHelius();
  
    return () => {
      setIsConnectionReady(false);
      cache.clear();
    };
  }, [getConnection]);

  const validateAddress = (address: string): boolean => {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  };

  const sendTransaction = async (
    transaction: Transaction,
    localSignRequired: boolean,
    options: TransactionOptions = {}
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
      skipPreflight = false,
      simulation = true
    } = options;
  
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        if (simulation) {
          const sim = await connection.simulateTransaction(transaction);
          if (sim.value.err) {
            throw new Error(`Transaction simulation failed: ${sim.value.err}`);
          }
        }

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
            maxRetries: 3
          }
        );
  
        await connection.confirmTransaction({
          signature: txSignature,
          blockhash: recentBlockhash.blockhash,
          lastValidBlockHeight: recentBlockhash.lastValidBlockHeight
        });
  
        toast.success("Transaction confirmed");
        return txSignature;

      } catch (error: any) {
        retries++;
        if (retries === maxRetries) {
          console.error("Transaction failed after max retries:", error);
          const errorCode = error?.code || 'unknown';
          const errorMessage = ERROR_MAP[errorCode] || error.message || 'Transaction failed';
          toast.error(errorMessage);
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
      }
    }
  };

  const getWalletBalance = async (address: string) => {
    if (!validateAddress(address)) throw new Error("Invalid address");
    if (!helius) return null;

    const cacheKey = `balance-${address}`;
    const cached = getFromCache(cacheKey);
    if (cached !== null) return cached;

    try {
      const connection = getConnection();
      const balance = await connection.getBalance(new PublicKey(address));
      setInCache(cacheKey, balance);
      return balance;
    } catch (error) {
      console.error("Error getting wallet balance:", error);
      return null;
    }
  };

  const getTokenBalance = async (address: string, tokenAddress: string): Promise<TokenInfo | null> => {
    if (!validateAddress(address) || !validateAddress(tokenAddress)) {
      throw new Error("Invalid address");
    }
    if (!helius) return null;

    const cacheKey = `token-${address}-${tokenAddress}`;
    const cached = getFromCache(cacheKey);
    if (cached !== null) return cached;

    try {
      const response = await helius.rpc.searchAssets({
        ownerAddress: address,
        tokenType: "fungible",
        page: 1,
        limit: 1000
      });

      const token = response.items.find(item => item.id === tokenAddress);
      
      if (!token) return null;

      const tokenInfo: TokenInfo = {
        balance: token.token_info?.balance || 0,
        decimals: token.token_info?.decimals || 0,
        mint: token.id,
        tokenName: token.content?.metadata?.name || '',
        symbol: token.content?.metadata?.symbol || '',
        usdValue: token.token_info?.price_info?.total_price || 0
      };

      setInCache(cacheKey, tokenInfo);
      return tokenInfo;
    } catch (error) {
      console.error("Error getting token balance:", error);
      return null;
    }
  };

  const getAllTokenBalances = async (address: string, batchSize: number = 1000): Promise<TokenInfo[]> => {
    if (!validateAddress(address)) throw new Error("Invalid address");
    if (!helius) return [];

    const cacheKey = `all-tokens-${address}`;
    const cached = getFromCache(cacheKey);
    if (cached !== null) return cached;

    try {
      let allTokens: any[] = [];
      let currentPage = 1;

      while (true) {
        const response = await helius.rpc.searchAssets({
          ownerAddress: address,
          tokenType: "fungible",
          page: currentPage,
          limit: batchSize,
        });

        allTokens = [...allTokens, ...response.items];

        if (response.items.length < batchSize) break;
        currentPage++;
      }

      const tokenInfos: TokenInfo[] = allTokens.map(item => ({
        balance: item.token_info?.balance || 0,
        decimals: item.token_info?.decimals || 0,
        mint: item.id,
        tokenName: item.content?.metadata?.name || '',
        symbol: item.content?.metadata?.symbol || '',
        usdValue: item.token_info?.price_info?.total_price || 0,
      }));

      setInCache(cacheKey, tokenInfos);
      return tokenInfos;
    } catch (error) {
      console.error("Error getting all token balances:", error);
      return [];
    }
  };

  const getAccountInfo = async (address: string) => {
    if (!validateAddress(address)) throw new Error("Invalid address");
    if (!helius) return null;

    const cacheKey = `account-${address}`;
    const cached = getFromCache(cacheKey);
    if (cached !== null) return cached;

    try {
      const connection = getConnection();
      const info = await connection.getAccountInfo(new PublicKey(address));
      if (info) setInCache(cacheKey, info);
      return info;
    } catch (error) {
      console.error("Error getting account info:", error);
      return null;
    }
  };

  const getConnectionDetails = () => ({
    network: NEXT_PUBLIC_SOLANA_NETWORK,
    blockExplorer: NEXT_PUBLIC_BLOCK_EXPLORER_URL,
    rpcEndpoint: NEXT_PUBLIC_SOLANA_RPC
  });

  return {
    helius,
    sendTransaction,
    getWalletBalance,
    getTokenBalance, 
    getAllTokenBalances,
    getAccountInfo,
    getConnectionDetails,
    getConnection,
    isConnectionReady,
  };
};

export default useHelius;