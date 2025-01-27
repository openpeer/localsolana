// hooks/transactions/useOpenDispute.ts

import { useState } from 'react';
import { useAccount } from 'hooks';
import useShyft from './useShyft';
import useLocalSolana from './useLocalSolana';
import { PublicKey } from '@solana/web3.js';
// import useHelius from './useHelius'; // Added Helius integration


interface Data {
  hash?: string | null;
}

const useOpenDispute = ({ orderID }: {orderID:string}) => {
	const [data, updateData] = useState<Data>({});
	const [isSuccess, setIsSuccess] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const { address } = useAccount();
	const { sendTransactionWithShyft, getAccountInfo } = useShyft();
	const { openDispute } = useLocalSolana();

  if (!address) {
    console.error("[useOpenDispute] Address not available. Cannot open dispute.");
    return { isFetching: false, isSuccess, isLoading, data };
  }

	const opensDispute = async () => {
		console.log("[useOpenDispute] Starting dispute process:", {
			orderID,
			userAddress: address
		});

		setIsLoading(true);
		try {
			// Check account info
			console.log("[useOpenDispute] Checking sender account:", address);
			const senderAccountInfo = await getAccountInfo(address);
			if (!senderAccountInfo) {
				console.error("[useOpenDispute] Sender account not found:", {
					address,
					accountInfo: senderAccountInfo
				});
				setIsSuccess(false);
				return false;
			}

			console.log("[useOpenDispute] Creating dispute transaction");
			const tx = await openDispute(orderID, new PublicKey(address));
			if (!tx) {
				console.error("[useOpenDispute] Failed to create dispute transaction");
				setIsSuccess(false);
				return false;
			}

			console.log("[useOpenDispute] Sending transaction for processing");
			const finalTx = await sendTransactionWithShyft(tx, true, orderID);
			if (finalTx) {
				console.log("[useOpenDispute] Transaction successful:", {
					hash: finalTx,
					orderID
				});
				updateData({hash: finalTx});
				setIsSuccess(true);
				return true;
			} else {
				console.error("[useOpenDispute] Transaction relaying failed:", {
					tx: finalTx,
					orderID
				});
				setIsSuccess(false);
				return false;
			}
		} catch (error) {
			console.error("[useOpenDispute] Error during dispute process:", {
				error,
				orderID,
				address
			});
			setIsSuccess(false);
			return false;
		} finally {
			console.log("[useOpenDispute] Dispute process completed:", {
				success: isSuccess,
				hash: data.hash
			});
			setIsLoading(false);
		}
	};
	return { isFetching: false, isLoading, isSuccess, data, opensDispute };
};

export default useOpenDispute;
