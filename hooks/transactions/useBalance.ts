// hooks/transactions/useBalance.ts

/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import useLocalSolana from './useLocalSolana';
// import useShyft from './useShyft';
import useHelius from "./useHelius";


export const useBalance = (
  walletAddress: string,
  tokenAddress: string,
  watch?: boolean
) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const {connection,} = useLocalSolana();
  const {getTokenBalance,getWalletBalance} = useHelius();

  useEffect(() => {
    const fetchBalance = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!connection) {
          throw new Error("Connection not established");
        }

        if (!PublicKey.isOnCurve(walletAddress)) {
          throw new Error("Invalid wallet address");
        }

        console.log("Fetching balance for:", walletAddress);

        if(tokenAddress === PublicKey.default.toBase58()){
        const walletBalance = await getWalletBalance(walletAddress);
        setBalance(walletBalance / 10 ** 9);
      } else {
        const tokenBalance = await getTokenBalance(walletAddress, tokenAddress);
        if (tokenBalance) {
          setBalance(tokenBalance.balance / 10 ** tokenBalance.decimals); // Convert to human-readable format
        } else {
          throw new Error("Token balance not found");
        }
      }
      console.log("Balance fetched successfully");
      } catch (err: any) {
        console.error("Error fetching balance:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (walletAddress) {
      fetchBalance();
    }
    if(watch){
      // Polling at the specified interval
    const intervalId = setInterval(fetchBalance, 8000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
    }

    
  }, [walletAddress, tokenAddress, connection, watch]);
  // console.log("Here is my balance",balance, loadingBalance, error);

  return { balance, loadingBalance, error };
};