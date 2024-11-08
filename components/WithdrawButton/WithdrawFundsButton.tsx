import { useTransactionFeedback, useAccount } from 'hooks';
import { useWithdrawFunds } from 'hooks/transactions';
import React, { useEffect, useState } from 'react';
import { parseUnits } from 'viem';

import TransactionLink from 'components/TransactionLink';
import Button from 'components/Button/Button';
import ModalWindow from 'components/Modal/ModalWindow';
import { WithdrawFundsButtonProps } from './WithdrawFundsButton.types';

const WithdrawFundsButton = ({ token, tokenAmount, contract, disabled,onFundsDWithdrawn}: WithdrawFundsButtonProps) => {
	const { isConnected, address } = useAccount();
	const amount = tokenAmount;
	const [modalOpen, setModalOpen] = useState(false);
	const [withdrawConfirmed, setWithdrawConfirmed] = useState(false);

	const { isLoading, isSuccess, data,withdrawFunds , isFetching } = useWithdrawFunds({
		amount,
		token,
		contract
	});

	const withdraw = async () => {
		if (!isConnected) return;

		if (!withdrawConfirmed) {
			setModalOpen(true);
			return;
		}
		await withdrawFunds?.();
		onFundsDWithdrawn();
		
	};

	useEffect(() => {
		if (withdrawConfirmed) {
			withdraw();
		}
	}, [withdrawConfirmed]);

	// useTransactionFeedback({
	// 	hash: data?.hash,
	// 	isSuccess,
	// 	Link: <TransactionLink hash={data?.hash} />,
	// 	description: 'Withdrew funds',
    
	// });

	return (
		<>
			<Button
				title={isLoading ? 'Processing...' : isSuccess ? 'Done' : `Withdraw ${token.name}`}
				onClick={withdraw}
				processing={isLoading || isFetching}
				disabled={isSuccess || isFetching || disabled}
			/>
			<ModalWindow
				actionButtonTitle="Yes, confirm"
				title="Withdraws funds?"
				content={`The funds will be sent to your address (${address}).`}
				type="confirmation"
				open={modalOpen}
				onClose={() => setModalOpen(false)}
				onAction={() => setWithdrawConfirmed(true)}
			/>
		</>
	);
};

export default WithdrawFundsButton;