import CancelOrderButton from 'components/Buy/CancelOrderButton/CancelOrderButton';
import ReleaseFundsButton from 'components/Buy/ReleaseFundsButton';
import Label from 'components/Label/Label';
//import { useEscrowFee } from 'hooks';
import { Order } from 'models/types';
import Image from 'next/image';
import React from 'react';
import { smallWalletAddress } from 'utils';

import { formatUnits } from 'viem';
import StatusTimeLine from './StatusTimeLine';
import ResolveDisputeButton from '../ResolveDisputeButton';

interface DisputeStatusParams {
	order: Order;
	address: string;
}



const DisputeStatus = ({ order, address }: DisputeStatusParams) => {

	const {
		id,
		token_amount: tokenAmount,
		fiat_amount: fiatAmount,
		dispute,
		buyer,
		created_at: createdAt,
		seller,
		payment_method: { bank },
		list: { token, fiat_currency: currency }
	} = order;
	
	// const { resolved, winner } = dispute!;

	// @ts-ignore
	const { user_dispute: userDispute, resolved,winner } = dispute[0] || {};
	// console.log(dispute);
	// let resolved=false,winner=true;

	const isBuyer = address === buyer.address;
	const isSeller = address === seller.address;
	
	const tokenValue = `${tokenAmount} ${token.symbol}`;
	const fiatValue = `${currency.symbol} ${Number(fiatAmount).toFixed(2)}`;
	const counterpart = isBuyer ? 'seller' : 'buyer';
	//const { fee } = useEscrowFee({ address: order?.escrow?.address, token, tokenAmount, chainId: token.chain_id });
	const date = new Date(createdAt);

	return (
		<div>
			<div className="flex flex-col border-b pb-4">
				{
				(isSeller || isBuyer )
				?
				<> 
				{!resolved ? (
					<div className="flex flex-row justify-between">
						<div className="font-bold">Dispute Pending</div>
						<div className="text-cyan-600 hidden">
							Time left <span>15m:20secs</span>
						</div>
					</div>
				) 
				: !!winner && (winner === (isBuyer?buyer.id:seller.id)) ? (
					<div className="text-cyan-600">
						<div className="font-bold">Dispute Ended</div>
						You won the dispute. {tokenValue} and the fee has been credited to your account
					</div>
				) 
				: (
					<div className="text-red-600">
						<div className="font-bold">Dispute Ended</div>
						Unfortunately, you lost the dispute. {tokenValue} has been credited back to the {counterpart}
						&apos;s account
					</div>
				)}
				</>
				:
				(process.env.NEXT_PUBLIC_ARBITRATOR_ADDRESS===address && resolved)
				?
				<div className="text-cyan-600">
					<div className="font-bold">Dispute Ended</div>
					{
						!!winner 
						&&
						((+winner)=== (+buyer.id))
						?
							(buyer.name)?buyer.name:buyer.address
						:
							(seller.name)?seller.name:seller.address
					}
					{' '}
					won the dispute. {tokenValue} and the fee has been credited to his/her account
				</div>
				:
				<></>
			}
			</div>

			{
				(isBuyer || isSeller)?
				<div className="py-8">
					{/* @ts-ignore */}
					<StatusTimeLine escrow={order?.escrow?.address??"Address"} dispute={dispute!} isBuyer={isBuyer}/>
				</div>
				:
				<></>
			}

			<div>
				<Label title="Transaction Details" />
				<div className="text-sm mt-4">
					<div className="flex flex-row justify-between mb-2">
						<span className="text-gray-500">Seller</span>
						<span>{seller.name || smallWalletAddress(seller.address, 10)}</span>
					</div>
					<div className="flex flex-row justify-between mb-2">
						<span className="text-gray-500">Buyer</span>
						<span>{buyer.name || smallWalletAddress(buyer.address, 10)}</span>
					</div>
					<div className="flex flex-row justify-between mb-2">
						<span className="text-gray-500">Amount Paid</span>
						<span>{isBuyer ? fiatValue : tokenValue}</span>
					</div>
					{/* {!isBuyer && !!fee && (
						<div className="flex flex-row justify-between mb-2">
							<span className="text-gray-500">Fee</span>
							<span>
								{formatUnits(fee, token.decimals)} {token.symbol}
							</span>
						</div>
					)} */}
					<div className="flex flex-row justify-between mb-2">
						<span className="text-gray-500">Amount to Receive</span>
						<span>{isBuyer ? tokenValue : fiatValue}</span>
					</div>
					<div className="flex flex-row justify-between mb-2">
						<span className="text-gray-500">Order Time</span>
						<span>
							{date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
						</span>
					</div>
					<div className="flex flex-row justify-between mb-2">
						<span className="text-gray-500">Reference No.</span>
						<span>{Number(id) * 10000}</span>
					</div>
					<div className="flex flex-row justify-between mb-2">
						<span className="text-gray-500">Payment Method</span>
						<span className="flex flex-row items-center">
							{!!bank.icon && (
								<Image
									src={bank.icon}
									alt={bank.name}
									className="h-6 w-6 flex-shrink-0 rounded-full mr-1"
									width={24}
									height={24}
									unoptimized
								/>
							)}
							{bank.name}
						</span>
					</div>
				</div>
			</div>
			<div className="mt-8">
			{
				((!isSeller) && (!isBuyer))
				?
				<>
					{
						resolved
						?
							<>
								<div className='mb-2'>Dispute is already resolved.</div>
							</>
						:
						// @ts-ignore
						(!!dispute && dispute.length>0)?
							<>
								<div className='mb-2 text-center'>
									<div>Who is the Winner?</div></div>
								<div className='flex flex-row justify-between'>
									<ResolveDisputeButton order={order} title="Seller" outlined={false} user_address={seller.address}/>
									<div className='p-2'></div>
									<ResolveDisputeButton order={order} title="Buyer" outlined={false}  user_address={buyer.address}/>
								</div>
							</>
						:
						<>
							<div className='mb-2'>Dispute reason not submitted yet.</div>
						</>
					}
				</>
				:
				(!resolved) 
				? 
				<div className="mt-8">
					{isBuyer ? (
						<CancelOrderButton order={order} title="Close Dispute" outlined={false} />
					) : (
						<ReleaseFundsButton order={order} title="Close Dispute" dispute />
					)}
				</div>
				: 
				<>Local Solana Arbitration resolved dispute.</>
			}
			</div>
			{/* {(!resolved) && (
				<div className="mt-8">
					{isBuyer ? (
						<CancelOrderButton order={order} title="Close Dispute" outlined={false} />
					) : (
						<ReleaseFundsButton order={order} title="Close Dispute" dispute />
					)}
				</div>
			)} */}
		</div>
	);
};

export default DisputeStatus;
