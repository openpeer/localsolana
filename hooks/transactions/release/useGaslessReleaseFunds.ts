// hooks/transactions/release/useGaslessReleaseFunds.ts

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
	const { shyft, sendTransactionWithShyft, getAccountInfo, connection } = useShyft();
	const { releaseFunds, getEscrowPDA } = useLocalSolana();

	if (!shyft || connection === null) {
		console.error("Shyft or connection not initialized");
		return { isFetching: false, gaslessEnabled: false, isSuccess, isLoading, data };
	}

	const verifyEscrowExists = async (escrowAddress: PublicKey) => {
		try {
			const accountInfo = await getAccountInfo(escrowAddress.toString());
			return accountInfo !== null;
		} catch (error) {
			console.error('Error verifying escrow account:', error);
			return false;
		}
	};

	const releaseFund = async () => {
		try {
			setIsLoading(true);

			const escrowPDA = await getEscrowPDA(orderID);
			if (!escrowPDA) {
				setIsLoading(false);
				setIsSuccess(false);
				return;
			}

			const escrowExists = await verifyEscrowExists(escrowPDA);
			if (!escrowExists) {
				setIsLoading(false);
				setIsSuccess(false);
				return;
			}

			const tx = await releaseFunds(
				orderID,
				new PublicKey(seller),
				new PublicKey(buyer),
				new PublicKey(token.address)
			);

			const finalTx = await sendTransactionWithShyft(tx, true, orderID);

			if (finalTx !== undefined && finalTx !== null) {
				setIsLoading(false);
				setIsSuccess(true);
				updateData({ hash: finalTx });
			} else {
				setIsLoading(false);
				setIsSuccess(false);
			}
		} catch (error) {
			console.error(error);
			setIsLoading(false);
			setIsSuccess(false);
		} finally {
			setIsLoading(false);
		}
	};

	return {
		isFetching: false,
		gaslessEnabled: true,
		isLoading,
		isSuccess,
		data,
		releaseFund
	};
};

export default useGaslessReleaseFunds;
