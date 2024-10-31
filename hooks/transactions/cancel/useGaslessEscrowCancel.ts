//import { Contract } from 'ethers';
import { useState } from 'react';
import { useAccount } from 'hooks';

import { UseEscrowCancelProps } from '../types';
import useShyft from '../useShyft';
import useLocalSolana from '../useLocalSolana';
import { PublicKey } from '@solana/web3.js';

interface Data {
	hash?: string;
}

const useGaslessEscrowCancel = ({ orderID,seller, token }: UseEscrowCancelProps) => {
	const [data, updateData] = useState<Data>({});
	const [isSuccess, setIsSuccess] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const { address } = useAccount();

	const { shyft,sendTransactionWithShyft} = useShyft();
	const {cancelOrderOnChain} = useLocalSolana();

	if (shyft === undefined ) {
		return { isFetching: true, isSuccess, isLoading, data };
	}

	if (shyft === null ) {
		return { isFetching: false, gaslessEnabled: false, isSuccess, isLoading, data };
	}

	const cancelOrder = async () => {
		try {
			setIsLoading(true);
			const tx = await cancelOrderOnChain(orderID,new PublicKey(address||''),new PublicKey(seller),new PublicKey(token.address));
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
	return { isFetching: false, gaslessEnabled: true, isLoading, isSuccess, data, cancelOrder };
};

export default useGaslessEscrowCancel;
