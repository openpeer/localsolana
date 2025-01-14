// hooks/transactions/release/useGaslessReleaseFunds.ts

import { truncate } from './../../../utils/index';
import { useAccount } from 'hooks';
import { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import { UseEscrowTransactionProps } from '../types';
import useLocalSolana from '../useLocalSolana';
import useShyft from '../useShyft';
import { feePayer } from "@/utils/constants";

// Use environment variable for fee recipient
const PLATFORM_FEE_RECIPIENT = process.env.NEXT_PUBLIC_FEE_RECEPIENT || "2Azwo32Xdjd6Q6bit1Taf93vztSaAxPMMAFeAkyf7Mzs";

interface Data {
	hash?: string;
}

const useGaslessReleaseFunds = ({ orderID, buyer, token, seller }: UseEscrowTransactionProps) => {
	const [data, updateData] = useState<Data>({});
	const [isSuccess, setIsSuccess] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isInitialized, setIsInitialized] = useState(false);

	const { address } = useAccount();
	const { shyft, sendTransactionWithShyft } = useShyft();
	const { releaseFunds, getEscrowPDA } = useLocalSolana();
	const { getAccountInfo, connection } = useShyft();

	useEffect(() => {
		if (shyft && connection) {
			setIsInitialized(true);
		}
	}, [shyft, connection]);

	const verifyEscrowExists = async (escrowAddress: PublicKey) => {
		try {
			console.debug("[useGaslessReleaseFunds] Verifying escrow account:", escrowAddress.toString());
			const accountInfo = await getAccountInfo(escrowAddress.toString());
			console.debug("[useGaslessReleaseFunds] Escrow account info:", accountInfo);
			return accountInfo !== null;
		} catch (error) {
			console.error('[useGaslessReleaseFunds] Error verifying escrow account:', error);
			return false;
		}
	};

	const releaseFund = async () => {
		if (!isInitialized) {
			console.debug('[useGaslessReleaseFunds] Waiting for initialization...');
			return;
		}

		try {
			setIsLoading(true);
			console.debug('[useGaslessReleaseFunds] Starting release funds for order:', orderID);
			console.debug('[useGaslessReleaseFunds] Parameters:', {
				buyer,
				seller,
				token: token.address
			});

			if (!feePayer) {
				console.error('[useGaslessReleaseFunds] Fee payer not configured');
				setIsLoading(false);
				setIsSuccess(false);
				return;
			}

			const escrowPDA = await getEscrowPDA(orderID);
			console.debug('[useGaslessReleaseFunds] Derived escrow PDA:', escrowPDA?.toString());

			if (!escrowPDA) {
				console.error('[useGaslessReleaseFunds] Could not derive escrow address');
				setIsLoading(false);
				setIsSuccess(false);
				return;
			}

			const escrowExists = await verifyEscrowExists(escrowPDA);
			if (!escrowExists) {
				console.error('[useGaslessReleaseFunds] Escrow account not found');
				setIsLoading(false);
				setIsSuccess(false);
				return;
			}

			// Get fee recipient token account for the specific token being used
			const feeRecipient = new PublicKey(PLATFORM_FEE_RECIPIENT);
			const tokenMint = new PublicKey(token.address);
			
			// Derive the associated token account address
			const feeRecipientTokenAccount = await getAssociatedTokenAddress(
				tokenMint,
				feeRecipient,
				false // allowOwnerOffCurve
			);
			
			console.debug("[useGaslessReleaseFunds] Derived fee recipient token account:", {
				feeRecipient: feeRecipient.toBase58(),
				tokenMint: tokenMint.toBase58(),
				tokenAccount: feeRecipientTokenAccount.toBase58()
			});

			// Create release funds transaction first
			console.debug('[useGaslessReleaseFunds] Creating release funds transaction');
			const releaseTransaction = await releaseFunds(
				orderID,
				new PublicKey(seller),
				new PublicKey(buyer),
				new PublicKey(token.address),
			);
			console.debug('[useGaslessReleaseFunds] Release transaction created with instructions:', releaseTransaction.instructions);

			// Check if fee recipient token account exists
			if (!connection) {
				console.error('[useGaslessReleaseFunds] Connection not available');
				setIsLoading(false);
				setIsSuccess(false);
				return;
			}

			const accountInfo = await connection.getAccountInfo(feeRecipientTokenAccount);
			console.debug("[useGaslessReleaseFunds] Fee recipient token account info:", accountInfo);
			
			// If account doesn't exist, add instruction to create it
			if (!accountInfo) {
				console.debug("[useGaslessReleaseFunds] Fee recipient token account doesn't exist, creating ATA instruction");
				const createAtaInstruction = createAssociatedTokenAccountInstruction(
					new PublicKey(feePayer), // payer
					feeRecipientTokenAccount, // ata
					feeRecipient, // owner
					tokenMint // mint
				);
				
				// Add the create ATA instruction at the beginning
				console.debug("[useGaslessReleaseFunds] Adding ATA creation instruction to transaction");
				releaseTransaction.instructions = [
					createAtaInstruction,
					...releaseTransaction.instructions
				];
				console.debug("[useGaslessReleaseFunds] Final transaction instructions:", releaseTransaction.instructions);
			}

			console.debug('[useGaslessReleaseFunds] Sending transaction with Shyft');
			const finalTx = await sendTransactionWithShyft(releaseTransaction, true, orderID);
			console.debug('[useGaslessReleaseFunds] Transaction result:', finalTx);

			if (finalTx !== undefined && finalTx !== null) {
				console.debug('[useGaslessReleaseFunds] Transaction successful');
				setIsLoading(false);
				setIsSuccess(true);
				updateData({ hash: finalTx });
			} else {
				console.error('[useGaslessReleaseFunds] Transaction failed');
				setIsLoading(false);
				setIsSuccess(false);
			}
		} catch (error) {
			console.error('[useGaslessReleaseFunds] Error during release:', error);
			setIsLoading(false);
			setIsSuccess(false);
		} finally {
			setIsLoading(false);
		}
	};

	return {
		isFetching: false,
		gaslessEnabled: isInitialized,
		isLoading,
		isSuccess,
		data,
		releaseFund
	};
};

export default useGaslessReleaseFunds;
