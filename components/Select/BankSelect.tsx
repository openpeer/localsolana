import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import Loading from 'components/Loading/Loading';
import { Bank } from 'models/types';
import React, { useEffect, useState } from 'react';

import Select from './Select';
import { SelectProps } from './Select.types';

const BankSelect = ({
	currencyId,
	onSelect,
	selected,
	error,
	labelStyle = '',
	options
}: {
	currencyId: number;
	onSelect: SelectProps['onSelect'];
	selected: SelectProps['selected'];
	error?: SelectProps['error'];
	labelStyle?: SelectProps['labelStyle'];
	options?: Bank[] | undefined;
}) => {
	const [banks, setBanks] = useState<Bank[] | undefined>(options);
	const [isLoading, setLoading] = useState(false);
	const [search, setSearch] = useState('');
	const [fetchError, setFetchError] = useState<string | undefined>();

	useEffect(() => {
		if (options) {
			return;
		}

		setLoading(true);
		setFetchError(undefined);

		fetch(currencyId === -1 ? `/api/getbanks` : `/api/banks?currency_id=${currencyId}`, {
			headers: {
				Authorization: `Bearer ${getAuthToken()}`,
				'Content-Type': 'application/json'
			}
		})
			.then(async (res) => {
				if (!res.ok) {
					throw new Error('Failed to fetch banks');
				}
				return res.json();
			})
			.then((data) => {
				// Process banks to ensure image URLs are properly set
				const processedBanks = data.data.map((bank: Bank) => ({
					...bank,
					// Use existing imageUrl or fall back to icon
					imageUrl: bank.imageUrl || bank.icon || 
						(bank.image ? `https://bankimg.localsolana.com/${bank.image}` : '')
				}));
				setBanks(processedBanks);
			})
			.catch((err) => {
				console.error('Bank fetch error:', err);
				setFetchError('Failed to load banks. Please try again.');
			})
			.finally(() => {
				setLoading(false);
			});
	}, [currencyId, options]);

	const filteredBanks = search
		? banks?.filter(
				(b) =>
					(b.name && b.name.toLowerCase().includes(search.toLowerCase())) ||
					(b.code && b.code.toLowerCase().includes(search.toLowerCase()))
			)
		: banks;

	if (isLoading) {
		return <Loading big={false} />;
	}

	if (fetchError) {
		return (
			<div className="text-red-500 text-sm p-2">
				{fetchError}
			</div>
		);
	}

	return banks ? (
		<Select
			label="Payment Method"
			options={filteredBanks || []}
			selected={selected}
			onSelect={onSelect}
			error={error || fetchError}
			labelStyle={labelStyle}
			onSearch={setSearch}
		/>
	) : null;
};

export default BankSelect;
