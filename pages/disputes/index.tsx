import { Button, ListsTable, Loading, Pagination, Switcher } from 'components';
import Filters from 'components/Buy/Filters';
import { useAccount, usePagination } from 'hooks';
import { SearchFilters } from 'models/search';
import { List, Dispute } from 'models/types';
import { GetServerSideProps } from 'next';
import React, { useEffect, useState } from 'react';

import { AdjustmentsVerticalIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import ListsTableDispute from '@/components/ListsTableDispute';

interface PaginationMeta {
	current_page: number;
	total_pages: number;
	total_count: number;
}

const Disputes = () => {
	const [lists, setLists] = useState<List[]>([]);
    const [disputeLists, setDisputeLists] = useState<Dispute[]>([]);
	const [isLoading, setLoading] = useState(false);
	const [type, setType] = useState<string>('Buy');
	const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>();
	const [filters, setFilters] = useState<SearchFilters>({} as SearchFilters);
	const [showFilters, setShowFilters] = useState(false);
	const [needToReset, setNeedToReset] = useState(false);
	const {address}=useAccount();

	const { page, onNextPage, onPrevPage, resetPage } = usePagination();

	const performSearch = async (selectedPage: number) => {
		setLoading(true);
		if (Object.keys(filters).length === 0) return;

		const params: { [key: string]: string | undefined } = {
			page: selectedPage.toString(),
			type: type === 'Buy' ? 'SellList' : 'BuyList',
			amount: filters.amount ? filters.amount.toString() : undefined,
			currency: filters.currency ? filters.currency.id.toString() : undefined,
			payment_method: filters.paymentMethod ? filters.paymentMethod.id.toString() : undefined,
			token: filters.token ? filters.token.id.toString() : undefined,
			fiat_amount: filters.fiatAmount ? filters.fiatAmount.toString() : undefined,
			//chain_id: filters.chain ? filters.chain : undefined
		};

		const search = Object.keys(params)
			.filter((key) => !!params[key])
			.reduce((obj, key) => {
				const newObject = obj;
				newObject[key] = params[key] as string;
				return newObject;
			}, {} as { [key: string]: string });

		const searchParams = new URLSearchParams(search);
		fetch(`/api/getDisputes?${searchParams.toString()}`, {
			headers: {
				Authorization: `Bearer ${getAuthToken()}`
			}
		})
        .then((res) => res.json())
        .then((response) => {
            const data=response?.data;
            setDisputeLists(data);
            // const { data,meta }:{data:any;meta:PaginationMeta} = response?.data;
            // setPaginationMeta(meta);
            // const toBuyers = data.filter((list) => list.type === 'SellList');
            // const toSellers = data.filter((list) => list.type === 'BuyList');
            // setSellSideLists(toSellers);
            // setBuySideLists(toBuyers);
            // setLists(toBuyers);
            setLoading(false);
        });
	};

	useEffect(() => {
		resetPage();
		performSearch(1);
	}, [type, filters]);

	useEffect(() => {
		performSearch(page);
	}, [page]);



	if (!disputeLists) return <p>No lists data</p>;
	if(!address || address!==process.env.NEXT_PUBLIC_ARBITRATOR_ADDRESS){
        return (
			<>
				<div className="flex items-center justify-center h-screen">
					Not Authorized to access this page
				</div>
			</>
        );
    }

	const handleToggleFilters = () => {
		setShowFilters(!showFilters);
	};

	return (
		<div className="py-6">
			<div className="mx-auto px-4 sm:px-6 md:px-8">
				<div className="flex flex-row items-center justify-between relative">
					<div className="lg:mt-6">
						{/* <Switcher leftLabel="Buy" rightLabel="Sell" selected={type} onToggle={setType} /> */}
					</div>
					<div className='hidden'>
						<div className="flex items-center lg:hidden lg:justify-end" onClick={handleToggleFilters}>
							<AdjustmentsVerticalIcon
								width={24}
								height={24}
								className="text-gray-600 hover:cursor-pointer"
							/>
							<span className="text-gray-600 hover:cursor-pointer ml-2">Filters</span>
						</div>
						<div className="flex lg:justify-end hidden lg:block">
							<Filters
								onFilterUpdate={setFilters}
								needToReset={needToReset}
								setNeedToReset={setNeedToReset}
							/>
						</div>
					</div>
				</div>
				{showFilters && (
					<div className='hidden'>

					<div className="lg:my-8 lg:hidden">
						<Filters
							onFilterUpdate={setFilters}
							needToReset={needToReset}
							setNeedToReset={setNeedToReset}
						/>
					</div>
					</div>

				)}
				{isLoading ? (
					<Loading />
				) : disputeLists.length > 0 ? (
					<div className="py-4">
						<ListsTableDispute disputeLists={disputeLists} hideLowAmounts />
						{!!lists.length && !!paginationMeta && paginationMeta.total_pages > 1 && (
							<Pagination
								length={lists.length}
								totalCount={paginationMeta.total_count}
								page={page}
								pagesCount={paginationMeta.total_pages}
								onPrevPage={onPrevPage}
								onNextPage={onNextPage}
							/>
						)}
					</div>
				) : (
					<div className="flex flex-col items-center space-y-8">
						<div className="flex justify-center items-center w-16 h-16 bg-gray-100 p-4 rounded-full">
							<MagnifyingGlassIcon
								width={24}
								height={24}
								className="text-gray-600 hover:cursor-pointer"
							/>
						</div>
						<div>No results within your search</div>
						<div>
							<Button title="Remove all filters" onClick={() => setNeedToReset(true)} />
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export const getServerSideProps: GetServerSideProps = async () => ({
	props: {
		title: 'Disputes',
		disableAuthentication: false
	}
});

export default Disputes;