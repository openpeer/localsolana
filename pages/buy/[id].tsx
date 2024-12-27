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
 * @param {number} id - The ID of the listing to buy
 */
const BuyPage = ({ id }: { id: number }) => {
	const [order, setOrder] = useState<UIOrder>({} as UIOrder);
	const [error, setError] = useState<string | undefined>();
	const [isLoading, setIsLoading] = useState(true);
	const [showFilters, setShowFilters] = useState(false);
	
	const { list } = order;
	const { price } = useListPrice(list);
	const { address } = useAccount();

	console.log('BuyPage render:', {
		order,
		isLoading,
		error,
		hasPrice: !!price,
		hasList: !!list,
		hasAddress: !!address
	});

	// Fetch listing details when component mounts or ID changes
	useEffect(() => {
		setIsLoading(true);
		setError(undefined);

		fetch(`/api/lists/${id}`, {
			headers: {
				Authorization: `Bearer ${getAuthToken()}`
			}
		})
			.then(async (res) => {
				const data = await res.json();
				
				if (!res.ok) {
					console.error('API Error:', {
						status: res.status,
						data
					});
					throw new Error(data.message || 'Failed to fetch list');
				}
				return data;
			})
			.then((res) => {
				const data = res.data;
				data.margin_type = data.margin_type === 1 ? 'percentage' : 'fixed';
				setOrder({
					...order,
					...{ 
						list: data, 
						listId: data.id,
						marginType: data.margin_type === 1 ? 'percentage' : 'fixed' 
					}
				});
			})
			.catch((err) => {
				console.error('List fetch error details:', err);
				setError(err.message || 'Failed to load list details');
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, [id]);

	useEffect(() => {
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

	const seller = order.seller || order.list?.seller;
	const canBuy = seller && seller.address !== address;

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
								console.log('Form update:', newOrder);
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
