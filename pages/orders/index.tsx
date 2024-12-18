import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { Accordion, Loading } from 'components';
import OrdersTable from 'components/OrdersTable';
import { Order } from 'models/types';
import React, { useEffect, useState } from 'react';
import { useAccount } from 'hooks';
import qs from 'qs';
import { getStatusString } from '@/utils';

const OrdersPage = () => {
	const [activeOrders, setActiveOrders] = useState<Order[]>([]);
	const [closedOrders, setClosedOrders] = useState<Order[]>([]);
	const [isLoadingActive, setLoadingActive] = useState(false);
	const [loadedClosed, setLoadedClosed] = useState(false);
	const [isLoadingClosed, setLoadingClosed] = useState(false);
	const [cancelledOrders, setCancelledOrders] = useState<Order[]>([]);
	const [loadedCancelled, setLoadedCancelled] = useState(false);
	const [isLoadingCancelled, setLoadingCancelled] = useState(false);
	const { address } = useAccount();

	const fetchOrders = async (status: Order['status'][], type: 'active' | 'closed' | 'cancelled') => {
		if (!address) return;

		const loadingFunction =
			type === 'active' ? setLoadingActive : type === 'closed' ? setLoadingClosed : setLoadingCancelled;

		const setFunction =
			type === 'active' ? setActiveOrders : type === 'closed' ? setClosedOrders : setCancelledOrders;
		
		loadingFunction(true);
		fetch(`/api/ordersStatus?${qs.stringify({ status })}`, {
			headers: {
				Authorization: `Bearer ${getAuthToken()}`
			}
		})
			.then((res) => res.json())
			.then((res) => res.data)
			.then((data) => {
				data=data.filter((order:Order)=>{
					const getCurrentStatus = getStatusString(Number(order?.status));
					order.status = getCurrentStatus as "created" | "escrowed" | "release" | "cancelled" | "dispute" | "closed";
					return order;
				});
				
				setFunction(
					data.filter(
						(order: Order) =>
							!(
								order.seller.address === address &&
								order.list.escrow_type === 'instant' &&
								order.status === 'created'
							)
					)
				);
				loadingFunction(false);
			});
	};

	useEffect(() => {
		fetchOrders(['escrowed', 'release', 'dispute', 'created'], 'active');
	}, [address]);

	const onOpenClosedOrders = () => {
		if (loadedClosed) return;

		fetchOrders(['closed'], 'closed');
		setLoadedClosed(true);
	};

	const onOpenCancelledOrders = () => {
		if (loadedCancelled) return;

		fetchOrders(['cancelled'], 'cancelled');
		setLoadedCancelled(true);
	};

	return (
		<>
			<div className="mx-auto sm:px-0 md:px-4 mb-8 bg-white">
				<Accordion
					content={isLoadingActive ? <Loading /> : <OrdersTable orders={activeOrders} />}
					title="Active orders"
					open
				/>
				<Accordion
					content={isLoadingClosed ? <Loading /> : <OrdersTable orders={closedOrders} />}
					title="Closed orders"
					onOpen={onOpenClosedOrders}
				/>
				<Accordion
					content={isLoadingCancelled ? <Loading /> : <OrdersTable orders={cancelledOrders} />}
					title="Cancelled orders"
					onOpen={onOpenCancelledOrders}
				/>
			</div>
		</>
	);
};
export default OrdersPage;

export async function getServerSideProps() {
	return {
		props: { title: 'My Trades' } // will be passed to the page component as props
	};
}
