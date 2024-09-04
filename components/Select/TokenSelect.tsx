import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import Loading from 'components/Loading/Loading';
import { Token } from 'models/types';
import React, { useEffect, useState } from 'react';

import Select from './Select';
import { SelectProps, TokenSelectProps } from './Select.types';
import axios from 'axios';
import { minkeApi } from '@/pages/api/utils/utils';

const TokenSelect = ({
	onSelect,
	selected,
	error,
	minimal,
	selectedIdOnLoad,
	label = 'Choose token to list',
	labelStyle = '',
	networkId,
	allTokens = false
}: TokenSelectProps) => {
	const [tokens, setTokens] = useState<Token[]>();
	const [isLoading, setLoading] = useState(false);
	//const { chain, chains } = useNetwork();
	//const chainId = allTokens ? undefined : networkId || chain?.id || chains[0]?.id || polygon.id;

	useEffect(() => {
		//if (!chainId && !allTokens) return;

		setLoading(true);

		minkeApi.get(`/api/tokens`, {
			headers: {
				Authorization: `Bearer ${getAuthToken()}`
			},
			params: new URLSearchParams().toString()
		})
			.then((res) => res.data)
			.then((data) => {
				const source: Token[] = minimal ? data.map((t: Token) => ({ ...t, ...{ name: t.symbol } })) : data;
				if (allTokens) {
					// remove symbol duplicates from the source array
					const uniqueSymbols = new Set<string>();
					const uniqueSource = source.filter((t) => {
						if (uniqueSymbols.has(t.symbol)) {
							return false;
						}
						uniqueSymbols.add(t.symbol);
						return true;
					});
					setTokens(uniqueSource);
				} else {
					setTokens(source);
				}

				if (selectedIdOnLoad) {
					if (!selected) {
						const toSelect = source.find(({ id }) => String(id) === selectedIdOnLoad);
						if (toSelect && !selected) {
							onSelect(toSelect);
						}
					}
				} else if (minimal && !selected && source[0]) {
					onSelect(source[0]);
				}
				setLoading(false);
			});
	});

	if (isLoading) {
		return <Loading message="" big={false} />;
	}

	return tokens ? (
		<Select
			label={label}
			options={tokens}
			selected={selected}
			onSelect={onSelect as SelectProps['onSelect']}
			error={error}
			minimal={minimal}
			token
			labelStyle={labelStyle}
		/>
	) : (
		<></>
	);
};
export default TokenSelect;
