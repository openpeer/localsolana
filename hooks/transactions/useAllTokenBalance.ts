/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import useLocalSolana from './useLocalSolana';
import useShyft from './useShyft';
import { TokenBalance } from '@shyft-to/js';
import { useInitialization } from './useInitialization';

/**
 * Custom hook to fetch and monitor all token balances for a Solana address
 * @param address - The Solana wallet address to check balances for
 * @param watch - If true, polls for balance updates every 8 seconds
 * @param refreshTrigger - Increment this value to force a balance refresh
 * @param contractAddress - The contract address used to check initialization state
 */
export const useAllTokenBalance = (
  address: string, 
  watch = false,
  refreshTrigger = 0,
  contractAddress: string
) => {
  const [balances, setBalances] = useState<TokenBalance[] | null>(null);
  const [loadingBalance, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fetchInProgress = useRef(false);
  
  // Get initialization state
  const { isReady, error: initError } = useInitialization(contractAddress);
  
  // Use refs to prevent dependency changes from triggering re-renders
  const connectionRef = useRef<Connection | null>(null);
  const {connection} = useLocalSolana();
  const {getAllTokenBalance} = useShyft();

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
      console.debug("[useAllTokenBalance] System not ready, skipping fetch");
      return;
    }

    const currentConnection = connectionRef.current;

    // Early return if missing required params
    if (!address) {
      console.debug("[useAllTokenBalance] Missing address");
      setError("Missing address");
      setLoading(false);
      return;
    }

    // Early return if no connection
    if (!currentConnection) {
      console.debug("[useAllTokenBalance] Waiting for connection...");
      setLoading(true);
      return;
    }

    // Prevent concurrent requests
    if (fetchInProgress.current) {
      console.debug("[useAllTokenBalance] Already fetching balances, skipping");
      return;
    }

    try {
      fetchInProgress.current = true;
      setLoading(true);
      setError(null);

      console.debug("[useAllTokenBalance] Fetching balances for address:", address);
      const balance = await getAllTokenBalance(address);
      console.debug("[useAllTokenBalance] Token balances:", balance);
      
      // Only update state if we got valid balances
      if (balance) {
        setBalances(balance);
        setError(null);
      } else {
        setError("No balance data received");
        setBalances(null);
      }
    } catch (err: any) {
      console.error("[useAllTokenBalance] Error fetching balances:", err);
      setError(err.message);
      setBalances(null);
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, [address, getAllTokenBalance, isReady]);

  // Effect for initial fetch and polling
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    // Only proceed if system is ready
    if (isReady) {
      console.debug("[useAllTokenBalance] System ready, starting balance fetching");
      
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
      console.debug("[useAllTokenBalance] System not ready, waiting...");
      setError(initError);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [isReady, watch, refreshTrigger, fetchBalance, initError]);

  return { balances, loadingBalance, error };
};