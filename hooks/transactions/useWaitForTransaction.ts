import { useEffect, useState } from 'react';
import useHelius from './useHelius';

interface UseWaitForTransactionProps {
  hash: string;
  onReplaced?: (newTransaction: { hash: string }) => void;
}

export const useWaitForTransaction = ({ hash, onReplaced }: UseWaitForTransactionProps) => {
  const [isError, setIsError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const { getConnection, isConnectionReady } = useHelius();

  useEffect(() => {
    const fetchTransactionStatus = async () => {
      setIsLoading(true);
      setIsError(false);

      try {
        if (!isConnectionReady) {
          throw new Error("Connection not initialized");
        }

        const connection = getConnection();
        const confirmedTransaction = await connection.confirmTransaction(hash, 'finalized');

        if (confirmedTransaction?.value?.err) {
          setIsError(true);
        } else {
          setIsSuccess(true);
          if (onReplaced) {
            onReplaced({ hash });
          }
        }
      } catch (err) {
        console.error("Error confirming transaction:", err);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (hash) {
      fetchTransactionStatus();
    }
  }, [hash, onReplaced, getConnection, isConnectionReady]);

  return { isError, isLoading, isSuccess };
};