import { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import useLocalSolana from './useLocalSolana';


export const useContractRead = (contractAddress: string, method: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const {provider,program,connection} = useLocalSolana();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const publicKey = new PublicKey(contractAddress);
        if(!connection){
            setError('Connection  not found');
            setLoading(false);
            return;
        }
        console.log('Connection is established',connection);

        const accountInfo = await connection.getAccountInfo(publicKey);
        const accountBuffer = accountInfo?.data;
        if(!accountBuffer){
            setError('Unable to retrieve account information');
            setLoading(false);
            return;
        }
        var decodedData ;
        switch(method){
            case 'escrow':
                decodedData  = program?.account.escrow.coder.accounts.decode('escrow',accountBuffer);
                break;
        }
        
        if (accountInfo) {
            console.log('Account data',decodedData);
          setData(decodedData);
        } else {
            console.log('Account data not found');
          setError('No data found');
        }
      } catch (err) {
        console.error('Account data',err);
        setError(err?.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [contractAddress, method,connection]);

  return { data, loading, error };
};