import { Contract } from 'ethers';
import { useState } from 'react';
import { useAccount } from 'hooks';

import { UseEscrowCancelProps } from '../types';
import useShyft from '../useShyft';

interface Data {
	hash?: string;
}

const useGaslessEscrowCancel = ({ contract, isBuyer, orderID, buyer, token, amount }: UseEscrowCancelProps) => {
	const [data, updateData] = useState<Data>({});
	const [isSuccess, setIsSuccess] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const { address } = useAccount();

	const { shyft,sendTransactionWithShyft} = useShyft();

	if (shyft === undefined ) {
		return { isFetching: true, isSuccess, isLoading, data };
	}

	if (shyft === null ) {
		return { isFetching: false, gaslessEnabled: false, isSuccess, isLoading, data };
	}

	const cancelOrder = async () => {
		try {
			if(isBuyer){

			}else{
				
			}
		} catch (error) {
			console.error('error', error);
			setIsLoading(false);
			setIsSuccess(false);
		}
	};
	return { isFetching: false, gaslessEnabled: true, isLoading, isSuccess, data, cancelOrder };
};

export default useGaslessEscrowCancel;
