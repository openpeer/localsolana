/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import useLocalSolana from './useLocalSolana';
import useShyft from './useShyft';
import { TokenBalance } from '@shyft-to/js';


export const useAllTokenBalance = (
  address: string, 
  watch = false,
  refreshTrigger = 0
) => {
  const [balances, setBalances] = useState<TokenBalance[] | null>(null);
  const [loadingBalance, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const {connection,} = useLocalSolana();
  const {getAllTokenBalance,} = useShyft();

  useEffect(() => {
    const fetchBalance = async () => {
      setLoading(true);
      setError(null);

      try {
        if(!connection){
            setError("Connection not established");
            setLoading(false);
            return
        }
        ////console.log("Here is my balance",);
        const balance = await getAllTokenBalance(address);
        ////console.log("Here is my balance",balance);
        setBalances(balance);
        setLoading(false);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (address) {
      fetchBalance();
    }
    if(watch){
      // Polling at the specified interval
    const intervalId = setInterval(fetchBalance, 8000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
    }

    
  }, [address,connection,refreshTrigger]);
  // //console.log("Here is my balance",balance, loadingBalance, error);

  return { balances, loadingBalance, error };
};