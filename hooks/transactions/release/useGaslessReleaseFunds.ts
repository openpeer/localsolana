// hooks/transactions/release/useGaslessReleaseFunds.ts

import { truncate } from './../../../utils/index';
import { useAccount } from 'hooks';
import { useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { UseEscrowTransactionProps } from '../types';
import useLocalSolana from '../useLocalSolana';
import useShyft from '../useShyft';
import { toast } from 'react-toastify';

interface Data {
	hash?: string;
}

const useGaslessReleaseFunds = ({ orderID, buyer, token, seller }: UseEscrowTransactionProps) => {
	const [data, updateData] = useState<Data>({});
	const [isSuccess, setIsSuccess] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const { address } = useAccount();
	const { connection, isInitializing, sendTransactionWithShyft, getAccountInfo } = useShyft();
	const { releaseFunds, getEscrowPDA } = useLocalSolana();

	// Return early with loading state if still initializing
	if (isInitializing) {
		return { isFetching: true, gaslessEnabled: false, isSuccess, isLoading, data };
	}

	// Return early with error state if initialization failed
	if (!connection) {
		console.error("[useGaslessReleaseFunds] Connection not initialized");
		toast.error("Failed to connect to Solana network. Please try again later.");
		return { isFetching: false, gaslessEnabled: false, isSuccess, isLoading, data };
	}

	const verifyEscrowExists = async (escrowAddress: PublicKey) => {
		try {
			const accountInfo = await getAccountInfo(escrowAddress.toString());
			if (!accountInfo) {
				console.error("[useGaslessReleaseFunds] Escrow account not found:", escrowAddress.toString());
				toast.error("Escrow account not found. Please verify the order details.");
				return false;
			}
			return true;
		} catch (error) {
			console.error('[useGaslessReleaseFunds] Error verifying escrow account:', error);
			toast.error("Failed to verify escrow account. Please try again.");
			return false;
		}
	};

	const releaseFund = async () => {
		try {
			setIsLoading(true);

			const escrowPDA = await getEscrowPDA(orderID);
			if (!escrowPDA) {
				console.error("[useGaslessReleaseFunds] Failed to get escrow PDA for order:", orderID);
				toast.error("Failed to get escrow account. Please try again.");
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
				toast.success("Funds released successfully!");
			} else {
				console.error("[useGaslessReleaseFunds] Transaction failed");
				toast.error("Failed to release funds. Please try again.");
				setIsLoading(false);
				setIsSuccess(false);
			}
		} catch (error) {
			console.error("[useGaslessReleaseFunds] Error releasing funds:", error);
			toast.error("An error occurred while releasing funds. Please try again.");
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
