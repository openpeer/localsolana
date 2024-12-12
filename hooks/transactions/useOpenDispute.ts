// hooks/transactions/useOpenDispute.ts

import { useState } from 'react';
import { useAccount } from 'hooks';
import useShyft from './useShyft';
import useLocalSolana from './useLocalSolana';
import { PublicKey } from '@solana/web3.js';
// import useHelius from './useHelius'; // Added Helius integration


interface Data {
  hash?: string | null;
}

const useOpenDispute = ({ orderID }: {orderID:string}) => {
	const [data, updateData] = useState<Data>({});
	const [isSuccess, setIsSuccess] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const { address } = useAccount();
	const { shyft,sendTransactionWithShyft } = useShyft();
	const {openDispute} = useLocalSolana();
	const { getAccountInfo } = useShyft();

  if (!address) {
    console.error("Address not available. Cannot open dispute.");
    return { isFetching: false, isSuccess, isLoading, data };
  }

  if (!shyft) {
    console.error("Shyft not initialized. Cannot proceed with transaction relaying.");
    return { isFetching: false, isSuccess, isLoading, data };
  }

	const opensDispute = async () => {
		setIsLoading(true);
		try {
			// Validate the sender's account using Helius
      const senderAccountInfo = await getAccountInfo(address);
      if (!senderAccountInfo) {
        console.error("Sender account not found");
        setIsSuccess(false);
        return false;
      }

			const tx = await openDispute(orderID, new PublicKey(address));
			if (!tx) {
        console.error("Failed to create dispute transaction.");
        setIsSuccess(false);
        return false;
      }

			const finalTx = await sendTransactionWithShyft(tx,true,orderID);
			if (finalTx) {
				updateData({hash: finalTx} );
				setIsSuccess(true);
        return true;
			}else{
				console.error('Transaction relaying failed.', finalTx);
				setIsSuccess(false);
				return false;
			}
		} catch (error) {
			console.error('Error during dispute process:', error);
			setIsSuccess(false);
      return false;
		} finally {
      setIsLoading(false);
		}
	};
	return { isFetching: false, isLoading, isSuccess, data, opensDispute };
};

export default useOpenDispute;
