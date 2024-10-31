import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { Button, Modal } from 'components';
import { useCancelReasons, useConfirmationSignMessage, useAccount } from 'hooks';
import { Order } from 'models/types';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import BlockchainCancelButton from './BlockchainCancelButton';
import CancelReasons from './CancelReasons';

interface CancelOrderButtonParams {
	order: Order;
	outlined?: boolean;
	title?: string;
}

const CancelOrderButton = ({ order, outlined = true, title = 'Cancel Order' }: CancelOrderButtonParams) => {
	const { seller, buyer, uuid, status,id } = order;

	const { address } = useAccount();
	const { cancellation, otherReason, setOtherReason, toggleCancellation } = useCancelReasons();

	const isBuyer = buyer.address === address;
	const isSeller = seller.address === address;
	const message = `Cancel order ${uuid}`;

	const [modalOpen, setModalOpen] = useState(false);
	const [cancelConfirmed, setCancelConfirmed] = useState(false);

	const cancelOrder = async () => {

			const result = await fetch(`/api/orders/${id}/cancel`, {
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

	const cancelIsNotAvailable = ['cancelled', 'closed'].includes(order.status);
	const simpleCancel: boolean = !order.trade_id && order.status === 'created'; 

	const onCancelOrder = () => {
		if (cancelIsNotAvailable) return;

		if (!cancelConfirmed) {
			setModalOpen(true);
			return;
		}

		if (simpleCancel) {
			cancelOrder();
		}
	};

	useEffect(() => {
		if (cancelConfirmed) {
			onCancelOrder();
		}
	}, [cancelConfirmed]);

	if ((!isBuyer && !isSeller) || cancelIsNotAvailable) return <></>;

	return simpleCancel ? (
		<>
			<Button title={title} onClick={onCancelOrder} outlined={outlined} />
			<Modal
				actionButtonTitle="Yes, confirm"
				title="Cancel Order?"
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
	) : (
		<BlockchainCancelButton order={order} title={title} outlined={outlined} />
	);
};

export default CancelOrderButton;
