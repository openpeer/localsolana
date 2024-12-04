import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { FiatCurrency, List, Token } from 'models/types';
import { useCallback, useEffect, useState } from 'react';

const useListPrice = (list: List | undefined) => {
	const {
		token = {} as Token,
		fiat_currency: currency = {} as FiatCurrency,
		id,
		margin,
		margin_type: marginType,
		price_source: priceSource,
		type = 'SellList'
	} = list || {};
	const [price, setPrice] = useState<number | undefined>(marginType === 'fixed' ? margin : undefined);
	const { coingecko_id: uuid, symbol } = token;
	const { code } = currency;

	const updatePrice = useCallback(async () => {
		if (!list) return;
		//console.log('called updatePrice',marginType);
		if (marginType === 'percentage') {
			fetch(
				`/api/prices?token=${uuid}&fiat=${code.toLowerCase()}&tokenSymbol=${symbol}&priceSource=${priceSource}&type=${
					type === 'SellList' ? 'BUY' : 'SELL'
				}`,
				{
					headers: {
						Authorization: `Bearer ${getAuthToken()}`
					}
				}
			)
				.then((res) => res.json())
				.then((data) => {
					//console.log('Here uuid and code is ',uuid,code,data);
					const apiPrice: number = data.data[token.coingecko_id.toLowerCase()][currency.code.toLowerCase()];
					const percentage = margin;
					setPrice(apiPrice + (apiPrice * percentage!) / 100);
				});
		} else {
			setPrice(margin);
		}
	}, [list, code, margin, marginType, uuid, priceSource, type]);

	useEffect(() => {
		updatePrice();
		const timer = setInterval(updatePrice, 60 * 1000);

		return () => {
			clearTimeout(timer);
		};
	}, [id, margin, marginType, uuid, code, updatePrice]);

	return { price };
};

export default useListPrice;
