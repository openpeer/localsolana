import { getAuthToken } from '@dynamic-labs/sdk-react-core';
//import { OpenPeerEscrow } from 'abis';
import { Button, Modal } from 'components';
import TransactionLink from 'components/TransactionLink';
import { useCancelReasons, useAccount, useTransactionFeedback } from 'hooks';
//import { useEscrowCancel } from 'hooks/transactions';
import { Order } from 'models/types';
import React, { useEffect, useState } from 'react';
import { parseUnits } from 'viem';

import CancelReasons from './CancelReasons';
import { useContractRead } from '@/hooks/transactions/useContractRead';
import { BN } from '@coral-xyz/anchor';
import useEscrowCancel from '@/hooks/transactions/cancel/useEscrowCancel';
import useGaslessEscrowCancel from '@/hooks/transactions/cancel/useGaslessEscrowCancel';
import { toast } from 'react-toastify';

interface BlockchainCancelButtonParams {
	order: Order;
	outlined?: boolean;
	title?: string;
}
const BlockchainCancelButton = ({ order, outlined, title = 'Cancel Order' }: BlockchainCancelButtonParams) => {
	const { escrow, buyer, seller, trade_id: tradeId, uuid, list, token_amount: tokenAmount } = order;
	const { token } = list;
	const { isConnected, address: connectedAddress } = useAccount();
	const { cancellation, otherReason, setOtherReason, toggleCancellation } = useCancelReasons();
	const isBuyer = buyer.address === connectedAddress;
	const isSeller = seller.address === connectedAddress;
	const [modalOpen, setModalOpen] = useState(false);
	const [cancelConfirmed, setCancelConfirmed] = useState(false);

	const { data: escrowData, loading } = useContractRead(
		tradeId,
		"escrow",
		true
	);
	const { isLoading, isSuccess, cancelOrder, data, isFetching } = useGaslessEscrowCancel({
		orderID: order.id.toString(),
		seller: seller.address,
		token: token,
		contract: tradeId,
		buyer: buyer.address,
		amount: tokenAmount,
		isBuyer: isBuyer
	});

	useTransactionFeedback({
		hash: data?.hash,
		isSuccess,
		Link: <TransactionLink hash={data?.hash} />,
		description: 'Cancelled the order'
	});

	useEffect(() => {
		if (cancelConfirmed) {
			onBlockchainCancel();
		}
	}, [cancelConfirmed]);

	useEffect(() => {
		const saveCancellationReasons = async () => {
			try {
				const result = await fetch(`/api/orders/${order.id}/cancel`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${getAuthToken()}`
					},
					body: JSON.stringify({
						cancellation,
						other_reason: otherReason && otherReason !== '' ? otherReason : undefined
					})
				});
				const savedOrder = await result.json();

				if (savedOrder.status === 200) {
					window.location.reload();
				} else {
					toast.error('Error updating cancellation reasons', {
						theme: 'dark',
						position: 'top-right',
						autoClose: 5000,
						hideProgressBar: false,
						closeOnClick: true,
						pauseOnHover: true,
						draggable: false,
						progress: undefined
					});
				}
			} catch (error) {
				console.error("[BlockchainCancelButton] Error saving cancellation reasons:", error);
				toast.error('Failed to update order status. Please contact support.', {
					theme: 'dark',
					position: 'top-right',
					autoClose: 5000,
				});
			}
		};

		if (isSuccess) {
			saveCancellationReasons();
		}
	}, [isSuccess, order.id, cancellation, otherReason]);

	if (loading || isFetching) {
		return <Button title="Loading..." processing outlined={outlined} />;
	}

	// Get the current time in seconds since epoch
	const now = Math.floor(Date.now() / 1000);

	// Handle seller cancellation time - only sellers have a time restriction
	const sellerCanCancelAfter = ((escrowData?.sellerCanCancelAfter ?? new BN(0)) as BN).toNumber();
	const sellerCantCancel = isSeller && sellerCanCancelAfter > now;
	const timeLeft = sellerCantCancel ? sellerCanCancelAfter - now : 0;
	const formattedTimeLeft = Math.max(0, Math.ceil(timeLeft / 60)); // Convert to minutes and ensure non-negative

	// Only apply restrictions to seller
	const cantCancel = sellerCantCancel;

	const onBlockchainCancel = async () => {
		if (!isConnected) {
			toast.error('Please connect your wallet first', {
				theme: 'dark',
				position: 'top-right',
				autoClose: 5000,
			});
			return;
		}

		if (cantCancel) {
			toast.error(`You cannot cancel yet. Please wait approximately ${formattedTimeLeft} minutes.`, {
				theme: 'dark',
				position: 'top-right',
				autoClose: 5000,
			});
			return;
		}

		if (!cancelConfirmed) {
			setModalOpen(true);
			return;
		}

		await cancelOrder?.();
	};

	const buttonTitle = cantCancel 
		? `Cannot cancel (${formattedTimeLeft}m)`
		: isLoading 
			? 'Processing...' 
			: isSuccess 
				? 'Done' 
				: title;

	return (
		<>
			<Button
				title={buttonTitle}
				processing={isLoading}
				onClick={onBlockchainCancel}
				outlined={outlined}
				disabled={cantCancel || isLoading || isSuccess}
			/>
			<Modal
				actionButtonTitle="Yes, confirm"
				title={
					<div className="flex flex-col">
						<div>Cancel Order?</div>
						<div>The escrowed funds will return to {isBuyer ? 'the seller' : 'you'}.</div>
					</div>
				}
				content={
					<CancelReasons
						setOtherReason={setOtherReason}
						toggleCancellation={toggleCancellation}
						showOtherReason={cancellation.other}
					/>
				}
				type="alert"
				open={modalOpen}
				onClose={() => setModalOpen(false)}
				onAction={() => setCancelConfirmed(true)}
				actionDisabled={Object.keys(cancellation).length === 0 || (cancellation.other && !otherReason)}
			/>
		</>
	);
};

export default BlockchainCancelButton;
