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

	const { data: escrowData, loadingContract } = useContractRead(
		tradeId,
		"escrow",
		true
	  );
	const { isLoading, isSuccess, cancelOrder, data, isFetching } = useGaslessEscrowCancel({
		isBuyer:isBuyer,
		orderID:order.id.toString(),
		buyer:buyer.address,
		token:token,
		contract:tradeId,
		seller:seller.address,
		amount:tokenAmount
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
				toast.error('Error cancelling the order', {
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
	}
		if (isSuccess) {
			saveCancellationReasons();
		}
	}, [isSuccess]);

	if (loadingContract) {
		return <p>Loading...</p>;
	}

	const sellerCanCancelAfter = ((escrowData?.sellerCanCancelAfter?? new BN(0)) as BN).toNumber();


	const sellerCanCancelAfterSeconds = parseInt(sellerCanCancelAfter.toString(), 10);

	const now = Date.now() / 1000;
	const sellerCantCancel = isSeller && (sellerCanCancelAfterSeconds <= 1 || sellerCanCancelAfterSeconds > now);

	const onBlockchainCancel = () => {
		if (!isConnected || sellerCantCancel) return;

		if (!cancelConfirmed) {
			setModalOpen(true);
			return;
		}

		cancelOrder?.();
	};

	return (
		<>
			<Button
				title={
					sellerCantCancel ? 'You cannot cancel' : isLoading ? 'Processing...' : isSuccess ? 'Done' : title
				}
				processing={isLoading || isFetching}
				disabled={isSuccess || sellerCantCancel || sellerCantCancel || isFetching}
				onClick={onBlockchainCancel}
				outlined={outlined}
			/>
			<>
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
		</>
	);
};

export default BlockchainCancelButton;
