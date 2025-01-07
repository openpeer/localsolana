/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import useLocalSolana from './useLocalSolana';
import useShyft from './useShyft';
import { useInitialization } from './useInitialization';

/**
 * Custom hook to fetch and monitor SOL or token balances for a Solana address.
 * @param address - The Solana wallet address to check the balance for
 * @param tokenAddress - The token's mint address. Use PublicKey.default.toBase58() for SOL balance
 * @param watch - If true, polls for balance updates every 8 seconds
 * @param refreshTrigger - Increment this value to force a balance refresh
 * @param contractAddress - The contract address used to check initialization state
 */
export const useBalance = (
  address: string,
  tokenAddress: string,
  watch = false,
  refreshTrigger = 0,
  contractAddress: string
) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fetchInProgress = useRef(false);
  
  // Get initialization state
  const { isReady, error: initError } = useInitialization(contractAddress);
  
  // Use refs to prevent dependency changes from triggering re-renders
  const connectionRef = useRef<Connection | null>(null);
  const {connection} = useLocalSolana();
  const {getTokenBalance, getWalletBalance} = useShyft();

  // Update connection ref when it changes
  useEffect(() => {
    if (connection !== connectionRef.current) {
      connectionRef.current = connection;
    }
  }, [connection]);

  // Memoized fetch function that uses refs instead of direct dependencies
  const fetchBalance = useCallback(async () => {
    // Don't fetch if system isn't ready
    if (!isReady) {
      console.debug("[useBalance] System not ready, skipping fetch");
      return;
    }

    const currentConnection = connectionRef.current;

    // Early return if missing required params
    if (!address || !tokenAddress) {
      console.debug("[useBalance] Missing required parameters:", { address, tokenAddress });
      setError("Missing address or token address");
      setLoading(false);
      return;
    }

    // Early return if no connection
    if (!currentConnection) {
      console.debug("[useBalance] Waiting for connection...");
      setLoading(true);
      return;
    }

    // Prevent concurrent requests
    if (fetchInProgress.current) {
      console.debug("[useBalance] Already fetching balance, skipping");
      return;
    }

    try {
      fetchInProgress.current = true;
      setLoading(true);
      setError(null);

      console.debug("[useBalance] Fetching balance for address:", address, "token:", tokenAddress);
      
      const publicKey = new PublicKey(address);
      
      if (tokenAddress === PublicKey.default.toBase58()) {
        console.debug("[useBalance] Fetching SOL balance");
        const solBalance = await getWalletBalance(address);
        console.debug("[useBalance] Raw SOL balance:", solBalance);
        
        if (solBalance === null) {
          throw new Error("Failed to fetch SOL balance");
        }

        const accountInfo = await currentConnection.getAccountInfo(publicKey);
        if (!accountInfo) {
          throw new Error('Account not found or invalid');
        }

        const rentExemptAmount = await currentConnection.getMinimumBalanceForRentExemption(
          accountInfo.data.length
        );

        const usableBalance = (solBalance - rentExemptAmount/1e9);
        setBalance(usableBalance < 0 ? 0 : usableBalance);
        setError(null);
      } else {
        console.debug("[useBalance] Fetching token balance");
        const tokenBalance = await getTokenBalance(address, tokenAddress);
        console.debug("[useBalance] Token balance result:", tokenBalance);
        
        if (tokenBalance === null) {
          throw new Error("Failed to fetch token balance");
        }
        
        setBalance(tokenBalance);
        setError(null);
      }
    } catch (err: any) {
      console.error("[useBalance] Error fetching balance:", err);
      setError(err.message);
      setBalance(null);
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, [address, tokenAddress, getTokenBalance, getWalletBalance, isReady]);

  // Effect for initial fetch and polling
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    // Only proceed if system is ready
    if (isReady) {
      console.debug("[useBalance] System ready, starting balance fetching");
      
      // Initial fetch
      if (!fetchInProgress.current) {
        fetchBalance();
      }

      // Setup polling if watch is true
      if (watch) {
        pollInterval = setInterval(() => {
          if (!fetchInProgress.current) {
            fetchBalance();
          }
        }, 8000);
      }
    } else {
      console.debug("[useBalance] System not ready, waiting...");
      setError(initError);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [isReady, watch, refreshTrigger, fetchBalance, initError]);

  return { balance, loadingBalance, error };
};