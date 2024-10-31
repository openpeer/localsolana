/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import useLocalSolana from './useLocalSolana';
import useShyft from './useShyft';


export const useBalance = (walletAddress: string, tokenAddress: string, watch?: boolean) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const {connection,} = useLocalSolana();
  const {getTokenBalance} = useShyft();

  useEffect(() => {
    const fetchBalance = async () => {
      setLoading(true);
      setError(null);

      try {
        const publicKey = new PublicKey(walletAddress);
        if(!connection){
            setError("Connection not established");
            setLoading(false);
            return
        }
        if(tokenAddress == PublicKey.default.toBase58()){
        const balance = await connection.getBalance(publicKey);
        setBalance(balance / 1e9); // Convert lamports to SOL
      }else{
        const balance = await getTokenBalance(walletAddress,tokenAddress);
        setBalance(balance); 
      }
      } catch (err: any) {
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
    const intervalId = setInterval(fetchBalance, 5000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
    }

    
  }, [walletAddress,connection]);
  // console.log("Here is my balance",balance, loadingBalance, error);

  return { balance, loadingBalance, error };
};