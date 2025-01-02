import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { countries } from 'models/countries';
import { List } from 'models/types';
import Link from 'next/link';
import React from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { useAccount } from '../hooks';
import { formatUnits } from 'viem';
import Avatar from './Avatar';
import Button from './Button/Button';
import EditListButtons from './Button/EditListButton';
import Flag from './Flag/Flag';
import Token from './Token/Token';
import FriendlyTime from './FriendlyTime';
import { getStatusStringList } from '@/utils';
import HiddenBadge from './HiddenBadge';
import { formatNumberWithCommas } from '@/utils';

interface ListsTableProps {
    lists: List[];
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

const getDisplayName = (seller: any) => {
    if (seller.name) return seller.name;
    if (seller.email) return seller.email;
    return `${seller.address.slice(0, 4)}...${seller.address.slice(-4)}`;
};

const getInstantEscrowStatus = (escrowType: string | number): boolean => {
    if (typeof escrowType === 'number') {
        return escrowType === 1;
    }
    return escrowType === 'instant';
};

const ListsTable = ({ lists, fiatAmount, tokenAmount, hideLowAmounts }: ListsTableProps) => {
    const { address } = useAccount();
    const { primaryWallet } = useDynamicContext();

    return (
        <table className="w-full md:rounded-lg">
            <thead className="bg-gray-100">
                <tr className="w-full relative">
                    <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 rounded-tl-lg"
                    >
                        Seller
                    </th>
                    <th
                        scope="col"
                        className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell"
                    >
                        Available
                    </th>
                    <th
                        scope="col"
                        className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell"
                    >
                        Price
                    </th>
                    <th
                        scope="col"
                        className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell"
                    >
                        Min-Max Order
                    </th>
                    <th
                        scope="col"
                        className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell"
                    >
                        Payment time limit
                    </th>
                    <th
                        scope="col"
                        className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell"
                    >
                        Payment Methods
                    </th>
                    <th
                        scope="col"
                        className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell rounded-tr-lg"
                    >
                        Trade
                    </th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
                {lists.map((list) => {
                    // console.log("Processing list:", {
                    //     id: list.id,
                    //     escrow_type: list.escrow_type,
                    //     type: typeof list.escrow_type
                    // });

                    const {
                        id,
                        total_available_amount: amount,
                        seller,
                        token,
                        fiat_currency: { symbol: fiatSymbol, country_code: countryCode } = {},
                        limit_min: min,
                        limit_max: max,
                        calculatedPrice,
                        margin_type: marginType,
                        margin,
                        payment_methods: paymentMethods,
                        payment_time_limit: paymentTimeLimit,
                        escrow_type: escrowType,
                        type,
                        accept_only_verified: acceptOnlyVerified,
                        banks: listBanks = []
                    } = list;

                    const effectivePrice = Number(calculatedPrice) || 0;
                    const escrowedAmount = Number(amount) || 0;
                    const priceDifferencePercentage = 100;
                    const instantEscrow = getInstantEscrowStatus(escrowType);
                    // console.log("Instant escrow status:", {
                    //     id,
                    //     rawEscrowType: escrowType,
                    //     processedStatus: instantEscrow
                    // });

                    // Use the appropriate payment methods based on list type
                    const displayMethods = type === 'BuyList' ? listBanks : paymentMethods;

                    const { address: sellerAddress, name } = seller;
                    const isSeller = primaryWallet && sellerAddress === address;

                    const { symbol, minimum_amount: minimumAmount = 0 } = token;

                    const isHidden = getStatusStringList(Number(list.status)) === 'created';
                    if (hideLowAmounts && Number(escrowedAmount) < Number(minimumAmount)) {
                        return null;
                    }

                    return (
                        <tr key={`list-${id}`} className={`hover:bg-gray-50 ${isHidden ? 'bg-gray-100 text-gray-500' : ''}`}>
                            <td className="lg:pl-4 py-4">
                                <div className="w-full flex flex-col">
                                    <div className="w-full flex flex-row justify-around md:justify-start items-center">
                                        <div className="w-full mr-6">
                                            <Link href={`/${sellerAddress}`}>
                                                <div className="flex flex-row items-center cursor-pointer">
                                                    <Avatar user={seller} className="w-5 md:w-10 aspect-square" />
                                                    <div className="flex flex-col">
                                                        <div className="pl-1 md:pl-2 text-sm text-gray-900 text-ellipsis overflow-hidden">
                                                            {getDisplayName(seller)}
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
                                            </Link>
                                            <div className="mt-2 flex flex-col text-gray-500 lg:hidden">
                                                <div className="flex flex-col space-y-1">
                                                    <div className="flex flex-row items-center">
                                                        <div className="flex flex-col">
                                                            <div className="flex flex-row items-center">
                                                                <span className="pr-2 text-sm">Price</span>
                                                                <span>
                                                                    <Flag name={countries[countryCode!]} size={20} />
                                                                </span>
                                                                <span className="-ml-2 border-2 border-white rounded-full">
                                                                    <Token token={token} size={20} />
                                                                </span>
                                                            </div>
                                                            <span className="mb-2">
                                                                <div className="flex flex-row items-center">
                                                                    <span className="pr-1 text-sm text-gray-800">
                                                                        {fiatSymbol} {formatNumberWithCommas(effectivePrice)} per
                                                                    </span>
                                                                    <span className="text-sm text-gray-800">
                                                                        {symbol}
                                                                    </span>
                                                                </div>
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-row items-center">
                                                        <span className="pr-2 text-sm">Available</span>
                                                        <Token token={token} size={20} />
                                                    </div>
                                                    <div className="flex flex-row items-center">
                                                        <span className="mr-2 text-sm text-gray-800">
                                                            {Number(escrowedAmount).toFixed(2)} {symbol}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-gray-100 p-2 rounded-md w-1/2 flex flex-col lg:hidden px-4">
                                            <div className="flex flex-row items-center mb-2">
                                                <span className="pr-2 text-[11px]">Solana</span>
                                            </div>
                                            <div className="flex flex-row items-center mb-2">
                                                {isHidden && <HiddenBadge />}
                                            </div>
                                            {!!instantEscrow ? (
                                                <div className="flex flex-row items-center mb-2">
                                                    <span className="pr-2 text-[11px] text-gray-700">
                                                        Instant deposit ⚡
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-row items-center mb-2">
                                                    <span className="pr-2 text-[11px] text-gray-700">
                                                        Manual deposit
                                                    </span>
                                                </div>
                                            )}
                                            {!!(paymentTimeLimit && Number(paymentTimeLimit) > 0) && (
                                                <div className="flex flex-row items-center mb-2">
                                                    <span className="pr-2 text-[11px] text-gray-700">
                                                        Payment time limit
                                                    </span>
                                                    <span className="pr-2 text-[11px] text-black">
                                                        <ClockIcon width={16} height={16} />
                                                        <FriendlyTime timeInMinutes={Number(paymentTimeLimit)} />
                                                    </span>
                                                </div>
                                            )}
                                            <div className="mb-2">
                                                {displayMethods?.map((method: any) => (
                                                    method?.name && method?.color && (
                                                        <div
                                                            className="flex flex-row items-center mb-1"
                                                            key={`method-mobile-${list.id}-${method.id}`}
                                                        >
                                                            <span
                                                                className="w-1 h-3 rounded-full"
                                                                style={{ backgroundColor: method.color }}
                                                            >
                                                                &nbsp;
                                                            </span>
                                                            <span className="pl-1">{method.name}</span>
                                                        </div>
                                                    )
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="lg:hidden pb-3 pt-5">
                                        {isSeller ? (
                                            <EditListButtons list={list} />
                                        ) : (
                                            <BuyButton fiatAmount={fiatAmount} tokenAmount={tokenAmount} list={list} />
                                        )}
                                    </div>
                                </div>
                            </td>
                            <td className="hidden px-3.5 py-3.5 text-sm text-gray-500 lg:table-cell">
                                <div className="flex flex-col">
                                    <div className="flex flex-row mb-2 space-x-2 items-center">
                                        <Token token={token} size={24} />
                                        <span>
                                            {Number(escrowedAmount).toFixed(2)} {symbol}
                                        </span>
                                    </div>
                                    <div className="flex flex-row items-center">
                                        <div className="flex flex-row items-center space-x-1 bg-gray-100 px-2 rounded-full">
                                            <span className="text-[10px]">Solana</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-row items-center">
                                        {isHidden && <HiddenBadge />}
                                        <span className="text-[11px] text-gray-700 ml-2">
                                            {instantEscrow ? 'Instant deposit ⚡' : 'Manual deposit'}
                                        </span>
                                    </div>
                                </div>
                            </td>
                            <td className="hidden px-3.5 py-3.5 text-sm text-gray-500 lg:table-cell">
                                <div className="flex flex-col">
                                    <div className="flex flex-row space-x-2">
                                        <Flag name={countries[countryCode!]} size={24} />
                                        <span className="flex flex-col">
                                            {fiatSymbol} {formatNumberWithCommas(effectivePrice)} per {symbol}
                                            {priceDifferencePercentage <= 5 && (
                                                <div
                                                    className={`flex flex-row items-center justify-start space-x-1 text-${
                                                        priceDifferencePercentage < 0 ? 'green' : 'red'
                                                    }-500 text-xs`}
                                                >
                                                    <span>
                                                        {priceDifferencePercentage > 0 ? '+' : ''}
                                                        {priceDifferencePercentage.toFixed(2)}%
                                                    </span>
                                                    <span>spot</span>
                                                </div>
                                            )}
                                        </span>
																				</div>
                                </div>
                            </td>
                            <td className="hidden px-3.5 py-3.5 text-sm text-gray-500 lg:table-cell">
                                {(!!min || !!max) && `${min ? `${fiatSymbol} ${min} ` : ''}- ${fiatSymbol}${max ?? '∞'}`}
                            </td>
                            <td className="hidden px-3.5 py-3.5 text-sm text-gray-500 lg:table-cell">
                                {!!(paymentTimeLimit && Number(paymentTimeLimit) > 0) && (
                                    <div className="flex flex-row items-center space-x-2">
                                        <ClockIcon width={16} height={16} />
                                        <span>
                                            <FriendlyTime timeInMinutes={Number(paymentTimeLimit)} />
                                        </span>
                                    </div>
                                )}
                            </td>
                            <td className="hidden px-3.5 py-3.5 text-sm text-gray-500 lg:table-cell">
                                {displayMethods?.map((method: any) => (
                                    method?.name && method?.color && (
                                        <div
                                            className="flex flex-row items-center mb-1"
                                            key={`method-${list.id}-${method.id}`}
                                        >
                                            <span
                                                className="w-1 h-3 rounded-full"
                                                style={{ backgroundColor: method.color }}
                                            >
                                                &nbsp;
                                            </span>
                                            <span className="pl-1">{method.name}</span>
                                        </div>
                                    )
                                ))}
                            </td>
                            <td className="hidden text-right py-4 pr-4 lg:table-cell">
                                {isSeller ? (
                                    <>
                                        <EditListButtons list={list} />
                                        <div className="text-xs text-gray-400 -mt-5 text-center">ID: {id}</div>
                                    </>
                                ) : (
                                    <>
                                        <BuyButton fiatAmount={fiatAmount} tokenAmount={tokenAmount} list={list} />
                                        <div className="text-xs text-gray-400 mt-1 text-center">ID: {id}</div>
                                    </>
                                )}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};

export default ListsTable;