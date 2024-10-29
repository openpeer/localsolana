
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { countries } from 'models/countries';
import { List, Dispute } from 'models/types';
import Link from 'next/link';
import React from 'react';
//import { smallWalletAddress } from 'utils';
import { ClockIcon } from '@heroicons/react/24/outline';

//import { allChains } from 'models/networks';
import { useAccount, useUserProfile } from '../hooks';
//import { useContractReads } from 'wagmi';
//import { OpenPeerEscrow } from 'abis';
import { Abi, formatUnits } from 'viem';
import Avatar from './Avatar';
import Button from './Button/Button';
import EditListButtons from './Button/EditListButton';
import Flag from './Flag/Flag';
import Token from './Token/Token';
//import IdVerificationNeeded from './IdVerificationNeeded';
//import Network from './Network/Network';

interface ListsTableProps {
	disputeLists: Dispute[];
	fiatAmount?: number;
	tokenAmount?: number;
	hideLowAmounts?: boolean;
}

interface BuyButtonProps {
	fiatAmount: number | undefined;
	tokenAmount: number | undefined;
	list: List;
}

const BuyButton = ({ fiatAmount, tokenAmount, list }: BuyButtonProps) => {
	const {
		id,
		escrow_type: escrowType,
		token: { symbol },
		type
	} = list;
	const sellList = type === 'SellList';
	let fiat = fiatAmount;
	let token = tokenAmount;

	if (token) {
		fiat = Number(token) * Number(list.price);
	} else if (fiat) {
		token = Number(fiat) / Number(list.price);
	}

	return (
		<Link
			href={{ pathname: `/buy/${encodeURIComponent(id)}`, query: { fiatAmount: fiat, tokenAmount: token } }}
			as={`/buy/${encodeURIComponent(id)}`}
		>
			<Button
				title={sellList ? (escrowType === 'instant' ? `Buy ${symbol} ⚡` : `Buy ${symbol}`) : `Sell ${symbol}`}
			/>
		</Link>
	);
};

const ListsTableDispute = ({ disputeLists }: ListsTableProps) => {
	const { address } = useAccount();
	const { primaryWallet } = useDynamicContext();
	//const chains = allChains;

	// const contracts = lists
	// 	.filter(({ contract }) => !!contract)
	// 	.map((list) => ({ id: list.id, contract: list.contract, token: list.token.address, chainId: list.chain_id }));

	// let signatures = contracts.map((item) => {
	// 	const { contract, token, chainId } = item;
	// 	return {
	// 		address: contract,
	// 		// abi: OpenPeerEscrow as Abi,
	// 		// functionName: 'balances',
	// 		args: [token],
	// 		//chainId
	// 	};
	// });

//	remove duplicates with the same address, args and chainId
	// signatures = signatures.filter(
	// 	(item, index, self) =>
	// 		index ===
	// 		self.findIndex(
	// 			(t) => t.address === item.address && t.args[0] === item.args[0]
	// 		)
	// );
	//const { data, isLoading } = useContractReads({ contracts: signatures });
	//const showVerification = user && !user.verified;

	return (
		<table className="w-full md:rounded-lg">
			<thead className="bg-gray-100">
				<tr className="w-full relative">
					<th
						scope="col"
						className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 rounded-tl-lg"
					>
						Order
					</th>
					<th
						scope="col"
						className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell"
					>
						Resolved
					</th>
					<th
						scope="col"
						className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell"
					>
						Winner
					</th>
					<th
						scope="col"
						className="hidden px-3 py-3.5 text-center text-sm font-semibold text-gray-900 lg:table-cell"
					>
						Check Dispute
					</th>
				</tr>
			</thead>
			<tbody className="divide-y divide-gray-200 bg-white">
				{disputeLists.map((dispute) => {
                    // @ts-ignore
					const { id,order_id,resolved,winner_id,} = dispute;
					
					// const banks = type === 'BuyList' ? list.bank : paymentMethods?.map((pm) => pm.bank);
					// const { address: sellerAddress, name } = seller;
					// const isSeller = primaryWallet && sellerAddress === address;

					// const { symbol, minimum_amount: minimumAmount = 0 } = token;
					// //const chain = chains.find((c) => c.id === chainId);

					// // const priceDifferencePercentage =
					// // tokenSpotPrice && price ? (price / tokenSpotPrice) * 100 - 100 : 0;

					// const priceDifferencePercentage = 100;
					// const instantEscrow = escrowType === 'instant';
					// let escrowedAmount = amount;

					// try {
					// 	if (instantEscrow && !isLoading && data) {
					// 		const dataIndex = signatures.findIndex(
					// 			(item) => item.address === list.contract && item.args[0] === list.token.address
					// 		);
					// 		if (dataIndex !== -1) {
					// 			const { status, result } = data[dataIndex];
					// 			if (status === 'success') {
					// 				escrowedAmount = formatUnits(result as bigint, token.decimals);
					// 			}
					// 		}
					// 	}
					// } catch (err) {
					// 	console.log(err);
					// }

					// if (hideLowAmounts && Number(escrowedAmount) < Number(minimumAmount)) {
					// 	return <></>;
					// }

					return (
						<tr key={`list-${id}`} className="hover:bg-gray-50">
							<td className="lg:pl-4 py-4">
								<div className="w-full flex flex-col">
									<div className="w-full flex flex-row justify-around md:justify-start items-center">
										<div className="w-full mr-6">
                                            {order_id}
											{/* <Link href={`/${sellerAddress}`}>
												<div className="flex flex-row items-center cursor-pointer">
													<Avatar user={seller} className="w-5 md:w-10 aspect-square" />
													<div className="flex flex-col">
														<div className="pl-1 md:pl-2 text-sm text-gray-900 text-ellipsis overflow-hidden">
															{name || sellerAddress}
														</div>
														{seller.online !== null && (
															<div className="pl-1 md:pl-2 text-sm">
																{seller.online ? (
																	<div className="flex flex-row items-center space-x-1">
																		<div className="w-2 h-2 bg-green-500 rounded-full" />
																		<span className="text-green-500 text-xs">
																			Online
																		</span>
																	</div>
																) : (
																	<div className="flex flex-row items-center space-x-1">
																		<div className="w-2 h-2 bg-orange-500 rounded-full" />
																		<span className="text-orange-500 text-xs">
																			Not online now
																		</span>
																	</div>
																)}
															</div>
														)}
													</div>
												</div>
											</Link> */}
											<div className="mt-2 flex flex-col text-gray-500 lg:hidden">
												<div className="flex flex-col space-y-1">
			
													<div className="flex flex-row items-center">
														<span className="pr-2 text-sm">Order Id</span>
                                                        {order_id}
													</div>
                                                    <div className="flex flex-row items-center">
														<span className="pr-2 text-sm">Resolved</span>
                                                        {resolved?"Yes":"No"}
													</div>
                                                    <div className="flex flex-row items-center">
														<span className="pr-2 text-sm">Winner</span>
                                                        {winner_id?winner_id?.toString():'-'}
													</div>
												</div>
											</div>
										</div>
									</div>
									<div className="lg:hidden pb-3 pt-5">
                                        <Link href={`/orders/${order_id}`}>
                                            <Button title={"Continue"} />
                                        </Link>
									</div>
								</div>
							</td>
							<td className="hidden px-3.5 py-3.5 text-sm text-gray-500 lg:table-cell">
								<div className="flex flex-col">
									<div className="flex flex-row mb-2 space-x-2 items-center">
										<span>
											{resolved?"Yes":"No"}
										</span>
									</div>
								</div>
							</td>
							<td className="hidden px-3.5 py-3.5 text-sm text-gray-500 lg:table-cell">
								<div className="flex flex-col">
									<div className="flex flex-row space-x-2">
										<span className="flex flex-col">
											{winner_id?winner_id.toString():'-'}
										</span>
									</div>
								</div>
							</td>
							
							<td className="hidden text-right py-4 pr-4 lg:table-cell">
                                <Link href={`/orders/${order_id}`}>
                                    <Button title={"Continue"} />
                                </Link>
							</td>
						</tr>
					);
				})}
			</tbody>
		</table>
	);
};

export default ListsTableDispute;
