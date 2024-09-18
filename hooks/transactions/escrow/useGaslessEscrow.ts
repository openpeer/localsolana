/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/indent */
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
	const {createEscrowSol} = useLocalSolana();

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
			const  tx =
				token.address === PublicKey.default.toBase58()
					? await createEscrowSol(
							orderID,
							sellerWaitingTime,
							amount,
							buyer,
							seller,
							partner,
					  )
					: await createEscrowSol(
						orderID,
						sellerWaitingTime,
						amount,
						buyer,
						seller,
						partner,
				  );


			setIsLoading(true);
			const finalTx =await sendTransactionWithShyft(tx)
			if(finalTx !==undefined){
				setIsLoading(false);
				setIsSuccess(true);
				updateData({hash:finalTx});
			}else{
				console.error('Error Marking as paid');
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
