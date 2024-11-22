// hooks/transactions/release/useGaslessReleaseFunds.ts

import { truncate } from './../../../utils/index';
import { useAccount } from 'hooks';
import { useState } from 'react';

import { PublicKey } from '@solana/web3.js';
import { UseEscrowTransactionProps } from '../types';
import useLocalSolana from '../useLocalSolana';
import useShyft from '../useShyft';
import useHelius from '../useHelius';

interface Data {
	hash?: string;
}

const useGaslessReleaseFunds = ({ orderID, buyer, token, seller }: UseEscrowTransactionProps) => {
	const [data, updateData] = useState<Data>({});
	const [isSuccess, setIsSuccess] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const { address } = useAccount();
	const{shyft,sendTransactionWithShyft} = useShyft();

	const { releaseFunds, getEscrowPDA } = useLocalSolana();
	const { getAccountInfo, connection } = useHelius();

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
			console.log('order id',orderID);

			const escrowPDA = await getEscrowPDA(orderID);
			console.log('Derived escrow address:', escrowPDA?.toString());

            if (!escrowPDA) {
                console.error('Could not derive escrow address');
                setIsLoading(false);
                setIsSuccess(false);
                return;
            }

						const escrowExists = await verifyEscrowExists(escrowPDA);
            if (!escrowExists) {
                console.error('Escrow account not found');
                setIsLoading(false);
                setIsSuccess(false);
                return;
            }

						const tx = await releaseFunds(
							orderID,
							new PublicKey(seller),
							new PublicKey(buyer),
							new PublicKey(token.address),
					);


					const finalTx = await sendTransactionWithShyft(tx, true);
					if (finalTx !== undefined) {
							setIsLoading(false);
							setIsSuccess(true);
							updateData({ hash: finalTx });
					} else {
							console.error('error', finalTx);
							setIsLoading(false);
							setIsSuccess(false);
					}
			} catch (error) {
					console.error('error', error);
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
