import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import Loading from 'components/Loading/Loading';
import { FiatCurrency } from 'models/types';
import React, { useEffect, useState } from 'react';

import Select from './Select';
import { FiatCurrencySelect, SelectProps } from './Select.types';
import { minkeApi } from '@/pages/api/utils/utils';

const CurrencySelect = ({
	onSelect,
	selected,
	error,
	height,
	selectedIdOnLoad,
	label = 'Choose Fiat currency to receive',
	minimal = false,
	selectTheFirst = false,
	selectByLocation = false,
	labelStyle = ''
}: FiatCurrencySelect) => {
	const [rawCurrencies, setRawCurrencies] = useState<FiatCurrency[]>();
	const [currencies, setCurrencies] = useState<FiatCurrency[]>();
	const [isLoading, setLoading] = useState(false);
	const [search, setSearch] = useState('');

	const selectDefaultCurrency = (availableCurrencies: FiatCurrency[]) => {
		if (selectTheFirst && !selected && availableCurrencies[0]) {
			onSelect(availableCurrencies[0]);
		}
	};

	useEffect(() => {
		const fetchCurrencyByLocation = async () => {
			if (!selectByLocation || !currencies) return;

			try {
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), 2000);

				const response = await fetch('https://ipapi.co/currency/', {
					signal: controller.signal
				});
				clearTimeout(timeoutId);

				if (!response.ok) throw new Error('Currency API failed');
				
				const currency = await response.text();
				const toSelect = currencies.find((c) => c.code === currency);
				
				if (toSelect) {
					onSelect(toSelect);
					return;
				}
			} catch (e) {
				console.error('ipapi.co: Unable to fetch user location currency - falling back to NGN', {
					error: e instanceof Error ? e.message : 'Unknown error',
					fallback: 'Using NGN as default currency'
				});
				
				// Fallback to NGN if ipapi fails
				const ngnCurrency = currencies.find((c) => c.code === 'NGN');
				if (ngnCurrency) {
					onSelect(ngnCurrency);
					return;
				}
				// If NGN not found, fall back to first currency
				selectDefaultCurrency(currencies);
			}
		};

		fetchCurrencyByLocation();
	}, [currencies, selectByLocation, selectTheFirst, selected, onSelect]);

	useEffect(() => {
		setLoading(true);
		minkeApi.get('/api/fiatCurrencies', {
			headers: {
				Authorization: `Bearer ${getAuthToken()}`
			}
		})
			.then((res) => res.data.data)
			.then((data) => {
				setRawCurrencies(data);
				const filtered: FiatCurrency[] = data.map((c: FiatCurrency) => ({ ...c, ...{ name: c.code } }));
				setCurrencies(filtered);
				
				if (selectedIdOnLoad && !selected) {
					const toSelect = filtered.find(({ id }) => String(id) === selectedIdOnLoad);
					if (toSelect) {
						onSelect(toSelect);
					}
				} else {
					selectDefaultCurrency(filtered);
				}
			})
			.catch((error) => {
				console.error('Error fetching currencies:', error);
			})
			.finally(() => {
				setLoading(false);
			});
	}, []);

	const selectCurrency = (option: FiatCurrency | undefined) => {
		onSelect(option);
		setSearch('');
	};

	if (isLoading) {
		return <Loading message="" big={false} />;
	}
	const result =
		search && rawCurrencies
			? rawCurrencies
					.filter(
						(c) =>
							c.code.toLowerCase().includes(search.toLowerCase()) ||
							c.name.toLowerCase().includes(search.toLowerCase()) ||
							String(c.country_code).toLowerCase().includes(search.toLowerCase()) ||
							c.symbol.toLowerCase().includes(search.toLowerCase())
					)
					.map((c: FiatCurrency) => ({ ...c, ...{ name: c.code } }))
			: currencies;

	return result ? (
		<Select
			label={label}
			options={result}
			selected={selected}
			onSelect={selectCurrency as SelectProps['onSelect']}
			error={error}
			minimal={minimal}
			height={height}
			flag
			onSearch={setSearch}
			labelStyle={labelStyle}
		/>
	) : (
		<></>
	);
};
export default CurrencySelect;
