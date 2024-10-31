import Button from 'components/Button/Button';
import { useAccount } from 'hooks';
import { Order } from 'models/types';
import React from 'react';
import ClipboardText from '../Buy/ClipboardText';
import { HandThumbDownIcon, HandThumbUpIcon } from '@heroicons/react/24/outline';

import { formatUnits } from 'viem';

interface OrderResumeParams {
	order: Order;
	showRating?: boolean;
}

const DisputeResume = ({ order, showRating = false }: OrderResumeParams) => {
	const {
		list,
		token_amount: tokenAmount,
		fiat_amount: fiatAmount,
		escrow,
		id,
		created_at: createdAt,
		seller,
		payment_method: { bank },
		dispute
	} = order;
	// @ts-ignore
	const {resolved, winner}=dispute?.[0]||{};
	
	const { token, fiat_currency: currency } = list!;
	const { address } = useAccount();
	const selling = seller.address === address;

	const tokenValue = `${tokenAmount} ${token.symbol}`;
	const fiatValue = `${currency.symbol} ${Number(fiatAmount).toFixed(2)}`;
	//const { fee } = useEscrowFee({ address: escrow?.address, token, tokenAmount, chainId: list.chain_id });
	const date = new Date(createdAt);

	return (
		<div className="w-full bg-white rounded-lg border border-color-gray-100 p-6 mb-2">
			<div className="flex flex-row justify-between mb-4">
				<span className="text-neutral-500">Amount Paid</span>
				<span className="flex flex-row justify-between">{selling ? tokenValue : fiatValue}</span>
			</div>
			<div className="flex flex-row justify-between mb-4">
				<span className="text-neutral-500">Payment Method</span>
				<span className="flex flex-row justify-between">{bank.name}</span>
			</div>
			{/* {selling && !!fee && (
				<div className="flex flex-row justify-between mb-4">
					<span className="text-neutral-500">Fee Paid</span>
					<span className="flex flex-row justify-between">
						{`${formatUnits(fee, token.decimals)} ${token.symbol}`}
					</span>
				</div>
			)} */}

			<div className="flex flex-row justify-between mb-4">
				<span className="text-neutral-500">Amount Received</span>
				<span className="flex flex-row justify-between">{selling ? fiatValue : tokenValue}</span>
			</div>
			<div className="flex flex-row justify-between mb-4">
				<span className="text-neutral-500">Order Time</span>
				<span className="flex flex-row justify-between">
					{date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
				</span>
			</div>
			<div className="flex flex-row justify-between mb-4">
				<span className="text-neutral-500">Reference No.</span>
				<span className="flex flex-row justify-between">
					<ClipboardText itemValue={String(Number(id) * 10000)} />
				</span>
			</div>			
		</div>
	);
};

export default DisputeResume;
