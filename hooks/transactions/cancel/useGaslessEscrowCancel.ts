//import { Contract } from 'ethers';
import { useState } from 'react';
import { useAccount } from 'hooks';
import { PublicKey } from '@solana/web3.js';
import { UseEscrowCancelProps } from '../types';
import useShyft from '../useShyft';
import useLocalSolana from '../useLocalSolana';
import { toast } from 'react-toastify';

interface Data {
	hash?: string | null;
}

const useGaslessEscrowCancel = ({ 
	orderID, 
	seller, 
	token, 
	contract, 
	buyer, 
	amount, 
	isBuyer 
}: UseEscrowCancelProps) => {
	const [data, updateData] = useState<Data>({});
	const [isSuccess, setIsSuccess] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const { address } = useAccount();
	const { sendTransactionWithShyft } = useShyft();
	const { cancelOrderOnChain } = useLocalSolana();

	const cancelOrder = async () => {
		try {
			setIsLoading(true);

			// Verify the caller is either buyer or seller
			if (!address) {
				throw new Error("Wallet not connected");
			}

			if (address !== buyer && address !== seller) {
				throw new Error("Only buyer or seller can cancel the order");
			}

			const tx = await cancelOrderOnChain(
				orderID,
				new PublicKey(address),
				new PublicKey(seller),
				new PublicKey(token.address)
			);

			const finalTx = await sendTransactionWithShyft(tx, true, orderID);
			if (finalTx !== undefined && finalTx !== null) {
				setIsLoading(false);
				setIsSuccess(true);
				updateData({ hash: finalTx });
				toast.success("Order cancelled successfully!");
				return true;
			} else {
				console.error("[useGaslessEscrowCancel] Transaction failed");
				setIsLoading(false);
				setIsSuccess(false);
				updateData({ hash: null });
				return false;
			}
		} catch (error: any) {
			console.error("[useGaslessEscrowCancel] Error cancelling order:", error);
			
			// Handle specific error cases
			if (error.message?.includes('Transaction simulation failed')) {
				try {
					const errorJson = JSON.parse(error.message.split('Transaction simulation failed: ')[1]);
					if (errorJson.InstructionError?.[1]?.Custom === 6010) {
						toast.error('Cannot cancel yet. Please wait for the required time period.', {
							theme: "dark",
							position: "top-right",
							autoClose: 5000,
						});
					} else if (errorJson.InstructionError?.[1]?.Custom === 1) {
						toast.error('Insufficient balance for cancellation', {
							theme: "dark",
							position: "top-right",
							autoClose: 5000,
						});
					}
				} catch (parseError) {
					console.error('[useGaslessEscrowCancel] Error parsing simulation error:', parseError);
				}
			} else if (error.message?.includes('blockhash not found')) {
				toast.error('Network error. Please try again.', {
					theme: "dark",
					position: "top-right",
					autoClose: 5000,
				});
			} else {
				toast.error(error.message || "An error occurred while cancelling the order. Please try again.", {
					theme: "dark",
					position: "top-right",
					autoClose: 5000,
				});
			}

			setIsLoading(false);
			setIsSuccess(false);
			return false;
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
		cancelOrder
	};
};

export default useGaslessEscrowCancel;
