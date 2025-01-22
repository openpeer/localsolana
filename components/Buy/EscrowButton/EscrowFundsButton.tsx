import { Button, Modal } from 'components';
import { useAccount } from 'hooks';
import React, { useEffect, useState } from 'react';
import { EscrowFundsButtonProps } from './EscrowButton.types';
import useGaslessEscrow from '@/hooks/transactions/escrow/useGaslessEscrow';
import { getAuthToken } from '@dynamic-labs/sdk-react-core';

const EscrowFundsButton = ({
	uuid,
	buyer,
	token,
	tokenAmount,
	fee,
	contract,
	instantEscrow,
	sellerWaitingTime,
	seller
}: EscrowFundsButtonProps) => {
	const { isConnected } = useAccount();
	const amount = tokenAmount;
	const [modalOpen, setModalOpen] = useState(false);
	const [escrowConfirmed, setEscrowConfirmed] = useState(false);

	const { escrowFunds, isLoading, isSuccess, data } = useGaslessEscrow({
		contract,
		orderID: uuid,
		buyer,
		seller,
		token,
		amount: tokenAmount,
		instantEscrow,
		sellerWaitingTime
	});

	const handleEscrow = async () => {
		if (!escrowFunds) return;

		try {
			const result = await escrowFunds();
			
			if (isSuccess) {
				const response = await fetch(`/api/orders/${uuid}`, {
						method: 'PUT',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${getAuthToken()}`
						},
						body: JSON.stringify({
							status: 'escrowed'
						})
					});
			}
		} catch (error) {
			console.error("Error in escrow process:", error);
		}
	};

	useEffect(() => {
		if (escrowConfirmed) {
			handleEscrow();
		}
	}, [escrowConfirmed]);

	const updateTrade = async () => {
		const result = await fetch(`/api/updateOrder?id=${uuid}`, {
			method: 'POST',
			body: JSON.stringify({status: 1}),
			headers: {
				Authorization: `Bearer ${getAuthToken()}`,
				'Content-Type': 'application/json',
			}
		});
	};

	useEffect(() => {
		if (isSuccess && data?.hash) {
			updateTrade();
		}
	}, [data?.hash, isSuccess]);

	return (
		<>
			<Button
				title={
					isLoading ? 'Processing...' : isSuccess ? 'Done' : instantEscrow ? 'Confirm Order' : 'Escrow funds'
				}
				onClick={handleEscrow}
				processing={isLoading}
				disabled={isSuccess || isLoading}
			/>
			<Modal
				actionButtonTitle="Yes, confirm"
				title={instantEscrow ? 'Confirm order?' : 'Escrow funds?'}
				content={`The funds will be ${
					instantEscrow ? 'locked in the' : 'sent to your'
				} escrow contract (${contract}).`}
				type="confirmation"
				open={modalOpen}
				onClose={() => setModalOpen(false)}
				onAction={() => setEscrowConfirmed(true)}
			/>
		</>
	);
};

export default EscrowFundsButton;
