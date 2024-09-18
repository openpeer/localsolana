import { useState } from 'react';
import { useAccount } from 'hooks';

import { UseEscrowTransactionProps } from '../types';
import useShyft from '../useShyft';
import useLocalSolana from '../useLocalSolana';
import { PublicKey } from '@solana/web3.js';

interface Data {
	hash?: string;
}

const useGaslessMarkAsPaid = ({ orderID, buyer, amount, token, contract,seller }: UseEscrowTransactionProps) => {
	const [data, updateData] = useState<Data>({});
	const [isSuccess, setIsSuccess] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const { address } = useAccount();

	const { shyft,sendTransactionWithShyft } = useShyft();
	const {markAsPaid} = useLocalSolana();

	if (shyft === undefined ) {
		return { isFetching: true, isSuccess, isLoading, data };
	}

	if (shyft === null) {
		return { isFetching: false, isSuccess, isLoading, data };
	}

	const marksAsPaid = async () => {
		try {
			
			setIsLoading(true);
			const tx = await markAsPaid(orderID,new PublicKey(buyer),new PublicKey(seller));
			const finalTx = await sendTransactionWithShyft(tx);
			if(finalTx !== undefined){
				setIsLoading(false);
				setIsSuccess(true);
				updateData({hash: finalTx} );
			}else{
				console.error('error', finalTx);
				setIsLoading(false);
				setIsSuccess(false);
			}
		} catch (error) {
			console.error('error', error);
			setIsLoading(false);
			setIsSuccess(false);
		}
	};
	return { isFetching: false, gaslessEnabled: true, isLoading, isSuccess, data, markAsPaid };
};

export default useGaslessMarkAsPaid;
