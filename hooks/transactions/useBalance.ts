// hooks/transactions/useBalance.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import useLocalSolana from './useLocalSolana';
import useShyft from './useShyft';

/**
 * Custom hook to fetch and monitor SOL or token balances for a Solana address.
 * @param address - The Solana wallet address to check the balance for
 * @param tokenAddress - The token's mint address. Use PublicKey.default.toBase58() for SOL balance
 * @param watch - If true, polls for balance updates every 8 seconds
 * @param refreshTrigger - Increment this value to force a balance refresh
 */
export const useBalance = (
  address: string,
  tokenAddress: string,
  watch = false,
  refreshTrigger = 0
) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const fetchInProgress = useRef(false);
  
  const {connection} = useLocalSolana();
  const {shyft, getTokenBalance, getWalletBalance} = useShyft();

  // Memoized fetch function
  const fetchBalance = useCallback(async () => {
    // Early return if missing required params
    if (!address || !tokenAddress) {
      console.debug("[useBalance] Missing required parameters:", { address, tokenAddress });
      setError("Missing address or token address");
      setLoading(false);
      return;
    }

    // Early return if Shyft not ready
    if (!shyft) {
      console.debug("[useBalance] Waiting for Shyft...");
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
      
      if (tokenAddress === PublicKey.default.toBase58()) {
        console.debug("[useBalance] Fetching SOL balance");
        const solBalance = await getWalletBalance(address);
        console.debug("[useBalance] Raw SOL balance:", solBalance);
        
        if (solBalance === null) {
          throw new Error("Failed to fetch SOL balance");
        }

        if (connection) {
          const publicKey = new PublicKey(address);
          const accountInfo = await connection.getAccountInfo(publicKey);
          if (accountInfo) {
            const rentExemptAmount = await connection.getMinimumBalanceForRentExemption(
              accountInfo.data.length
            );
            const usableBalance = (solBalance - rentExemptAmount/1e9);
            setBalance(usableBalance < 0 ? 0 : usableBalance);
          } else {
            setBalance(solBalance);
          }
        } else {
          setBalance(solBalance);
        }
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
  }, [address, tokenAddress, getTokenBalance, getWalletBalance, shyft, connection]);

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

  return { balance, loadingBalance, error };
};