// hooks/transactions/useAllTokenBalance.ts

/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import useLocalSolana from './useLocalSolana';
import useShyft from './useShyft';
import { TokenBalance } from '@shyft-to/js';
import useHelius from "./useHelius"; 

export const useAllTokenBalance = (walletAddress: string, watch?: boolean) => {
  const [balances, setBalances] = useState<TokenBalance[] | null>(null);
  const [loadingBalance, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const {connection,} = useLocalSolana();
  const {getAllTokenBalance,} = useHelius();

  useEffect(() => {
    const fetchBalance = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!connection) {
          throw new Error("Connection not established");
        }

        if (!walletAddress || !PublicKey.isOnCurve(walletAddress)) {
          throw new Error("Invalid wallet address");
        }

        console.log("Fetching token balances for:", walletAddress);

        const balance = await getAllTokenBalance(walletAddress);
        console.log("Fetched token balances:", balances);

        // Update state with balances
        setBalances(
          balances.map((item) => ({
            mint: item.mint,
            balance: item.balance / 10 ** item.decimals, // Convert to human-readable format
            decimals: item.decimals,
            tokenName: item.tokenName,
            symbol: item.symbol,
          }))
        );

        setLoading(false);

      } catch (err: any) {
        console.error("Error fetching token balances:", err);
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

    
  }, [walletAddress,connection, watch]);
  // console.log("Here is my balance",balance, loadingBalance, error);

  return { balances, loadingBalance, error };
};