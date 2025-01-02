// is used for displaying order details when buying/selling from an existing listing


/* eslint-disable react/no-danger */
import Avatar from 'components/Avatar';
import Link from 'next/link';
import React from 'react';
import { smallWalletAddress } from 'utils';
import { useAccount } from 'hooks';
import { ChartBarSquareIcon, StarIcon, LightBulbIcon } from '@heroicons/react/24/outline';
import { UIOrder } from './Buy.types';
import Chat from './Chat';
import Loading from '../Loading/Loading';
import FriendlyTime from 'components/FriendlyTime';
import { Bank, PaymentMethod, List } from 'models/types';
import Image from 'next/image';
import { formatNumberWithCommas } from '@/utils';

const getListDescription = (list: List, price: number | undefined) => {
	const { 
		type, 
		token, 
		fiat_currency: currency, 
		total_available_amount, 
		margin_type, 
		margin,
		price_source,
		id 
	} = list;
	
	// Format total available amount to 4 decimal places
	const formattedAmount = Number(total_available_amount).toFixed(4);
	
	const getRateDescription = () => {
		// For fixed rate (margin_type === 0)
		if (Number(margin_type) === 0) {
			return `at a fixed rate of ${currency.symbol}${price} per ${token.symbol}`;
		}
		
		// For floating rate (margin_type === 1)
		const marginPercent = Math.abs((Number(margin) - 1) * 100).toFixed(2);
		const source = Number(price_source) === 0 ? 'CoinGecko' : 'Binance P2P';
		return `at a floating rate of ${Number(margin) >= 1 ? '+' : '-'}${marginPercent}% from the ${source} price`;
	};

	const listIdText = id ? ` (#${id})` : '';
	
	if (type === "BuyList") {
		return {
			title: `This Ad${listIdText} Offers to Buy Tokens from You`,
			description: `The ad owner wants to buy up to ${formattedAmount} ${token.symbol} using ${currency.name} (${currency.symbol}) ${getRateDescription()}.`
		};
	} else {
		return {
			title: `This Ad${listIdText} Offers to Sell Tokens to You`,
			description: `The ad owner is selling up to ${formattedAmount} ${token.symbol} for ${currency.name} (${currency.symbol}) ${getRateDescription()}.`
		};
	}
};

const SummaryBuy = ({ order }: { order: UIOrder }) => {	

	const { address } = useAccount();

	if(!address) return <Loading/>
	
	const {
		list,
		price,
		fiat_amount: fiatAmount,
		token_amount: tokenAmount,
		buyer,
		id,
		payment_method: paymentMethod
	} = order;
	const {
		fiat_currency: currency,
		limit_min: limitMin,
		limit_max: limitMax,
		token,
		total_available_amount: totalAvailableAmount,
		terms,
		type,
		accept_only_verified: acceptOnlyVerified,
		escrow_type: escrowType,
		payment_methods: paymentMethods = [],
		banks: listBanks = []
	} = list!;

	
	const seller = order.seller || list.seller;
	const selling = seller.address === address;
	const chatAddress = selling ? buyer.address : seller.address;
	const user = !!selling && !!buyer ? buyer : seller;

	const isBank = (obj: any): obj is Bank => 
		obj && typeof obj === 'object' && 'name' in obj && 'account_info_schema' in obj;

	const isPaymentMethod = (obj: any): obj is PaymentMethod =>
		obj && typeof obj === 'object' && 'bank' in obj && 'values' in obj;

	const getBankFromPaymentMethod = (pm: PaymentMethod | Bank | null | undefined): Bank | null => {
		if (!pm) return null;
		if (isBank(pm)) return pm;
		if (isPaymentMethod(pm)) return pm.bank;
		return null;
	};

	const getBankImage = (bank: Bank | undefined) => {
		if (!bank) return '';
		return bank.imageUrl || bank.icon || 
			(bank.image ? `https://bankimg.localsolana.com/${bank.image}` : '');
	};

	const banks = paymentMethod ? [paymentMethod.bank] :
		type === 'BuyList' ? listBanks :
		Array.isArray(paymentMethods) ? 
			paymentMethods.map(getBankFromPaymentMethod).filter((bank): bank is Bank => bank !== null) :
			[paymentMethods].map(getBankFromPaymentMethod).filter((bank): bank is Bank => bank !== null);
	const depositTimeLimit = order.deposit_time_limit || list.deposit_time_limit;
	const paymentTimeLimit = order.payment_time_limit || list.payment_time_limit;
	const instantEscrow = escrowType === 'instant';

	return (
		<div className="hidden lg:contents">
			<div className="w-full lg:w-2/4 lg:inline-block">
				<div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm md:ml-16 md:px-8 md:py-4 p-4">
					<div className="w-full flex flex-row justify-between items-center mb-6 mt-4 px-2">
						<Link href={`/${user.address}`} target="_blank">
							<div className="flex flex-row items-center">
								<Avatar user={user} className="w-10 aspect-square" />
								<span className="ml-2 cursor-pointer">{user.name || smallWalletAddress(user.address)}</span>
								{user.online !== null && (
									<div className="pl-1 md:pl-2 text-sm">
										{user.online ? (
											<div className="flex flex-row items-center space-x-1">
												<div className="w-2 h-2 bg-green-500 rounded-full" />
												<span className="text-green-500 text-xs">Online</span>
											</div>
										) : (
											<div className="flex flex-row items-center space-x-1">
												<div className="w-2 h-2 bg-orange-500 rounded-full" />
												<span className="text-orange-500 text-xs">Not online</span>
											</div>
										)}
									</div>
								)}
							</div>
						</Link>
						<div className="flex flex-row">
							<div className="flex flex-row">
								<ChartBarSquareIcon className="w-6 mr-2 text-gray-500" />
								<span>
									{user.trades} {user.trades === 1 ? 'Trade' : 'Trades'}
								</span>
							</div>
							<div className="flex flex-row ml-4 hidden">
								<StarIcon className="w-6 mr-2 text-yellow-400" />
								<span> 4.5 </span>
							</div>
						</div>
					</div>
					<div className="flex flex-col bg-gray-100 rounded-lg p-6">
						<div className="space-y-4">
						<h2 className="text-xl font-bold text-gray-900 uppercase">Offer Summary</h2>
							<div className="flex justify-between">
								<span className="text-gray-600 font-semibold text-sm">Total available amount</span>
								<span>
									{formatNumberWithCommas(Number(totalAvailableAmount), 4)} {token.symbol} (${formatNumberWithCommas(
										Number(Number(totalAvailableAmount) * Number(price || 0)), 2
									)})
								</span>
							</div>

							<div className="flex justify-between">
								<span className="text-gray-600 font-semibold text-sm">Price</span>
								<span>$ {formatNumberWithCommas(
									Number(Number(price || 0).toFixed(2))
								)}</span>
							</div>

							<div className="flex justify-between">
								<span className="text-gray-600 font-semibold text-sm">Payment methods</span>
								<div className="text-right">
									{banks.map((bank, i) => (
										<div key={i}>{bank?.name}</div>
									))}
								</div>
							</div>

							<div className="flex justify-between">
								<span className="text-gray-600 font-semibold text-sm">Deposit Time Limit</span>
								{typeof depositTimeLimit === 'number' && (
									<FriendlyTime timeInMinutes={depositTimeLimit} />
								)}
							</div>

							<div className="flex justify-between">
								<span className="text-gray-600 font-semibold text-sm">Payment Time Limit</span>
								{typeof paymentTimeLimit === 'number' && (
									<FriendlyTime timeInMinutes={paymentTimeLimit} />
								)}
							</div>

							{terms && (
								<div>
									<span className="text-gray-600 font-semibold text-sm">Terms</span>
									<div className="mt-2" dangerouslySetInnerHTML={{ __html: terms }} />
								</div>
							)}
						</div>
					</div>

					<div className="flex items-start space-x-3 p-4 my-1 bg-yellow-100 rounded-xl">
						<LightBulbIcon className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
						<div>
							<h3 className="text-lg font-semibold text-gray-900">
								{getListDescription(list, price).title}
							</h3>
							<p className="text-sm text-gray-600 mt-2 leading-relaxed">
								{getListDescription(list, price).description}
							</p>
						</div>
					</div>

					<span className="text-gray-800 text-sm font-bold">Seller's Note</span>
					<p className="mt-2 text-sm text-gray-500">
						Please do not include any crypto related keywords like {token.symbol} or LocalSolana. Ensure
						you&apos;re including the reference number {id ? `(${String(Number(id) * 10000)})` : ''} on your
						 transfer. Thanks for trading with me.
					</p>
					{!!chatAddress && <Chat address={chatAddress} label={selling ? 'buyer' : 'seller'} />}
					<div className="bg-[#FEFAF5] text-[#E37A00] p-4 rounded">
						<p className="text-sm font-bold mb-2">Disclaimer</p>
						<p className="text-sm">
							Trades settled outside of LocalSolana cannot have funds escrowed and can&apos;t be disputed. You
							 should only trade with sellers through LocalSolana.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SummaryBuy;
