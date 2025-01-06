import { useState } from 'react';
import { useAccount } from 'hooks';

import useShyft from './useShyft';
import useLocalSolana from './useLocalSolana';
import { PublicKey } from '@solana/web3.js';

interface Data {
	hash?: string;
}

const useResolveDispute = ({ orderID,winner,seller,buyer,token }: {orderID:string,winner: string,seller:string,buyer:string,token:string}) => {
	const [data, updateData] = useState<Data>({});
	const [isSuccess, setIsSuccess] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const { address } = useAccount();

	const { shyft,sendTransactionWithShyft } = useShyft();
	const {resolveDispute} = useLocalSolana();

	if (data === undefined ) {
		return { isFetching: true, isSuccess, isLoading, data };
	}

	const declareWinner = async () => {
		try {
			setIsLoading(true);

			if (!shyft) {
				console.error("Shyft not initialized. Cannot proceed with transaction relaying (declareWinner).");
				setIsSuccess(false);
				return false;
			}

			const tx = await resolveDispute(
				orderID,
				new PublicKey(seller),
				new PublicKey(buyer),
				new PublicKey(winner),
				new PublicKey(token)
			);
			const finalTx = await sendTransactionWithShyft(tx, true, orderID);
			if (finalTx) {
				setIsSuccess(true);
				updateData({ hash: finalTx });
				return true;
			} else {
				console.error("Error relaying transaction", finalTx);
				setIsSuccess(false);
				return false;
			}
		} catch (error) {
			console.error("Error in declareWinner", error);
			setIsSuccess(false);
			return false;
		} finally {
			setIsLoading(false);
		}
	};
	return { isFetching: false, isLoading, isSuccess, data, declareWinner };
};

export default useResolveDispute;
