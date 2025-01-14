/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import useLocalSolana from './useLocalSolana';
import useShyft from './useShyft';
import { TokenBalance } from '@shyft-to/js';

/**
 * Custom hook to fetch and monitor all token balances for a Solana address
 * @param address - The Solana wallet address to check balances for
 * @param watch - If true, polls for balance updates every 8 seconds
 * @param refreshTrigger - Increment this value to force a balance refresh
 */
export const useAllTokenBalance = (
  address: string, 
  watch = false,
  refreshTrigger = 0
) => {
  const [balances, setBalances] = useState<TokenBalance[] | null>(null);
  const [loadingBalance, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const fetchInProgress = useRef(false);
  
  const {connection} = useLocalSolana();
  const {shyft, getAllTokenBalance} = useShyft();

  // Memoized fetch function
  const fetchBalance = useCallback(async () => {
    // Early return if missing required params
    if (!address) {
      console.debug("[useAllTokenBalance] Missing address");
      setError("Missing address");
      setLoading(false);
      return;
    }

    // Early return if Shyft not ready
    if (!shyft) {
      console.debug("[useAllTokenBalance] Waiting for Shyft...");
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
  }, [address, getAllTokenBalance, shyft]);

  // Effect for initial fetch and polling
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

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

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [watch, refreshTrigger, fetchBalance]);

  return { balances, loadingBalance, error };
};