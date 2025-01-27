//import { OpenPeerEscrow } from 'abis';
import { DisputeForm, DisputeNotes, DisputeStatus } from 'components/DisputeTrade/';
import Loading from 'components/Loading/Loading';
import Token from 'components/Token/Token';
import { Order } from 'models/types';
import React from 'react';
import { formatUnits } from 'viem';
import { useAccount } from 'hooks';
import { useContractRead } from '@/hooks/transactions/useContractRead';
//import { useContractRead, useNetwork } from 'wagmi';

interface DisputeParams {
	order: Order;
}

const Dispute = ({ order }: DisputeParams) => {
	const { address } = useAccount();
	const escrowAddress = order?.trade_id;
	const { token_amount: tokenAmount, list, buyer, dispute, seller } = order;
	const { token } = list;
	const isSeller = address === seller.address;
	const isBuyer = address === buyer.address;
	const { data: escrowData, loading: loadingContract } = useContractRead(
		escrowAddress,
		"escrow",
		true
	);

	const paidForDispute = escrowData?.dispute == true && (isBuyer?escrowData?.buyerPaidDispute:escrowData?.sellerPaidDispute);
	// @ts-ignore
	const { user_dispute: userDispute, resolved } = dispute[0] || {};
	
	// Check if there's an active dispute from either party
	const hasActiveDispute = Array.isArray(dispute) && dispute.some((d: any) => d.user_dispute && !d.resolved);

	return (
		<div className="p-4 md:p-6 w-full m-auto mb-16">
			<div className="p-8 bg-white rounded-lg border border-slate-200 w-full flex flex-col md:flex-row md:gap-x-10">
				<div className="w-full md:w-1/2">
					<div className="flex flex-row pb-1 mb-4 text-purple-900 text-xl">
						<Token token={token} size={24} />
						<div className="pl-2">
							{isBuyer ? 'Buy' : 'Sell'} {tokenAmount} {token.symbol}
						</div>
					</div>
					<span>
						{resolved || hasActiveDispute || (address===process.env.NEXT_PUBLIC_ARBITRATOR_ADDRESS) ? (
							// @ts-ignore
							<DisputeStatus address={address} order={order} />
						) : (
							// @ts-ignore
							<DisputeForm address={address} order={order} paidForDispute={paidForDispute} fee={0.005} />
						)}
					</span>
				</div>
				{/* @ts-ignore */}
				<DisputeNotes fee={0.005} address={address} order={order}/>
			</div>
		</div>
	);
};

export default Dispute;
