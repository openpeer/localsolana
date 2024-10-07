import useGaslessMarkAsPaid from '@/hooks/transactions/markAsPaid/useGaslessMarkAsPaid';
import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { Button } from 'components';
import TransactionLink from 'components/TransactionLink';
import { useAccount, useTransactionFeedback } from 'hooks';
//import { useMarkAsPaid } from 'hooks/transactions';
import { Order } from 'models/types';
import React, { useEffect, useRef } from 'react';
import { parseUnits } from 'viem';
import { UIOrder } from './Buy.types';

interface MarkAsPaidButtonParams {
	order: Order;
	updateOrder: (t: UIOrder) => void;
	
}

const MarkAsPaidButton = ({ order,updateOrder }: MarkAsPaidButtonParams) => {
	const { escrow, uuid, buyer, token_amount: tokenAmount, list } = order;
	const { token } = list;
	const { isConnected } = useAccount();

	const { isFetching, isLoading, isSuccess=false, data, marksAsPaid } = useGaslessMarkAsPaid(
		{ orderID: order.id.toString(),buyer:order.buyer.address,seller:order.seller.address },
	);

	const onPaymentDone = async() => {
		if (!isConnected) return;
		await marksAsPaid?.();
	};

	// useTransactionFeedback({
	// 	hash: data?.hash,
	// 	isSuccess,
	// 	Link: <TransactionLink hash={data?.hash} />,
	// 	description: 'Marked the order as paid'
	// });


	const prevIsSuccessRef = useRef<boolean>(false);


	useEffect(()=>{
		if(isSuccess && !prevIsSuccessRef.current){
			prevIsSuccessRef.current = true;
            updateTrade();
			
		}
	},[ isSuccess]);
    const updateTrade = async () => {
		const result = await fetch(`/api/updateOrder/?id=${order.id}`, {
			method: 'POST',
			body: JSON.stringify({status:2}),
			headers: {
				Authorization: `Bearer ${getAuthToken()}`,
				'Content-Type': 'application/json',
			}
		});
    };
	useEffect(() => {
        if (!isSuccess) {
            prevIsSuccessRef.current = false;
        }
    }, [isSuccess]);
	return (
		<span className="w-full">
			<Button
				title={isLoading ? 'Processing...' : isSuccess ? 'Processing transaction...' : "I've made the payment"}
				processing={isLoading || isFetching}
				disabled={isSuccess || isFetching}
				onClick={onPaymentDone}
			/>
		</span>
	);
};

export default MarkAsPaidButton;
