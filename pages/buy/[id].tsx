// pages/buy/[id].tsx

import { Loading, Steps } from 'components';
import { Amount, OrderPaymentMethod, Summary } from 'components/Buy';
import { UIOrder } from 'components/Buy/Buy.types';
import { useListPrice, useAccount } from 'hooks';
import { GetServerSideProps } from 'next';
import React, { useEffect, useState } from 'react';
import { AdjustmentsVerticalIcon } from '@heroicons/react/24/outline';
import { getAuthToken } from '@dynamic-labs/sdk-react-core';

/**
 * BuyPage Component - Handles the buying process for a listed item
 * 
 * Flow:
 * 1. Fetches and displays list details
 * 2. Shows combined amount and payment method form
 * 3. Handles order creation and escrow process
 * 
 * Features:
 * - Real-time price updates via useListPrice
 * - Validation for amounts and payment methods
 * - Support for both instant and manual escrow
 * - Verification requirements check
 * - Mobile-responsive layout with collapsible summary
 * 
 * @param {number} id - The listing ID to buy from
 */
const BuyPage = ({ id }: { id: number }) => {
	console.log('[BuyPage] Initializing with id:', id);
	
	/**
	 * Component State:
	 * @property {UIOrder} order - Current order state including list and payment details
	 * @property {string | undefined} error - Error message if list fetch fails
	 * @property {boolean} isLoading - Loading state for initial data fetch
	 * @property {boolean} showFilters - Controls mobile summary visibility
	 */
	const [order, setOrder] = useState<UIOrder>({} as UIOrder);
	const [error, setError] = useState<string | undefined>();
	const [isLoading, setIsLoading] = useState(true);
	const [showFilters, setShowFilters] = useState(false);
	
	const { list } = order;
	const { price, error: priceError } = useListPrice(list);
	const { address } = useAccount();

	console.log('[BuyPage] Current state:', {
		order,
		isLoading,
		error,
		price,
		priceError,
		list,
		address,
		hasPrice: !!price,
		hasList: !!list,
		hasAddress: !!address
	});

	/**
	 * Fetches list details and initializes order state
	 * Handles loading states and error cases:
	 * - Network errors
	 * - Invalid list ID
	 * - Server errors
	 * - Authorization errors
	 */
	useEffect(() => {
		console.log('[BuyPage] Starting list fetch for id:', id);
		setIsLoading(true);
		setError(undefined);

		fetch(`/api/lists/${id}`, {
			headers: {
				Authorization: `Bearer ${getAuthToken()}`
			}
		})
			.then(async (res) => {
				console.log('[BuyPage] Received API response:', {
					status: res.status,
					ok: res.ok
				});
				const data = await res.json();
				
				if (!res.ok) {
					console.error('[BuyPage] API Error:', {
						status: res.status,
						data
					});
					throw new Error(data.message || 'Failed to fetch list');
				}
				return data;
			})
			.then((res) => {
				console.log('[BuyPage] Processing successful response:', res);
				const data = res.data;
				setOrder({
					...order,
					list: data,
					price: Number(data.calculatedPrice),
					step: order.step || 1
				});
			})
			.catch((err) => {
				console.error('[BuyPage] List fetch error:', err);
				setError(err.message || 'Failed to load list details');
			})
			.finally(() => {
				setIsLoading(false);
				console.log('[BuyPage] Fetch completed, isLoading set to false');
			});
	}, [id]);

	useEffect(() => {
		console.log('[BuyPage] Price changed, updating order:', price);
		setOrder({ ...order, ...{ price } });
	}, [price]);

	if (isLoading) return <Loading />;
	if (error) return (
		<div className="p-4 text-center">
			<div className="text-red-500 mb-2">{error}</div>
			<button 
				onClick={() => window.location.reload()}
				className="text-purple-600 hover:text-purple-800"
			>
				Try Again
			</button>
		</div>
	);
	if (!order.list) return <Loading />;
	if (priceError) return (
		<div className="p-4 text-center max-w-lg mx-auto">
			<div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-4">
				<div className="text-amber-800 font-semibold text-lg mb-2">Price Temporarily Unavailable</div>
				<div className="text-amber-700">{priceError}</div>
			</div>
			<button 
				onClick={() => window.location.reload()}
				className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
			>
				Try Again
			</button>
		</div>
	);

	const seller = order.seller || order.list?.seller;
	const canBuy = seller && seller.address !== address;

	/**
	 * Validates if user can proceed with purchase:
	 * - User must not be the seller
	 * - Required data must be loaded (list, price, address)
	 * - User must be verified if list requires it
	 */
	if (!canBuy) {
		return (
			<Loading
				spinner={false}
				message={order.seller ? 'You are not the seller of this order' : 'You are the seller of this ad'}
			/>
		);
	}

	// Only render the form when we have ALL required data
	const canRenderForm = !isLoading && order.list && price && address;

	const handleToggleFilters = () => {
		setShowFilters(!showFilters);
	};

	return (
		<div className="pt-4 md:pt-6 bg-white">
			<div className="w-full flex flex-col md:flex-row px-4 sm:px-6 md:px-8 mb-16">
				<div className="w-full lg:w-2/4">
					{/* Mobile filters toggle */}
					<div className="flex flex-row justify-end md:hidden md:justify-end" onClick={handleToggleFilters}>
						<AdjustmentsVerticalIcon
							width={24}
							height={24}
							className="text-gray-600 hover:cursor-pointer"
						/>
						<span className="text-gray-600 hover:cursor-pointer ml-2">Details</span>
					</div>

					{/* Mobile summary view */}
					{showFilters && <div className="mt-4">{!!order.list && <Summary order={order} />}</div>}

					{/* Combined form */}
					{canRenderForm ? (
						<Amount 
							order={order} 
							updateOrder={(newOrder) => {
								// console.log('Form update:', newOrder);
								setOrder(newOrder);
							}} 
							price={price} 
						/>
					) : (
						<Loading />
					)}
				</div>

				{/* Desktop summary view */}
				{!!order.list && <Summary order={order} />}
			</div>
		</div>
	);
};

export const getServerSideProps: GetServerSideProps<{ id: string }> = async (context) =>
	({ props: { title: 'Trade', id: String(context.params?.id) } });

export default BuyPage;
