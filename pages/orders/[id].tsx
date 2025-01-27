import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { Loading, Steps } from 'components';
import { Cancelled, Completed, Payment, Release, Summary } from 'components/Buy';
import { UIOrder } from 'components/Buy/Buy.types';
import Dispute from 'components/Dispute/Dispute';
import { GetServerSideProps } from 'next';
import { useAccount } from 'hooks';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getStatusString } from '@/utils';
import io from 'socket.io-client';
import { snakeCase } from 'lodash';
import snakecaseKeys from 'snakecase-keys';

const ERROR_STEP = 0;
const PAYMENT_METHOD_STEP = 2;
const RELEASE_STEP = 3;
const COMPLETED_STEP = 4;
const CANCELLED_STEP = 5;
const POLL_INTERVAL = 30000; // 30 seconds between order status checks
const FINAL_STATUSES = [3, 5]; // Status codes that indicate order completion

const steps: { [key: string]: number } = {
    created: PAYMENT_METHOD_STEP,
    escrowed: PAYMENT_METHOD_STEP,
    release: RELEASE_STEP,
    cancelled: CANCELLED_STEP,
    closed: COMPLETED_STEP,
    dispute: COMPLETED_STEP,
    error: ERROR_STEP
};

const OrderPage = ({ id }: { id: string }) => {
    const [order, setOrder] = useState<UIOrder>();
    const token = useMemo(() => getAuthToken(), []); // Memoize the token
    const { address } = useAccount();
    const socketRef = useRef<any>(null); // Use useRef to store the socket instance

    useEffect(() => {
        console.debug("[OrderPage] Effect starting new render cycle");

        const fetchOrder = async () => {
            try {
                console.debug("[OrderPage] Fetching order data...");
                const response = await fetch(`/api/orders/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const result = await response.json();
                const data = result.data;
                
                // Only log status changes
                if (!order || order.status !== data.status) {
                    console.debug("[OrderPage] Order status:", data.status);
                    console.debug("[OrderPage] Full order data:", data);
                }

                setOrder(snakecaseKeys({ 
                    ...data, 
                    status: getStatusString(data.status), 
                    step: steps[getStatusString(data.status) || 'error'] 
                }, {deep: true}));

                return !FINAL_STATUSES.includes(data.status);
            } catch (error) {
                console.error('[OrderPage] Error fetching order:', error);
                return true;
            }
        };

        let pollInterval: NodeJS.Timeout | null = null;

        // Initial fetch and setup polling only if needed
        (async () => {
            const shouldPoll = await fetchOrder();
            if (shouldPoll) {
                pollInterval = setInterval(async () => {
                    const shouldContinue = await fetchOrder();
                    if (!shouldContinue) {
                        console.debug("[OrderPage] Order is closed, stopping polling");
                        if (pollInterval) {
                            clearInterval(pollInterval);
                            pollInterval = null;
                        }
                    }
                }, POLL_INTERVAL);
            } else {
                console.debug("[OrderPage] Order is already closed, not starting polling");
            }
        })();

        return () => {
            console.debug("[OrderPage] Cleaning up effect");
            if (pollInterval) {
                clearInterval(pollInterval);
                pollInterval = null;
            }
        };
    }, [id, token]);

    //console.log('Socket',socketRef);
    useEffect(() => {
        const setupChannel = async () => {
            
            if (!token) return;
            //console.log('Socket on',process.env.NEXT_PUBLIC_API_WS_URL);
            if (!socketRef.current) {
                socketRef.current = io(`${process.env.NEXT_PUBLIC_API_WS_URL}`, {
                    query: { token },
                    transports: ['websocket'],
                },);
    
                socketRef.current.on('connect', () => {
                    //console.log('Connected to socket server');
                    socketRef.current.emit('subscribeToOrder', { channel: 'OrdersChannel',
                        orderId: id });
                });
    
                socketRef.current.on('orderUpdate', (response: any) => {
                    //console.log('updatedOrder', response);
                    const  updatedOrder  = (response);
                    setOrder(snakecaseKeys({ ...updatedOrder, step: steps[getStatusString(updatedOrder.status)] },{deep: true}));
                });
    
                socketRef.current.on('disconnect', () => {
                    //console.log('Disconnected from socket server');
                });
            }
        };
    
        setupChannel();
    
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [token, id]);

    if (!order?.id) return <Loading />;

    const { step, list, dispute } = order;
    const seller = order.seller || list.seller;
    const selling = seller.address === address;
    const chatAddress = selling ? order.buyer.address : seller.address;

    // Check if user has access to view the order
    const hasAccess = 
        seller.address === address || 
        order.buyer.address === address ||
        address === process.env.NEXT_PUBLIC_ARBITRATOR_ADDRESS;

    if (!hasAccess) {
        return (
            <>
               <div className="flex items-center justify-center h-screen bg-white">
                    Only the seller, buyer, or arbitrator can view order details
                </div>
            </>
        );
    }

	if ( order.status === 'dispute') {
		return <Dispute order={order} />;
	}
    return (
        <div className="pt-4 md:pt-6 bg-white">
            <div className="w-full flex flex-row px-4 sm:px-6 md:px-8 mb-16">
                <div className="w-full lg:w-2/4">
                    <Steps currentStep={step} stepsCount={3} />
                    {step === PAYMENT_METHOD_STEP && <Payment order={order} updateOrder={setOrder} />}
                    {step === RELEASE_STEP && <Release order={order} updateOrder={setOrder} />}
                    {step === COMPLETED_STEP && <Completed order={order} updateOrder={setOrder} />}
                    {step === CANCELLED_STEP && <Cancelled order={order} updateOrder={setOrder} />}
                    {step === ERROR_STEP ? (
                        <p>We could not find this order</p>
                    ) : (
                        // !!chatAddress && (
                        //     <div className="md:hidden">
                        //         <Chat address={chatAddress} label={selling ? 'buyer' : 'seller'} />
                        //     </div>
                        // )
						<></>
                    )}
                </div>
                {!!list && <Summary order={order} />}
            </div>
        </div>
    );
};

export const getServerSideProps: GetServerSideProps<{ id: string }> = async ({ params }) => ({
    props: { title: 'Buy', id: String(params?.id) }
});

export default OrderPage;