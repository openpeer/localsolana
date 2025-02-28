import StepLayout from 'components/Listing/StepLayout';
import HeaderH3 from 'components/SectionHeading/h3';
import Image from 'next/image';
import React, { useEffect, useMemo } from 'react';
import { useAccount, useUserProfile } from 'hooks';
import { useBalance } from '@/hooks/transactions';

import { ClockIcon } from '@heroicons/react/24/outline';
// import { ClipboardIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-toastify';

import Countdown from 'react-countdown';
//import { OpenPeerEscrow } from 'abis';
import { BuyStepProps } from './Buy.types';
import CancelOrderButton from './CancelOrderButton/CancelOrderButton';
import ClipboardText from './ClipboardText';
import EscrowButton from './EscrowButton';
import MarkAsPaidButton from './MarkAsPaidButton';
import FeeDisplay from './Payment/FeeDisplay';
import PreShowDetails from './PreShowDetails';
import ReleaseFundsButton from './ReleaseFundsButton';
import { useContractRead } from '@/hooks/transactions/useContractRead';
import { getStatusString } from '@/utils';
import { BN } from '@coral-xyz/anchor';
import Loading from '../Loading/Loading';
import DeploySellerContract from './EscrowButton/DeploySellerContract';

const Payment = ({ order,updateOrder }: BuyStepProps) => {
	const {
		list,
		fiat_amount: fiatAmount,
		token_amount: tokenAmount,
		price,
		uuid,
		buyer,
		//escrow,
		id,
		status,
		seller,
		payment_method: paymentMethod,
		deposit_time_limit: depositTimeLimit,
		payment_time_limit: paymentTimeLimit,
		trade_id: tradeId
	} = order;

	// Add logging for payment method data
	// console.log('Payment Component - Full Order:', order);
	// console.log('Payment Component - Payment Method:', paymentMethod);

	const { token, fiat_currency: currency, escrow_type: escrowType } = list!;
	const { bank, values = {} } = paymentMethod;

	// Add logging for bank and values
	// console.log('Payment Component - Bank Details:', bank);
	// console.log('Payment Component - Payment Values:', values);

	const { address } = useAccount();
	const selling = seller.address === address;

	// Log role and status
	// console.log('Payment Component - User Role:', selling ? 'Seller' : 'Buyer');
	// console.log('Payment Component - Order Status:', status);

	const { data: escrowData, loading } = useContractRead(
		tradeId,
		"escrow",
		true
	);
	const { data: escrowState } = useContractRead(
		address||'',
		"escrowState",
		true
	);
	const { balance, loadingBalance, error } = useBalance(seller.address,token.address,true);// Fetch wallet balance

	const timeLimit =
		status === 'created' && depositTimeLimit && Number(depositTimeLimit) > 0
			? Number(depositTimeLimit) * 60 * 1000
			: 0;

	const timeLeft = timeLimit - (new Date().getTime() - new Date(order.created_at).getTime());
	const instantEscrow = escrowType === 'instant';
	const sellerCanCancelAfter = ((escrowData?.sellerCanCancelAfter?? new BN(0)) as BN).toNumber();


	const sellerCanCancelAfterSeconds = parseInt(sellerCanCancelAfter.toString(), 10);
	const timeLimitForPayment =
		status === 'escrowed' && order.escrow && sellerCanCancelAfter && sellerCanCancelAfterSeconds > 0
			? sellerCanCancelAfterSeconds * 1000
			: 0;
	const paymentTimeLeft = timeLimitForPayment > 0 ? timeLimitForPayment - new Date().getTime() : 0;
	//console.log('payment time left:',escrowData,tradeId,instantEscrow,status);

	const handleCopyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		toast.success('Copied to clipboard', {
			theme: 'dark',
			position: 'top-right',
			autoClose: 3000,
			hideProgressBar: false,
			closeOnClick: true,
			pauseOnHover: true,
			draggable: false,
			progress: undefined
		});
	};
	const { user,updateContractAddress } = useUserProfile({});
	const handleContractUpdate=async (contractAddress:string|undefined)=>{
		if(contractAddress !== undefined){
		await updateContractAddress(contractAddress);
		}
	  }

	// Add logging before escrow creation
	// useEffect(() => {
	// 	if (escrowData) {
	// 		console.log("Escrow Creation Context:", {
	// 			tradeId,
	// 			seller: seller.address,
	// 			buyer: buyer.address,
	// 			tokenAmount,
	// 			token: token.address,
	// 			escrowType,
	// 			paymentMethod
	// 		});
	// 	}
	// }, [escrowData, tradeId, seller, buyer, tokenAmount, token, escrowType, paymentMethod]);

	// Add validation before allowing escrow creation
	const canCreateEscrow = useMemo(() => {
		const validationResult = {
			hasValidSeller: !!seller?.address,
			hasValidBuyer: !!buyer?.address,
			hasValidAmount: tokenAmount > 0,
			hasValidToken: !!token?.address,
			hasValidTradeId: !!tradeId,
			hasValidPaymentMethod: !!paymentMethod?.id
		};
		
		// console.log("Escrow Creation Validation:", validationResult);
		
		return Object.values(validationResult).every(v => v === true);
	}, [seller, buyer, tokenAmount, token, tradeId, paymentMethod]);

	return (
		<StepLayout>
			<div className="my-0 md:my-8">
				{status === 'created' && instantEscrow && (
					<div>
						<span className="flex flex-row mb-2 text-yellow-600">
							<ClockIcon className="w-8 mr-2" />
							<HeaderH3 title="Instant Escrow" />
						</span>
						<p className="text-base">
							{selling
								? 'Please confirm the order. The funds will be locked in escrow as soon as you confirm the order. '
								: 'Please confirm the order. Payments details will become visible after the order confirmation. '}
						</p>
					</div>
				)}
				{status === 'created' && !instantEscrow && (
					<div>
						<span className="flex flex-row mb-2 text-yellow-600">
							<ClockIcon className="w-8 mr-2" />
							<HeaderH3 title="Awaiting Escrow Deposit" />
						</span>
						<p className="text-base">
							{selling
								? 'Please deposit funds to escrow in order to confirm and complete this transaction.'
								: 'Kindly wait for the seller to accept the order and escrow their funds. Payments details will become visible as soon as seller escrow the funds. '}
						</p>
					</div>
				)}
				{status === 'escrowed' && (
					<div>
						<span className="flex flex-row mb-2 text-yellow-600">
							<HeaderH3 title={selling ? 'Awaiting Buyer Payment' : 'Pay Seller'} />
						</span>
						<p className="text-base">
							{selling
								? 'Kindly wait for the buyer to pay. If the buyer already paid you can release the funds. Be careful.'
								: 'Proceed to your bank app or payment platform and send the required amount to the bank account details below.'}
						</p>
					</div>
				)}
				<div className="flex flex-col justify-around bg-gray-100 rounded-lg p-4 my-4">
					{selling ? (
						<FeeDisplay escrow={escrowData?.address} token={token} tokenAmount={tokenAmount} />
					) : (
						<div className="flex flex-row items-center mb-1">
							<span className="text-sm mr-2">Amount to pay</span>
							<span className="text-base font-medium">
								{selling
									? `${tokenAmount} ${token.symbol}`
									: `${currency.symbol} ${Number(fiatAmount).toFixed(2)}`}
							</span>
						</div>
					)}
					<div className="flex flex-row items-center mb-1">
						<span className="text-sm mr-2">Price</span>
						<span className="text-base font-medium">
							{currency.symbol} {Number(price).toFixed(2)}
						</span>
					</div>
					<div className="flex flex-row items-center mb-1">
						<span className="text-sm mr-2">Amount to receive</span>
						<span className="text-base font-medium">
							{selling
								? `${currency.symbol} ${Number(fiatAmount).toFixed(2)}`
								: `${Number(tokenAmount)?.toFixed(2)} ${token.symbol}`}
						</span>
					</div>
					{status === 'created' && (
						<div className="flex flex-row items-center mb-1">
							<span className="text-sm mr-2">Payment Method</span>
							{bank.icon && (
								<Image
									src={bank.icon}
									alt={bank.name}
									className="h-6 w-6 flex-shrink-0 rounded-full mr-1"
									width={24}
									height={24}
									unoptimized
								/>
							)}
							<span className="text-base font-medium">{paymentMethod.bank.name}</span>
						</div>
					)}
				</div>

				{status === 'created' && !instantEscrow && <PreShowDetails timeLeft={timeLeft} />}
				{status === 'escrowed' && (
					<div className="w-full bg-white rounded-lg border border-color-gray-100 p-6 mb-4">
						<div className="flex flex-row justify-between mb-4">
							<span className="text-neutral-500">Payment Method</span>
							<span className="flex flex-row justify-between">
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
								<ClipboardText itemValue={bank.name} />
							</span>
						</div>

						{Object.keys(values || {}).map((key) => {
							const {
								bank: { account_info_schema: schema }
							} = paymentMethod;
							const field = schema.find((f) => f.id === key);
							const value = (values || {})[key];
							if (!value) return <></>;

							return (
								<div className="flex flex-row justify-between mb-4" key={key}>
									<span className="text-neutral-500">{field?.label}</span>
									<ClipboardText itemValue={value} />
								</div>
							);
						})}
						<div className="flex flex-row justify-between">
							<span className="text-neutral-500">Reference No.</span>
							<span className="flex flex-row justify-between">
								<ClipboardText itemValue={String(Number(id) * 10000)} />
							</span>
						</div>
						{paymentTimeLeft > 0 && (
							<>
								<div className="border-b-2 border-dashed border-color-gray-400 mt-4 mb-4" />
								<div className="flex flex-row justify-between">
									<span className="text-neutral-500">The seller can cancel in </span>
									<span className="flex flex-row justify-between">
										<Countdown
											date={Date.now() + paymentTimeLeft}
											precision={2}
											renderer={({ hours, minutes, seconds, completed }) => {
												if (completed) {
													return <span className="text-purple-900">Time is up!</span>;
												}
												return (
													<span className="text-purple-900">
														{hours > 0 ? `${hours}h:` : ''}
														{minutes}m:{seconds}secs
													</span>
												);
											}}
										/>
									</span>
								</div>
							</>
						)}
					</div>
				)}

				{/* Add wallet balance and address display */}
				<div className="mt-4">
					<HeaderH3 title="Need to Top Up Your Wallet?" />
					<div className="flex items-center">
						<p className="text-base">
							<strong>Your Wallet Address:</strong> {address}
						</p>
						<button
							className="ml-2"
							onClick={() => {
								if (address) {
									handleCopyToClipboard(address);
								} else {
									toast.error('Address is not available');
								}
							}}
						>
							<svg
								className="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
								/>
							</svg>
						</button>
					</div>
					<p className="text-base">
						<strong>Your Wallet Balance:</strong> {balance} {token?.symbol}
					</p>
				</div>
				<div className="flex flex-col-reverse md:flex-row items-center justify-between mt-0">
					<span className="w-full md:w-1/3 md:pr-8">
						<CancelOrderButton order={order} />
					</span>
					<span className="w-full md:w-2/3 relative">
						{status === 'created' && (selling || instantEscrow) && (
							escrowState?
							<EscrowButton
								buyer={buyer.address}
								token={token}
								tokenAmount={tokenAmount || 0}
								uuid={order.id.toString()}
								tradeID= {order.trade_id}
								instantEscrow={true}
								seller={seller.address}
								sellerWaitingTime={Number(paymentTimeLimit) * 60}
								fromWallet={buyer.address!=address || !instantEscrow}
							/>:<DeploySellerContract setContractAddress={handleContractUpdate}/>
						)}
						{status === 'escrowed' &&
							(selling ? (
								<ReleaseFundsButton order={order} dispute={false} />
							) : (
								<MarkAsPaidButton order={order} updateOrder={updateOrder} />
							))}
					</span>
				</div>
			</div>
		</StepLayout>
	);
};
//escrow &&
export default Payment;
