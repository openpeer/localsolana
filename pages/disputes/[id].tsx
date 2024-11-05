import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { Loading } from 'components';
import { UIOrder } from 'components/Buy/Buy.types';
import Dispute from 'components/Dispute/Dispute';
import { GetServerSideProps } from 'next';
import { useAccount } from 'hooks';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getStatusString } from '@/utils';
import snakecaseKeys from 'snakecase-keys';
import DisputeCompleted from '@/components/Dispute/DisputeCompleted';
import DisputeSummary from '@/components/Dispute/DisputeSummary';

const ERROR_STEP = 0;
const PAYMENT_METHOD_STEP = 2;
const RELEASE_STEP = 3;
const COMPLETED_STEP = 4;
const CANCELLED_STEP = 5;

const steps: { [key: string]: number } = {
    created: PAYMENT_METHOD_STEP,
    escrowed: PAYMENT_METHOD_STEP,
    release: RELEASE_STEP,
    cancelled: CANCELLED_STEP,
    closed: COMPLETED_STEP,
    dispute: COMPLETED_STEP,
    error: ERROR_STEP
};

const DisputePage = ({ id }: { id: string }) => {
    const [order, setOrder] = useState<UIOrder>();
    const token = useMemo(() => getAuthToken(), []); // Memoize the token
    const { address } = useAccount();
    
    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const response = await fetch(`/api/orders/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const result = await response.json();
                const data = result.data;
                setOrder(snakecaseKeys({ ...data, status: getStatusString(data.status), step: steps[getStatusString(data.status) || 'error'] },{deep: true}));
            } catch (error) {
                console.error('Error fetching order:', error);
            }
        };

        fetchOrder();
    }, [id, token]);

    if (!order?.id) return <Loading />;

	const { step,list } = order;
    
	if (order.status === 'dispute') {
		return <Dispute order={order} />;
	}

    if(!address || address!==process.env.NEXT_PUBLIC_ARBITRATOR_ADDRESS){
        return (
            <>
                {/* <Loading /> */}
                <div className="flex items-center justify-center h-screen">
					Not Authorized to access this page
				</div>
            </>
        );
    }

    return (
        <div className="p-4 md:p-6 w-full m-auto mb-16">
			<div className="p-8 bg-white rounded-lg border border-slate-200 w-full flex flex-col md:flex-row md:gap-x-10">
				<div className="w-full md:w-1/2">
					<span>
                    { step === COMPLETED_STEP && <DisputeCompleted order={order} updateOrder={setOrder} />}
                    { step === ERROR_STEP && <p>We could not find this order</p> }
					</span>
				</div>
                {/* @ts-ignore */}
                {!!list && <DisputeSummary fee={0.005} address={address} order={order}/>}
			</div>
		</div>
        // <div className="pt-4 md:pt-6">
        //     <div className="w-full flex flex-row px-4 sm:px-6 md:px-8 mb-16">
        //         <div className="w-full lg:w-2/4">
        //             { step === COMPLETED_STEP && <DisputeCompleted order={order} updateOrder={setOrder} />}
        //             { step === ERROR_STEP && <p>We could not find this order</p> }
        //         </div>
        //     {!!list && <DisputeSummary fee={0.005} address={address} order={order}/>}
        //     </div>
        // </div>
    );
};

export const getServerSideProps: GetServerSideProps<{ id: string }> = async ({ params }) => ({
    props: { title: 'Dispute Resolved', id: String(params?.id) }
});

export default DisputePage;