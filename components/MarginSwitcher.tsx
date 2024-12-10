import React, { useState, useEffect } from 'react';

import { FiatCurrency, List, PriceSource, Token } from '../models/types';
import Loading from './Loading/Loading';
import Selector from './Selector';
import Label from './Label/Label';
import Select from './Select/Select';
import { Option as OptionModel } from './Select/Select.types';
import { 
	isCoinGeckoSupported,
	isBinanceSupported
} from 'constants/coingeckoSupportedCurrencies';
import { minkeApi } from '@/pages/api/utils/utils';

interface Props {
	selected: List['margin_type'];
	onSelect: (opt: List['margin_type']) => void;
	margin: number | undefined;
	token: Token;
	currency: FiatCurrency;
	updateMargin: (n: number) => void;
	error?: string;
	price: number | undefined;
	listPriceSource: PriceSource | undefined;
	onUpdatePriceSource: (ps: PriceSource) => void;
}

interface OptionPriceSource extends OptionModel {
	api_id: PriceSource;
}

const priceSources: OptionPriceSource[] = [
	{
		id: 0,
		api_id: 'coingecko',
		name: 'Coingecko',
		icon: ''
	},
	{
		id: 1,
		api_id: 'binance_median',
		name: 'Binance P2P Median Price',
		icon: ''
	},
	{
		id: 2,
		api_id: 'binance_min',
		name: 'Binance P2P Min Price',
		icon: ''
	},
	{
		id: 3,
		api_id: 'binance_max',
		name: 'Binance P2P Max Price',
		icon: ''
	}
];

const Option = ({ label, selected, onSelect }: { label: string; selected: boolean; onSelect: Props['onSelect'] }) => (
	<button
		type="button"
		className={`w-full flex justify-center rounded-full py-2 ${selected && 'bg-white text-black'}`}
		onClick={() => {
			const mode = label.toLowerCase() === 'floating' ? 'percentage' : 'fixed';
			console.log('Switching to mode:', mode);
			onSelect(mode as List['margin_type']);
		}}
	>
		{label}
	</button>
);

const MarginSwitcher = ({
	selected,
	onSelect,
	margin,
	currency,
	token,
	updateMargin,
	error,
	price,
	listPriceSource,
	onUpdatePriceSource
}: Props) => {
	const [isLoadingPrice, setIsLoadingPrice] = useState(false);
	const [localPrice, setLocalPrice] = useState<number | undefined>(price);
	const [fixedMargin, setFixedMargin] = useState<number | undefined>(
		selected === 'fixed' ? margin : undefined
	);
	const [percentageMargin, setPercentageMargin] = useState<number | undefined>(
		selected === 'percentage' ? margin ?? 1 : undefined
	);

	// Handle margin updates based on mode
	const handleMarginUpdate = (value: number) => {
		if (selected === 'fixed') {
			setFixedMargin(value);
			updateMargin(value);
		} else {
			setPercentageMargin(value);
			updateMargin(value);
		}
	};

	// Log props and state on every render
	console.log('MarginSwitcher render:', {
		mode: selected,
		inputMargin: margin,
		inputPrice: price,
		localPrice,
		listPriceSource,
		isLoadingPrice,
		currency: currency.name,
		token: token.name
	});

	// Get available price sources
	const availablePriceSources = React.useMemo(() => {
		const currencyCode = currency.name.toUpperCase();
		const isCoingeckoSupported = isCoinGeckoSupported(currencyCode);
		const isBinanceOnly = !isCoingeckoSupported && isBinanceSupported(currencyCode);

		if (isBinanceOnly) {
			return priceSources.filter(ps => ps.api_id.startsWith('binance'));
		}
		return priceSources;
	}, [currency.name]);

	// Initialize price source
	const [priceSource, setPriceSource] = useState<PriceSource>(() => {
		if (listPriceSource && availablePriceSources.some(p => p.api_id === listPriceSource)) {
			return listPriceSource;
		}
		// Default to first available source
		return availablePriceSources[0].api_id;
	});

	// Add logging to useEffect
	useEffect(() => {
		const fetchPrice = async () => {
			if (!price) {
				setIsLoadingPrice(true);
				try {
					// Special handling for Solana token
					const tokenSymbol = token.name.toUpperCase() === 'SOLANA' ? 'SOL' : token.name;
					
					const params = priceSource.startsWith('binance') 
						? {
							token: tokenSymbol,  // Will be 'SOL' for Solana
							fiat: currency.name.toUpperCase(),
							source: priceSource,
							type: 'BUY'
						}
						: {
							token: token.coingecko_id,
							fiat: currency.name.toLowerCase()
						};

					console.log('Fetching price with params:', params);  // Debug log
					const { data } = await minkeApi.get('/api/prices', { params });

					if (data.data) {
						let fetchedPrice;
						if (priceSource.startsWith('binance')) {
							fetchedPrice = data.data[tokenSymbol][currency.name];
						} else {
							fetchedPrice = data.data[token.coingecko_id][currency.name.toLowerCase()];
						}
						
						if (fetchedPrice) {
							setLocalPrice(fetchedPrice);
							if (selected === 'fixed' && fixedMargin === undefined) {
								setFixedMargin(fetchedPrice);
								updateMargin(fetchedPrice);
							}
						}
					}
				} catch (error) {
					console.error('Failed to fetch price:', error);
				} finally {
					setIsLoadingPrice(false);
				}
			}
		};

		fetchPrice();
	}, [selected, token, currency, priceSource]);

	// Log when price source changes
	const selectPriceSource = async (ps: OptionPriceSource) => {
		console.log('Price source change:', {
			from: priceSource,
			to: ps.api_id,
			mode: selected,
			currentMargin: margin
		});

		setPriceSource(ps.api_id);
		onUpdatePriceSource(ps.api_id);
		setIsLoadingPrice(true);
		
		try {
			const tokenSymbol = token.name === 'SOLANA' ? 'SOL' : token.name;
			
			const params = ps.api_id.startsWith('binance')
				? {
					token: tokenSymbol.toUpperCase(),
					fiat: currency.name.toUpperCase(),
					source: ps.api_id,
					type: 'BUY'
				}
				: {
					token: token.coingecko_id,
					fiat: currency.name.toLowerCase()
				};

			const { data } = await minkeApi.get('/api/prices', { params });

			if (data.data) {
				let fetchedPrice;
				if (ps.api_id.startsWith('binance')) {
					fetchedPrice = data.data[tokenSymbol][currency.name];
				} else {
					fetchedPrice = data.data[token.coingecko_id][currency.name.toLowerCase()];
				}
				
				if (fetchedPrice) {
					setLocalPrice(fetchedPrice);
					if (selected === 'fixed') {
						updateMargin(fetchedPrice);
					}
				}
			}
		} catch (error) {
			console.error('Failed to fetch price:', error);
		} finally {
			setIsLoadingPrice(false);
		}
	};

	// Log before rendering Selector
	console.log('Selector values:', {
		mode: selected,
		displayValue: selected === 'fixed' ? (localPrice ?? margin ?? 1) : (margin ?? 0),
		margin,
		localPrice
	});

	console.log('Debug values:', {
		fixedMargin,
		localPrice,
		margin,
		price,
		'fixedMargin ?? localPrice ?? 0': fixedMargin ?? localPrice ?? 0
	});

	return (
		<>
			<div className="w-full flex flex-col rounded-full bg-gray-100 mb-4">
				<div className="flex p-1.5 items-center text-neutral-500 font-bold">
					<Option label="Fixed" selected={selected === 'fixed'} onSelect={onSelect} />
					<Option label="Floating" selected={selected === 'percentage'} onSelect={onSelect} />
				</div>
			</div>
			<Label title={selected === 'fixed' ? 'Price' : 'Margin (% above market)'} />
			<>
				{selected === 'fixed' ? (
					isLoadingPrice ? (
						<Loading big={false} />
						
					) : (
						
						<Selector
							value={(fixedMargin || localPrice) ?? 0}
							suffix={` ${currency.name} per ${token.name}`}
							updateValue={handleMarginUpdate}
							error={error}
							decimals={3}
						/>
					)
				) : (
					<Selector 
						value={percentageMargin ?? 1}
						suffix="%" 
						updateValue={handleMarginUpdate}
						error={error}
						allowNegative 
					/>
				)}

				{currency.allow_binance_rates && token.allow_binance_rates && (
					<Select
						label="Market Price Source"
						options={availablePriceSources}
						selected={availablePriceSources.find(p => p.api_id === priceSource) || availablePriceSources[0]}
						onSelect={o => selectPriceSource(o as OptionPriceSource)}
					/>
				)}
			</>
		</>
	);
};

export default MarginSwitcher;
