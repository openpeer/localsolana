/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import useLocalSolana from './useLocalSolana';
import useShyft from './useShyft';

/**
 * Custom hook to fetch and monitor SOL or token balances for a Solana address.
 * 
 * @param address - The Solana wallet address to check the balance for
 * @param tokenAddress - The token's mint address. Use PublicKey.default.toBase58() for SOL balance
 * @param watch - If true, polls for balance updates every 8 seconds
 * @param refreshTrigger - Increment this value to force a balance refresh
 * 
 * @returns {Object} Returns an object containing:
 *   - balance: The current balance (null if not yet loaded)
 *   - loadingBalance: Boolean indicating if balance is being fetched
 *   - error: Error message if something went wrong, null otherwise
 * 
 * @example
 * ```tsx
 * const { balance, loadingBalance, error } = useBalance(
 *   "wallet123...",
 *   "tokenMint123...",
 *   true
 * );
 * ```
 */
export const useBalance = (
  address: string,
  tokenAddress: string,
  watch = false,
  refreshTrigger = 0
) => {
  // State management for balance information
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Hook dependencies
  const {connection} = useLocalSolana();
  const {getTokenBalance, getWalletBalance} = useShyft();

  useEffect(() => {
    // Cleanup flag to prevent setting state after unmount
    let mounted = true;
    let pollInterval: NodeJS.Timeout;
    
    /**
     * Fetches the current balance for the specified address and token
     * Handles both SOL and SPL token balance fetching
     */
    const fetchBalance = async () => {
      if (!address || !tokenAddress) {
        console.debug("[useBalance] Missing required parameters:", { address, tokenAddress });
        setError("Missing address or token address");
        setLoading(false);
        return;
      }

      if (!mounted) return;

      // Ensure we have an active connection
      if (!connection) {
        console.debug("[useBalance] Waiting for connection...");
        setLoading(true);
        return;
      }

      try {
        console.debug("[useBalance] Fetching balance for address:", address, "token:", tokenAddress);
        
        const publicKey = new PublicKey(address);
        
        // Handle SOL balance fetching
        if (tokenAddress === PublicKey.default.toBase58()) {
          console.debug("[useBalance] Fetching SOL balance");
          const solBalance = await getWalletBalance(address);
          console.debug("[useBalance] Raw SOL balance:", solBalance);
          
          if (solBalance === null) {
            throw new Error("Failed to fetch SOL balance");
          }

          // Calculate usable balance by subtracting rent-exempt amount
          const accountInfo = await connection.getAccountInfo(publicKey);
          if (!accountInfo) {
            throw new Error('Account not found or invalid');
          }

          const rentExemptAmount = await connection.getMinimumBalanceForRentExemption(
            accountInfo.data.length
          );

          const usableBalance = (solBalance - rentExemptAmount/1e9);
          if (mounted) {
            setBalance(usableBalance < 0 ? 0 : usableBalance);
            setError(null);
            setLoading(false);
          }
        } else {
          // Handle SPL token balance fetching
          console.debug("[useBalance] Fetching token balance");
          const tokenBalance = await getTokenBalance(address, tokenAddress);
          console.debug("[useBalance] Token balance result:", tokenBalance);
          if (mounted) {
            setBalance(tokenBalance);
            setError(null);
            setLoading(false);
          }
        }
      } catch (err: any) {
        console.error("[useBalance] Error fetching balance:", err);
        if (!mounted) return;
        
        setError(err.message);
        setLoading(false);
      }
    };

    // Initial balance fetch
    fetchBalance();

    // Setup polling if watch mode is enabled
    if (watch) {
      pollInterval = setInterval(fetchBalance, 8000);
    }

    // Cleanup function to prevent memory leaks and invalid state updates
    return () => {
      mounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [address, tokenAddress, refreshTrigger, connection, getTokenBalance, getWalletBalance]);

  return { balance, loadingBalance, error };
};