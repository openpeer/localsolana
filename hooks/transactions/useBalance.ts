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
  const {getTokenBalance,getWalletBalance} = useShyft();

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
        const balance = await getWalletBalance(walletAddress);
        //console.log("Here is my actual balance",balance);
        // Fetch the account's rent exemption requirement
        const accountInfo = await connection.getAccountInfo(new PublicKey(walletAddress));
        if (!accountInfo) {
          throw new Error('Account not found or invalid');
        }
    
        const rentExemptAmount = await connection.getMinimumBalanceForRentExemption(
          accountInfo.data.length // Account data size
        );
    
        if(balance!=null){
        // Calculate usable balance (convert lamports to SOL)
        const usableBalance = (balance - rentExemptAmount/1e9);
        //console.log("Here is my usable balance",usableBalance);
        setBalance(usableBalance<0?0:usableBalance); // Convert lamports to SOL
        }else{
          setBalance(0);
        }
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
    const intervalId = setInterval(fetchBalance, 8000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
    }

    
  }, [walletAddress,connection]);
  // //console.log("Here is my balance",balance, loadingBalance, error);

  return { balance, loadingBalance, error };
};