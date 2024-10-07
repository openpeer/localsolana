import { truncate } from './../../../utils/index';
import { useAccount } from 'hooks';
import { useState } from 'react';

import { PublicKey } from '@solana/web3.js';
import { UseEscrowTransactionProps } from '../types';
import useLocalSolana from '../useLocalSolana';
import useShyft from '../useShyft';

interface Data {
	hash?: string;
}

const useGaslessReleaseFunds = ({ orderID, buyer, token, seller }: UseEscrowTransactionProps) => {
	const [data, updateData] = useState<Data>({});
	const [isSuccess, setIsSuccess] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const { address } = useAccount();
	const{shyft,sendTransactionWithShyft} = useShyft();
	const {connection,releaseFunds} = useLocalSolana();

	if (connection === null || shyft==null) {
		return { isFetching: false, gaslessEnabled: false, isSuccess, isLoading, data };
	}

	const releaseFund = async () => {
		try {
			setIsLoading(true);
			console.log('order id',orderID);
			const tx = await releaseFunds(orderID,new PublicKey(seller),new PublicKey(buyer),new PublicKey(token.address),);
			const finalTx = await sendTransactionWithShyft(tx,true);
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
	return { isFetching: false, gaslessEnabled: true, isLoading, isSuccess, data, releaseFund };
};

export default useGaslessReleaseFunds;
