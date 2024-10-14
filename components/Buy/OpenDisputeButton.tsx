/* eslint-disable @typescript-eslint/indent */
// import { OpenPeerEscrow } from 'abis';
import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { Button, Modal } from 'components';
import TransactionLink from 'components/TransactionLink';
import {  useTransactionFeedback, useAccount } from 'hooks'; //useOpenDispute
import { Order } from 'models/types';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Abi, formatUnits, parseUnits } from 'viem';
// import { useBalance, useContractReads, useNetwork } from 'wagmi';

interface OpenDisputeButtonParams {
	order: Order;
	outlined?: boolean;
	title?: string;
}

const OpenDisputeButton = ({ order, outlined = true, title = 'Open a dispute' }: OpenDisputeButtonParams) => {
	const { uuid, escrow, buyer, seller, trade_id: tradeId, token_amount: tokenAmount, list } = order;
	const { token } = list;
	const { isConnected, address: connectedAddress } = useAccount();
	const isBuyer = buyer.address === connectedAddress;
	const isSeller = seller.address === connectedAddress;
	const router = useRouter();
	// const escrowAddress = escrow!.address;
	// const escrowContract = { address: escrowAddress, abi: OpenPeerEscrow as Abi };
	const [modalOpen, setModalOpen] = useState(false);
	const [disputeConfirmed, setDisputeConfirmed] = useState(false);
	// const { chain } = useNetwork();

	// const { data: readData = [], isFetching } = useContractReads({
	// 	contracts: [
	// 		{ ...escrowContract, ...{ functionName: 'escrows', args: [tradeId] } },
	// 		{ ...escrowContract, ...{ functionName: 'disputeFee' } },
	// 		// @ts-ignore
	// 		{ ...escrowContract, ...{ functionName: 'disputePayments', args: [tradeId, connectedAddress] } }
	// 	]
	// });

	// const { data: balance } = useBalance({
	// 	address: connectedAddress,
	// 	enabled: !!connectedAddress
	// });

	// const [escrowDataResult, disputeFeeResult, paidForDisputeResult] = readData as { result: unknown }[];

	// const { isLoading, isSuccess, openDispute, data } = useOpenDispute({
	// 	contract: escrowAddress,
	// 	orderID: uuid,
	// 	buyer: buyer.address,
	// 	token,
	// 	amount: parseUnits(String(tokenAmount), token.decimals),
	// 	disputeFee: disputeFeeResult?.result as bigint
	// });

	// useTransactionFeedback({
	// 	hash: data?.hash,
	// 	isSuccess,
	// 	Link: <TransactionLink hash={data?.hash} />,
	// 	description: 'Opened a dispute'
	// });

	// useEffect(() => {
	// 	if (isSuccess) {
	// 		router.push(`/orders/${uuid}`);
	// 	}
	// }, [isSuccess, uuid]);

	useEffect(() => {
		const cancelOrder = async () => {
			if (disputeConfirmed) {
			  try {
				const result = await fetch(`/api/updateOrder?id=${order.id}`, {
				  method: 'POST',
				  headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${getAuthToken()}`
				  },
				  body: JSON.stringify({
					status:4
				  })  // No need for an empty object here, unless there's data to send
				});
		
				const savedOrder = await result.json();
		
				if (savedOrder.status === 200) {
				  window.location.reload();
				} else {
				  toast.error('Error while opening an order', {
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
		
				onOpenDispute();
			  } catch (error) {
				toast.error('An error occurred while canceling the order', {
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
		  };
		
		cancelOrder();
		// if (disputeConfirmed) {
		// 	onOpenDispute();
		// }
	}, [disputeConfirmed]);

	// if (
	// 	isFetching ||
	// 	disputeFeeResult === undefined ||
	// 	paidForDisputeResult === undefined ||
	// 	balance?.value === undefined ||
	// 	chain === undefined
	// ) {
	// 	return <p>Loading...</p>;
	// }

	// const {
	// 	nativeCurrency: { decimals, symbol }
	// } = chain;

	// const [, sellerCanCancelAfter] = escrowDataResult.result as [boolean, bigint];
	// const disputeFee = disputeFeeResult.result as bigint;
	// const canOpenDispute = (isBuyer || isSeller) && parseInt(sellerCanCancelAfter.toString(), 10) === 1;
	const canOpenDispute = (isBuyer || isSeller) && parseInt('60', 10) === 1;

	const onOpenDispute = () => {
		// if (!isConnected || !canOpenDispute) return;

		if (!disputeConfirmed) {
			setModalOpen(true);
			return;
		}

		// if (disputeFee > balance.value) {
		// 	toast.error(`You need ${formatUnits(disputeFee, decimals)} ${symbol} to open a dispute`, {
		// 		theme: 'dark',
		// 		position: 'top-right',
		// 		autoClose: 10000,
		// 		hideProgressBar: false,
		// 		closeOnClick: true,
		// 		pauseOnHover: true,
		// 		draggable: false,
		// 		progress: undefined
		// 	});
		// } else {
		// 	openDispute?.();
		// }
	};

	return (
		<>
		<Button title={title} onClick={onOpenDispute}/>
			{/* <Button
				title={
					// (paidForDisputeResult.result as boolean)
					true
						? 'Already opened'
						: !canOpenDispute
						? 'You cannot dispute'
						: isLoading
						? 'Processing...'
						: isSuccess
						? 'Done'
						: title
				}
				processing={isLoading}
				disabled={isSuccess || !canOpenDispute || (paidForDisputeResult.result as boolean)}
				onClick={onOpenDispute}
				outlined={outlined}
			/> */}
			<Modal
				actionButtonTitle="Yes, confirm"
				title="Dispute Trade"
				// content={`Once you dispute the trade the other party will have 24 hours to counter the dispute and send it to arbitration. A small fee of ${formatUnits(
				// 	disputeFee,
				// 	decimals
				// )} ${symbol} is required to open a dispute. If you win the dispute the fee will be returned`}
				content={`Once you dispute the trade the other party will have 24 hours to counter the dispute and send it to arbitration. A small fee of ${formatUnits(
					BigInt(200),
					2
				)} ${"symbol"} is required to open a dispute. If you win the dispute the fee will be returned`}
				type="confirmation"
				open={modalOpen}
				onClose={() => setModalOpen(false)}
				onAction={() => setDisputeConfirmed(true)}
			/>
		</>
	);
};

export default OpenDisputeButton;
