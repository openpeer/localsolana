import { Steps } from 'components';
import { Amount, Details, ListType, PaymentMethod, Setup, Summary } from 'components/Listing';
import { UIList } from 'components/Listing/Listing.types';
import React, { useEffect, useState, useRef } from 'react';
import { useAccount } from 'hooks';
import { useRouter } from 'next/router';

import { AdjustmentsVerticalIcon } from '@heroicons/react/24/solid';
import {
	DEFAULT_DEPOSIT_TIME_LIMIT,
	DEFAULT_ESCROW_TYPE,
	DEFAULT_MARGIN_TYPE,
	DEFAULT_MARGIN_VALUE,
	DEFAULT_PAYMENT_TIME_LIMIT
} from 'utils';

const LIST_TYPE_STEP = 1;
const SETUP_STEP = 2;
const AMOUNT_STEP = 3;
const PAYMENT_METHOD_STEP = 4;
const DETAILS_STEP = 5;

const defaultList = {
	marginType: 'percentage' as const,
	margin: DEFAULT_MARGIN_VALUE,
	depositTimeLimit: DEFAULT_DEPOSIT_TIME_LIMIT,
	paymentTimeLimit: DEFAULT_PAYMENT_TIME_LIMIT,
	escrowType: DEFAULT_ESCROW_TYPE
};

const SellPage = () => {
	const [showFilters, setShowFilters] = useState(false);
	const { address } = useAccount();
	const router = useRouter();
	const mounted = useRef(true);
	
	const isEditing = router.query.id !== undefined;
	
	const [list, setList] = useState<UIList>({
		...{
			step: LIST_TYPE_STEP,
			type: 'SellList',
			marginType: isEditing ? DEFAULT_MARGIN_TYPE : 'percentage',
		},
		...defaultList
	} as UIList);
	
	useEffect(() => {
		mounted.current = true;
		
		return () => {
			mounted.current = false;
		};
	}, []);

	useEffect(() => {
		if (!mounted.current) return;
		if (list.step > 4) {
			setList({ ...{ step: PAYMENT_METHOD_STEP }, ...defaultList } as UIList);
		}
	}, [address]);

	useEffect(() => {
		if (!mounted.current) return;
		if ((list.paymentMethods || []).length > 0) {
			setList({ ...list, ...{ paymentMethods: [] } });
		}

		if ((list.banks || []).length > 0) {
			setList({ ...list, ...{ banks: [] } });
		}
	}, [list.type]);

	useEffect(() => {
		if (mounted.current) {
			window.scrollTo(0, 0);
		}
	}, [list.step]);

	const handleToggleFilters = () => {
		if (mounted.current) {
			setShowFilters(!showFilters);
		}
	};

	const safeUpdateList = (updates: Partial<UIList>) => {
		if (mounted.current) {
			setList(prevList => ({ ...prevList, ...updates }));
		}
	};

	return (
		<div className="pt-4 md:pt-6 bg-white">
			<div className="w-full flex flex-col md:flex-row px-4 sm:px-6 md:px-8 mb-16">
				<div className="w-full lg:w-2/4">
					<Steps
						currentStep={list.step}
						stepsCount={4}
						onStepClick={(n) => safeUpdateList({ step: n })}
					/>
					<div className="flex flex-row justify-end md:hidden md:justify-end" onClick={handleToggleFilters}>
						<AdjustmentsVerticalIcon
							width={24}
							height={24}
							className="text-gray-600 hover:cursor-pointer"
						/>
						<span className="text-gray-600 hover:cursor-pointer ml-2">Details</span>
					</div>
					{showFilters && (
						<div className="mt-4 md:hidden">
							<Summary list={list} />
						</div>
					)}
					{list.step === LIST_TYPE_STEP && <ListType list={list} updateList={safeUpdateList} />}
					{list.step === SETUP_STEP && <Setup list={list} updateList={safeUpdateList} />}
					{list.step === AMOUNT_STEP && <Amount list={list} updateList={safeUpdateList} />}
					{list.step === PAYMENT_METHOD_STEP && <PaymentMethod list={list} updateList={safeUpdateList} />}
					{list.step === DETAILS_STEP && <Details list={list} updateList={safeUpdateList} />}
				</div>
				<div className="hidden lg:contents">
					<Summary list={list} />
				</div>
			</div>
		</div>
	);
};

export async function getServerSideProps() {
	return {
		props: { title: 'Post Ad' } // will be passed to the page component as props
	};
}

export default SellPage;
