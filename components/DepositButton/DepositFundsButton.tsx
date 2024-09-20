import { useAccount, useTransactionFeedback } from 'hooks';
import { useDepositFunds } from 'hooks/transactions';
import React, { useEffect, useState } from 'react';
import { parseUnits } from 'viem';

import TransactionLink from 'components/TransactionLink';
import Button from 'components/Button/Button';
import ModalWindow from 'components/Modal/ModalWindow';
import { DepositFundsParams } from './DepositFundsButton.types';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import useGaslessDepositFunds from '@/hooks/transactions/deposit/useGaslessDepositFunds';

const DepositFundsButton = ({ token, tokenAmount, contract, disabled }: DepositFundsParams) => {
	const { primaryWallet } = useDynamicContext();
	const amount = tokenAmount* 10 ** (token.decimals);
	const [modalOpen, setModalOpen] = useState(false);
	const [depositConfirmed, setDepositConfirmed] = useState(false);

	const { isLoading, isSuccess, data, depositFunds, isFetching } = useGaslessDepositFunds({
		amount,
		token,
		contract
	});

	console.log('amount and token in:: ',tokenAmount * 10 ** token.decimals,amount,token.decimals);
	const deposit = () => {
		console.log(primaryWallet?.isAuthenticated);
		if (!primaryWallet?.isAuthenticated) return;

		if (!depositConfirmed) {
			setModalOpen(true);
			return;
		}
		depositFunds?.();
	};

	useEffect(() => {
		if (depositConfirmed) {
			deposit();
		}
	}, [depositConfirmed]);

	useTransactionFeedback({
		hash: data?.hash,
		isSuccess,
		Link: <TransactionLink hash={data?.hash} />,
		description: 'Deposited funds'
	});

	return (
		<>
			<Button
				title={isLoading ? 'Processing...' : isSuccess ? 'Done' : `Deposit ${token.name}`}
				onClick={deposit}
				processing={isLoading || isFetching}
				disabled={isSuccess || isFetching || disabled}
			/>
			<ModalWindow
				actionButtonTitle="Yes, confirm"
				title="Deposit funds?"
				content={`The funds will be sent to your escrow contract (${contract}).`}
				type="confirmation"
				open={modalOpen}
				onClose={() => setModalOpen(false)}
				onAction={() => setDepositConfirmed(true)}
			/>
		</>
	);
};

export default DepositFundsButton;
