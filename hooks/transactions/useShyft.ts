import { getAuthToken, useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isSolanaWallet } from "@dynamic-labs/solana-core";
// import { Network, ShyftSdk } from "@shyft-to/js";
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionSignature,
} from "@solana/web3.js";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { BLOCK_EXPLORER } from "utils";
import useLocalSolana from "./useLocalSolana";
import { feePayer } from "@/utils/constants";
import snakecaseKeys from "snakecase-keys";
import idl from '@/idl/local_solana_migrate.json';
import { logShyftOperation } from "@/utils/shyftLogger";

const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.mainnet-beta.solana.com";
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Cache implementation
const CACHE_DURATION = 10000; // 10 seconds
const DEBOUNCE_DURATION = 2000; // 2 seconds
const balanceCache = new Map<string, { balance: number; timestamp: number }>();
const pendingRequests = new Map<string, Promise<number>>();

const getCachedBalance = async (
  connection: Connection,
  address: string,
  tokenAddress?: string
): Promise<number> => {
  const key = `${address}-${tokenAddress || 'SOL'}`;
  const cached = balanceCache.get(key);
  
  // Return cached value if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.balance;
  }

  // Check if there's already a pending request for this key
  const pendingRequest = pendingRequests.get(key);
  if (pendingRequest) {
    return pendingRequest;
  }

  // Create new request
  const fetchPromise = (async () => {
    let balance: number;
    
    if (!tokenAddress || tokenAddress === PublicKey.default.toBase58()) {
      // Get SOL balance using RPC
      balance = await connection.getBalance(new PublicKey(address));
      balance = balance / 1e9; // Convert lamports to SOL
    } else {
      try {
        // Get token account
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          new PublicKey(address),
          { mint: new PublicKey(tokenAddress) }
        );
        
        // Get balance from the first account that matches the token
        balance = tokenAccounts.value[0]?.account.data.parsed.info.tokenAmount.uiAmount || 0;
      } catch (error) {
        console.error("[useShyft] Error fetching token balance:", error);
        balance = 0;
      }
    }

    // Cache the result
    balanceCache.set(key, { balance, timestamp: Date.now() });
    
    // Remove from pending requests after a debounce period
    setTimeout(() => {
      pendingRequests.delete(key);
    }, DEBOUNCE_DURATION);

    return balance;
  })();

  // Store the pending request
  pendingRequests.set(key, fetchPromise);
  
  return fetchPromise;
};

// Helper function to convert string network to ShyftSdk Network enum
// const getShyftNetwork = (network: string): Network => {
//   switch (network.toLowerCase()) {
//     case "mainnet-beta":
//     case "mainnet":
//       return Network.Mainnet;
//     case "devnet":
//       return Network.Devnet;
//     case "testnet":
//       return Network.Testnet;
//     default:
//       return Network.Devnet; // Default to devnet if unknown
//   }
// };

const useShyft = () => {
  // const [shyft, setShyft] = useState<ShyftSdk | null>(null);
  const { primaryWallet } = useDynamicContext();
  const { provider, program, idl, connection: localSolanaConnection } = useLocalSolana();
  const [connection, setConnection] = useState<Connection | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // 1) Grab environment variables directly
  // const SHYFT_API_KEY = process.env.NEXT_PUBLIC_SHYFT_API_KEY;
  // Provide a default fallback for safety
  const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "mainnet-beta";

  // Initialize connection with retry logic
  useEffect(() => {
    let mounted = true;
    let retryTimeout: NodeJS.Timeout;

    const initConnection = async () => {
      try {
        console.debug("[useShyft] Initializing connection to:", SOLANA_RPC_URL);
        const conn = new Connection(SOLANA_RPC_URL, {
          commitment: 'confirmed',
          confirmTransactionInitialTimeout: 60000
        });

        // Test connection
        await conn.getVersion();
        
        if (mounted) {
          console.debug("[useShyft] Connection established successfully");
          setConnection(conn);
          setIsInitializing(false);
        }
      } catch (err) {
        console.error("[useShyft] Failed to initialize connection:", err);
        
        if (mounted) {
          console.error("[useShyft] Using fallback connection.");
          setConnection(localSolanaConnection);
          setIsInitializing(false);
        }
      }
    };

    if (!connection) {
      initConnection();
    }

    return () => {
      mounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [connection, localSolanaConnection]);

  // useEffect(() => {
  //   console.debug("[useShyft] Running effect to initialize Shyft. SOLANA_NETWORK:", SOLANA_NETWORK);
  //   const initializeShyft = async () => {
  //     try {
  //       if(!SHYFT_API_KEY){
  //         throw new Error("Error Initializing signer: No SHYFT_API_KEY found");
  //       }

  //       const shyftInstance = new ShyftSdk({
  //         apiKey: SHYFT_API_KEY,
  //         network: getShyftNetwork(SOLANA_NETWORK),
  //       });
  //       setShyft(shyftInstance);
  //     } catch (err) {
  //       console.error("[useShyft] Error in initializeShyft:", err);
  //     }
  //   };

  //   initializeShyft();
  // }, [SHYFT_API_KEY, SOLANA_NETWORK]);

  const sendTransactionWithShyft = async (
    transaction: Transaction,
    localSignRequired: boolean,
    orderId?: string
  ) => {
    logShyftOperation('sendTransaction', {
      orderId,
      localSignRequired,
      network: SOLANA_NETWORK
    });

    // console.debug("[useShyft] sendTransactionWithShyft called. shyft:", shyft);
    // if(!shyft){
    //   console.error("[useShyft] Shyft is null or undefined. Throwing error now...");
    //   throw new Error("Shyft not initialized");
    // }
    if (!feePayer) {
      throw new Error("Fee payer is not set in env");
    }
    const connection = new Connection(SOLANA_RPC_URL);
    const recentBlockhash = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = recentBlockhash.blockhash;
    transaction.feePayer = new PublicKey(feePayer);

    // Simulate transaction before signing
    console.debug("[useShyft] Simulating transaction before signing");
    try {
      const simulation = await connection.simulateTransaction(transaction);
      console.debug("[useShyft] Simulation result:", simulation);
      
      if (simulation.value.err) {
        console.error("[useShyft] Transaction simulation failed:", simulation.value.err);
        throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
      }
    } catch (simError) {
      console.error("[useShyft] Error during transaction simulation:", simError);
      throw simError;
    }

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

  const getWalletBalance = async (address: string): Promise<number> => {
    logShyftOperation('getWalletBalance', { address });

    if (!connection) {
      console.error("[useShyft:getWalletBalance] No Solana connection is available");
      return 0;
    }

    try {
      return await getCachedBalance(connection, address);
    } catch (error) {
      console.error("[useShyft] Error fetching SOL balance:", error);
      return 0;
    }
  };

  const getTokenBalance = async (address: string, tokenAddress: string): Promise<number> => {
    logShyftOperation('getTokenBalance', { address, tokenAddress });

    if (!connection) {
      console.error("[useShyft:getTokenBalance] No Solana connection is available");
      return 0;
    }

    try {
      return await getCachedBalance(connection, address, tokenAddress);
    } catch (error) {
      console.error("[useShyft] Error fetching token balance:", error);
      return 0;
    }
  };

  const getAllTokenBalance = async (address: string) => {
    logShyftOperation('getAllTokenBalance', { address });

    if (!connection) {
      console.error("[useShyft:getAllTokenBalance] No Solana connection is available");
      return [];
    }

    try {
      // Get all token accounts
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        new PublicKey(address),
        { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
      );

      return tokenAccounts.value.map(account => ({
        address: account.pubkey.toBase58(),
        balance: account.account.data.parsed.info.tokenAmount.uiAmount,
        mint: account.account.data.parsed.info.mint,
        decimals: account.account.data.parsed.info.tokenAmount.decimals
      }));
    } catch (error) {
      console.error("[useShyft] Error fetching all token balances:", error);
      return [];
    }
  };

  const getAccountInfo = async (address: string) => {
    logShyftOperation('getAccountInfo', { address });

    if (!connection) return null;
    
    const accountInfo = await connection.getAccountInfo(
      new PublicKey(address)
    );
    return accountInfo;
  };

  return {
    // shyft,
    connection,
    isInitializing,
    sendTransactionWithShyft,
    getWalletBalance,
    getTokenBalance,
    getAllTokenBalance,
    getAccountInfo,
  };
};

export default useShyft;