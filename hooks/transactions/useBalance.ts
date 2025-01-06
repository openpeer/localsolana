/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import useLocalSolana from './useLocalSolana';
import useShyft from './useShyft';


export const useBalance = (
  address: string,
  tokenAddress: string,
  watch = false,
  refreshTrigger = 0
) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const {connection} = useLocalSolana();
  const {getTokenBalance, getWalletBalance} = useShyft();

  useEffect(() => {
    let mounted = true;
    let pollInterval: NodeJS.Timeout;
    
    const fetchBalance = async () => {
      if (!address || !tokenAddress) {
        console.debug("[useBalance] Missing required parameters:", { address, tokenAddress });
        setError("Missing address or token address");
        setLoading(false);
        return;
      }

      if (!mounted) return;

      // Only proceed if we have a connection
      if (!connection) {
        console.debug("[useBalance] Waiting for connection...");
        setLoading(true);
        return;
      }

      try {
        console.debug("[useBalance] Fetching balance for address:", address, "token:", tokenAddress);
        
        const publicKey = new PublicKey(address);
        
        if (tokenAddress === PublicKey.default.toBase58()) {
          console.debug("[useBalance] Fetching SOL balance");
          const solBalance = await getWalletBalance(address);
          console.debug("[useBalance] Raw SOL balance:", solBalance);
          
          if (solBalance === null) {
            throw new Error("Failed to fetch SOL balance");
          }

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

    fetchBalance();

    // Setup polling if watch is true
    if (watch) {
      pollInterval = setInterval(fetchBalance, 8000);
    }

    return () => {
      mounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [address, tokenAddress, refreshTrigger, connection, getTokenBalance, getWalletBalance]);

  return { balance, loadingBalance, error };
};