// Install the required package
// npm install @solana/web3.js

import { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import useLocalSolana from './useLocalSolana';


export const useBalance = (walletAddress: string) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const {connection} = useLocalSolana();

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
        const balance = await connection.getBalance(publicKey);
        setBalance(balance / 1e9); // Convert lamports to SOL
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (walletAddress) {
      fetchBalance();
    }
  }, [walletAddress]);

  return { balance, loading, error };
};