// hooks/transactions/useBalance.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import useLocalSolana from './useLocalSolana';
import useShyft from './useShyft';

type AddressInput = string | { address: string } | { publicKey: string };

// Type guard functions
const isAddressObject = (input: AddressInput): input is { address: string } => {
  return typeof input === 'object' && 'address' in input;
};

const isPublicKeyObject = (input: AddressInput): input is { publicKey: string } => {
  return typeof input === 'object' && 'publicKey' in input;
};

/**
 * Custom hook to fetch and monitor SOL or token balances for a Solana address.
 * @param addressInput - The Solana wallet address to check the balance for. Can be:
 *                    - A string containing the address
 *                    - An object with an `address` property
 *                    - An object with a `publicKey` property
 * @param tokenAddress - The token's mint address. Use PublicKey.default.toBase58() for SOL balance
 * @param watch - If true, polls for balance updates every 8 seconds
 * @param refreshTrigger - Increment this value to force a balance refresh
 * @returns {Object} Returns an object containing:
 *                   - balance: number | null - The current balance
 *                   - loadingBalance: boolean - Loading state
 *                   - error: string | null - Error message if any
 * @example
 * // For SOL balance
 * const { balance } = useBalance("ADDRESS", PublicKey.default.toBase58());
 * 
 * // For token balance with string address
 * const { balance } = useBalance("ADDRESS", "TOKEN_ADDRESS");
 * 
 * // For token balance with object containing address
 * const { balance } = useBalance({ address: "ADDRESS" }, "TOKEN_ADDRESS");
 * 
 * // For token balance with object containing publicKey
 * const { balance } = useBalance({ publicKey: "ADDRESS" }, "TOKEN_ADDRESS");
 * 
 * // With watch enabled for real-time updates
 * const { balance } = useBalance("ADDRESS", "TOKEN_ADDRESS", true);
 */
export const useBalance = (
  addressInput: AddressInput,
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

  // Extract address using type guards
  const extractedAddress = typeof addressInput === 'string' 
    ? addressInput.trim() 
    : isAddressObject(addressInput)
      ? addressInput.address.trim()
      : isPublicKeyObject(addressInput)
        ? addressInput.publicKey.trim()
        : null;

  // Enhanced address validation with specific error messages
  const isValidAddress = useCallback((addr: string | null): boolean => {
    if (!addr) {
      return false;
    }
    
    if (addr.trim() === '') {
      return false;
    }

    try {
      new PublicKey(addr);
      return true;
    } catch (err) {
      return false;
    }
  }, []);

  // Validate token address
  const isValidTokenAddress = useCallback((addr: string): boolean => {
    if (addr === PublicKey.default.toBase58()) return true;
    
    try {
      new PublicKey(addr);
      return true;
    } catch (err) {
      return false;
    }
  }, []);

  const address = extractedAddress && isValidAddress(extractedAddress) 
    ? extractedAddress 
    : null;

  // Memoized fetch function
  const fetchBalance = useCallback(async () => {
    // Skip if we have an error that needs to be handled
    if (error) return;

    // Early return if missing required params or invalid addresses
    if (!address || !tokenAddress || !isValidTokenAddress(tokenAddress)) {
      // Only set error if we have an actual address that's invalid
      if (extractedAddress && extractedAddress.trim() !== '') {
        setError("Invalid parameters: invalid wallet address");
      } else {
        // Just set balance to null and loading to false if no address provided
        setBalance(null);
        setError(null);
      }
      setLoading(false);
      return;
    }

    // Early return if Shyft not ready
    if (!shyft) {
      setLoading(true);
      return;
    }

    // Prevent concurrent requests
    if (fetchInProgress.current) {
      return;
    }

    try {
      fetchInProgress.current = true;
      setLoading(true);
      setError(null);
      
      if (tokenAddress === PublicKey.default.toBase58()) {
        const solBalance = await getWalletBalance(address);
        
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
        const tokenBalance = await getTokenBalance(address, tokenAddress);
        
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
  }, [address, tokenAddress, getTokenBalance, getWalletBalance, shyft, connection, error]);

  // Effect for initial fetch and polling
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let mounted = true;
    let lastFetchTime = 0;
    const MIN_FETCH_INTERVAL = 5000; // Minimum 5 seconds between fetches

    const runFetch = async () => {
      if (!mounted || fetchInProgress.current) return;
      
      const now = Date.now();
      if (now - lastFetchTime < MIN_FETCH_INTERVAL) {
        return;
      }

      try {
        await fetchBalance();
        lastFetchTime = now;
      } catch (err) {
        console.error("[useBalance] Error in polling fetch:", err);
      }
    };

    // Initial fetch
    runFetch();

    // Setup polling if watch is true
    if (watch) {
      pollInterval = setInterval(runFetch, 8000);
    }

    return () => {
      mounted = false;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [watch, refreshTrigger, fetchBalance]);

  return { balance, loadingBalance, error };
};