import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { Button, Modal } from 'components';
import TransactionLink from 'components/TransactionLink';
import { useTransactionFeedback, useAccount } from 'hooks';
import { useReleaseFunds } from 'hooks/transactions';
import { Order } from 'models/types';
import React, { useEffect, useState } from 'react';
import { parseUnits } from 'viem';

interface ReleaseFundsButtonParams {
	order: Order;
	title?: string;
	outlined?: boolean;
	dispute: boolean;
}

const ReleaseFundsButton = ({
	order,
	dispute,
	outlined = false,
	title = 'Release Funds'
}: ReleaseFundsButtonParams) => {
	const { escrow, uuid, buyer, token_amount: tokenAmount, list } = order;
	const { token } = list;
	const { isConnected } = useAccount();

	const { isLoading, isSuccess, data, releaseFund, isFetching } = useReleaseFunds({
		orderID: order.id.toString(),
		buyer: buyer.address,
		token,
		seller: order.seller.address,
		contract: order.trade_id, // Assuming escrow has a contractAddress property
		amount: tokenAmount // Assuming token has a decimals property
	});
	const [modalOpen, setModalOpen] = useState(false);
	const [releaseConfirmed, setReleaseConfirmed] = useState(false);

	const onReleaseFunds = () => {
		if (!isConnected) return;

		if (!releaseConfirmed) {
			setModalOpen(true);
			return;
		}

		releaseFund?.();
	};

	// useTransactionFeedback({
	// 	hash: data?.hash,
	// 	isSuccess,
	// 	Link: <TransactionLink hash={data?.hash} />,
	// 	description: 'Released the funds'
	// });

	useEffect(() => {
		if (releaseConfirmed) {
			onReleaseFunds();
		}
	}, [releaseConfirmed]);
	useEffect(()=>{
		if(isSuccess && data){
            updateTrade();
		}
	},[ isSuccess]);
    const updateTrade = async () => {
		const result = await fetch(`/api/updateOrder/?id=${order.id}`, {
			method: 'POST',
			body: JSON.stringify({status:5}),
			headers: {
				Authorization: `Bearer ${getAuthToken()}`,
				'Content-Type': 'application/json',
			}
		});

		if(result.status===200){
			await fetch(`/api/transaction`, {
				method: 'POST',
				body: JSON.stringify({
					order_id:order.id,
					tx_hash:data?.hash
				}),
				headers: {
					Authorization: `Bearer ${getAuthToken()}`,
					'Content-Type': 'application/json',
				}
			});
		}
    };
	return (
		<>
			<Button
				title={isLoading ? 'Processing...' : isSuccess ? 'Done' : title}
				processing={isLoading || isFetching}
				disabled={isSuccess || isFetching}
				onClick={onReleaseFunds}
				outlined={outlined}
			/>

			<Modal
				actionButtonTitle={dispute ? 'Yes, confirm' : 'Yes I have received'}
				title={dispute ? 'Are you sure?' : 'Are you sure you have received this payment in your account?'}
				content={
					dispute
						? 'This will send the funds escrowed to the buyer!'
						: 'Ensure you have received the exact amount before confirming this payment. Failure to do so may result in permanent loss of funds.'
				}
				type="confirmation"
				open={modalOpen}
				onClose={() => setModalOpen(false)}
				onAction={() => setReleaseConfirmed(true)}
			/>
		</>
	);
};

export default ReleaseFundsButton;
