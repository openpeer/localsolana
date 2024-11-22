// hooks/transactions/escrow/useGaslessEscrow.ts

/* eslint-disable no-mixed-spaces-and-tabs */
import { useState } from 'react';
import { useAccount } from 'hooks';
import { toast } from 'react-toastify';
import { UseGaslessEscrowFundsProps } from '../types';
import { PublicKey } from '@solana/web3.js';
import useShyft from '../useShyft';
import useLocalSolana from '../useLocalSolana';

interface Data {
	hash?: string;
}

const useGaslessEscrow = ({
	contract,
	orderID,
	buyer,
	seller,
	token,
	amount,
	instantEscrow,
	sellerWaitingTime
}: UseGaslessEscrowFundsProps) => {
	const [data, updateData] = useState<Data>({});
	const [isSuccess, setIsSuccess] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const { address } = useAccount();
	const {depositFundsEscrow,getEscrowPDA} = useLocalSolana();

	const { shyft,sendTransactionWithShyft } = useShyft();

	if (shyft === undefined) {
		return { isFetching: true, isSuccess, isLoading, data };
	}

	if (shyft === null ) {
		return { isFetching: false, gaslessEnabled: false, isSuccess, isLoading, data };
	}

	const escrowFunds = async () => {
		try {
			const partner = PublicKey.default.toBase58();
			const escrow = await getEscrowPDA(orderID);
			if(!escrow){
				console.error('Error Funding escrow');
				setIsLoading(false);
				setIsSuccess(false);
				return
			}
			console.log('Escrow is ',escrow.toBase58(),orderID,seller);
			const  tx = await depositFundsEscrow(
				amount,
				new PublicKey(seller),
				new PublicKey(token.address),orderID,token.decimals
		  );
		  if(tx ===undefined){
			setIsLoading(false);
			setIsSuccess(false);
			return;
		}
			setIsLoading(true);
			console.log('Deposit Transaction');
			const finalTx =await sendTransactionWithShyft(tx,true)
			if(finalTx !==undefined){
				setIsLoading(false);
				setIsSuccess(true);
				updateData({hash:escrow.toString()});
			}else{
				console.error('Error Funding escrow');
				setIsLoading(false);
				setIsSuccess(false);
			}
			
		} catch (error: any) {
			toast.error(error.message, {
				theme: 'dark',
				position: 'top-right',
				autoClose: 5000,
				hideProgressBar: true,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: false,
				progress: undefined
			});
			setIsLoading(false);
			setIsSuccess(false);
		}
	};
	return { isFetching: false, gaslessEnabled: true, isLoading, isSuccess, data, escrowFunds };
};

export default useGaslessEscrow;
