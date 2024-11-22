// hooks/transactions/useOpenDispute.ts

import { useState } from 'react';
import { useAccount } from 'hooks';

import useShyft from './useShyft';
import useLocalSolana from './useLocalSolana';
import { PublicKey } from '@solana/web3.js';

interface Data {
	hash?: string;
}

const useOpenDispute = ({ orderID }: {orderID:string}) => {
	const [data, updateData] = useState<Data>({});
	const [isSuccess, setIsSuccess] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const { address } = useAccount();

	const { shyft,sendTransactionWithShyft } = useShyft();
	const {openDispute} = useLocalSolana();

	if (data === undefined ) {
		return { isFetching: true, isSuccess, isLoading, data };
	}

	if (shyft === null) {
		return { isFetching: false, isSuccess, isLoading, data };
	}

	const opensDispute = async () => {
		try {
			setIsLoading(true);
			const tx = await openDispute(orderID,new PublicKey(address||''));
			const finalTx = await sendTransactionWithShyft(tx,true);
			if(finalTx !== undefined){
				setIsLoading(false);
				setIsSuccess(true);
				updateData({hash: finalTx} );
                return true;
			}else{
				console.error('error', finalTx);
				setIsLoading(false);
				setIsSuccess(false);
			}
            return false;
		} catch (error) {
			console.error('error', error);
			setIsLoading(false);
			setIsSuccess(false);
            return false;
		}
	};
	return { isFetching: false, isLoading, isSuccess, data, opensDispute };
};

export default useOpenDispute;
