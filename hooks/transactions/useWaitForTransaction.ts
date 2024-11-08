import { useEffect, useState } from 'react';
import useLocalSolana from './useLocalSolana';
import useShyft from './useShyft';

const SOLANA_RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';

interface UseWaitForTransactionProps {
  hash: string;
  onReplaced?: (newTransaction: { hash: string }) => void;
}

export const useWaitForTransaction = ({ hash, onReplaced }: UseWaitForTransactionProps) => {
  const [isError, setIsError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const {connection} = useLocalSolana();
  const {shyft} = useShyft();

  useEffect(() => {
    const fetchTransactionStatus = async () => {
      setIsLoading(true);
      setIsError(false);

      try {


        const confirmedTransaction = await connection?.confirmTransaction(hash, 'finalized');

        if (confirmedTransaction) {
          setIsSuccess(true);
          if (onReplaced) {
            onReplaced({ hash });
          }
        } else {
          setIsError(true);
        }
      } catch (err) {
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (hash) {
      fetchTransactionStatus();
    }
  }, [hash, onReplaced]);

  return { isError, isLoading, isSuccess };
};