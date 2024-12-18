/* eslint-disable react-hooks/exhaustive-deps */
import { Input, Label, Loading, MarginSwitcher } from 'components';
import { useFormErrors } from 'hooks';
import { Errors, Resolver } from 'models/errors';
import { FiatCurrency, List, Token } from 'models/types';
import React, { useEffect, useState } from 'react';
import { 
    COINGECKO_SUPPORTED_CURRENCIES, 
    isCoinGeckoSupported,
    isBinanceSupported
} from 'constants/coingeckoSupportedCurrencies';
import { minkeApi } from '@/pages/api/utils/utils';
import { ListStepProps } from './Listing.types';
import StepLayout from './StepLayout';

const Amount = ({ list, updateList }: ListStepProps) => {
    const {
        token,
        currency,
        totalAvailableAmount,
        limitMin,
        limitMax,
        marginType = 'fixed',
        margin: savedMargin,
        type,
        priceSource,
        calculatedPrice
    } = list;
    
    const percentage = marginType === 'percentage';
    console.log("MARGIN TYPE:", marginType)
    const [percentageMargin, setPercentageMargin] = useState<number>(percentage ? savedMargin || 1 : 1);
    const [fixedMargin, setFixedMargin] = useState<number | undefined>(percentage ? undefined : savedMargin);
    const [price, setPrice] = useState<number | undefined>();

    const { errors, clearErrors, validate } = useFormErrors();

    const margin = percentage ? percentageMargin : fixedMargin;
    console.log("MARGIN:", margin)

    const updateValue = (obj: any) => {
        console.log("Before update:", list);
        updateList({ ...list, ...obj });
        console.log("After update:", { ...list, ...obj });
    };

    const updateMargin = (m: number) => {
        console.log("Updating margin to:", m);
        clearErrors(['margin']);
        if (percentage) {
            setPercentageMargin(m);
        } else {
            setFixedMargin(m);
        }
        updateValue({ margin: m });
    };

    const resolver: Resolver = () => {
        const total = totalAvailableAmount || 0;
        const min = limitMin;
        const max = limitMax;
        const fiatTotal = total * (calculatedPrice || 0);

        const error: Errors = {};

        // Validate total available amount
        const { minimum_amount: minimumAmount } = token as Token;
        if (minimumAmount !== null && total < Number(minimumAmount)) {
            error.totalAvailableAmount = `Should be bigger or equals to ${minimumAmount} ${token!.name}`;
        }
        if (total <= 0) {
            error.totalAvailableAmount = 'Should be bigger than 0';
        }

        // Validate limits only if they are set
        if (min !== undefined && min !== null) {
            if (min <= 0) {
                error.limitMin = 'If set, minimum limit must be greater than 0';
            }
            if (min > fiatTotal) {
                error.limitMin = `Should be smaller than the total available amount ${fiatTotal.toFixed(2)} ${currency!.name}`;
            }
        }

        if (max !== undefined && max !== null) {
            if (max <= 0) {
                error.limitMax = 'If set, maximum limit must be greater than 0';
            }
            if (max > fiatTotal) {
                error.limitMax = `Should be smaller than the total available amount ${fiatTotal.toFixed(2)} ${currency!.name}`;
            }
        }

        // Only validate min vs max if both are set
        if (min !== undefined && min !== null && max !== undefined && max !== null) {
            if (min > max) {
                error.limitMin = 'Minimum limit must be less than or equal to maximum limit';
            }
        }

        // Margin validations
        if (percentage) {
            if ((margin || 0) <= 0) {
                error.margin = 'Should be bigger than zero';
            }
        } else {
            if (!calculatedPrice || calculatedPrice <= 0) {
                error.margin = 'Price should be set for fixed pricing';
            }
        }

        console.log("Validation errors:", error);
        return error;
    };

    useEffect(() => {
        if (!token || !currency) return;
        console.log("Fetching price for token:", token.name, "and currency:", currency.name);

        const currencyCode = currency.name.toUpperCase();
        
        // Check currency support
        const isCoingeckoSupported = isCoinGeckoSupported(currencyCode);
        const binanceSupported = isBinanceSupported(currencyCode);
        
        // For Binance-only currencies (like VES), ensure we're using a Binance source
        if (!isCoingeckoSupported && binanceSupported) {
            const currentSource = String(list.priceSource || 'binance_median');
            if (!currentSource.startsWith('binance_')) {
                updateValue({ priceSource: 'binance_median' });
            }
            return;
        }
        
        // For other currencies, keep existing logic
        const currentSource = String(list.priceSource || 'binance_median');
        const validSource = isCoingeckoSupported 
            ? currentSource 
            : binanceSupported 
                ? 'binance_median'
                : currentSource;

        if (validSource !== currentSource) {
            updateValue({ priceSource: validSource });
            return;
        }
        
        console.log("validSource", validSource);

        // Format parameters based on price source
        const params = validSource.startsWith('binance_') 
            ? {
                token: token.name.toUpperCase(),
                fiat: currency.name.toUpperCase(),
                source: validSource,
                type: type.replace('List', '').toUpperCase()
            }
            : {
                // For CoinGecko, use coingecko_id and lowercase currency
                token: token.coingecko_id,
                fiat: currency.name.toLowerCase(),
                source: validSource
            };

        console.log("Fetching price with params:", params);

        // Fetch the price
        minkeApi.get(`/api/prices`, { params })
            .then((res) => {
                console.log("Price API response:", res.data);
                return res.data.data;
            })
            .then((data) => {
                if (Object.keys(data).length > 0) {
                    let fetchedPrice;
                    if (validSource.startsWith('binance_')) {
                        fetchedPrice = data[token.name][currency.name];
                    } else {
                        // For CoinGecko responses, use coingecko_id and lowercase currency
                        fetchedPrice = data[token.coingecko_id][currency.name.toLowerCase()];
                    }
                    
                    if (fetchedPrice) {
                        console.log("Fetched price:", fetchedPrice);
                        setPrice(fetchedPrice);
                    }
                }
            })
            .catch((error) => {
                console.error("Error fetching price:", error);
            });
    }, [token, currency, list.priceSource]);

    useEffect(() => {
        if (price) {
            if (fixedMargin === undefined) {
                setFixedMargin(price);
                if (!percentage) updateMargin(price);
            }
        }
    }, [fixedMargin, percentage, price]);

    useEffect(() => {
        if (price && marginType === 'fixed') {
            updateMargin(price);
        }
    }, [price]);

    const onProceed = () => {
        console.log("Proceed button clicked");
        const isValid = validate(resolver);
        console.log("Validation result:", isValid);
        if (isValid) {
            console.log("Current step:", list.step);
            updateValue({ step: list.step + 1 });
            console.log("Updated step:", list.step + 1);
        } else {
            console.log("Validation errors:", errors);
        }
    };

    const onSelectType = (t: List['margin_type']) => {
        const m = t === 'fixed' ? fixedMargin : percentageMargin;
        updateValue({ marginType: t, margin: m });
    };

    if (!token || !currency) return <Loading />;

    return (
        <StepLayout onProceed={onProceed}>
            <Input
                label={type === 'BuyList' ? 'Enter total amount of crypto to buy' : 'Enter total available crypto amount'}
                addOn={<span className="text-gray-500 sm:text-sm mr-3">{token.name}</span>}
                id="totalAvailableAmount"
                value={totalAvailableAmount}
                onChangeNumber={(n) => updateValue({ totalAvailableAmount: n })}
                type="decimal"
                required
                decimalScale={18}
                error={errors.totalAvailableAmount}
            />
            <div>
                <Label title="Enter fiat order limit" />
                <div className="flex flex-row gap-x-8 -mt-6">
                    <Input
                        placeholder="100"
                        label="Min:"
                        addOn={<span className="text-gray-500 sm:text-sm mr-3">{currency.name}</span>}
                        id="limitMin"
                        type="decimal"
                        value={list.limitMin ?? undefined}
                        onChangeNumber={(n) => updateValue({ limitMin: n })}
                        error={errors.limitMin}
                    />
                    <Input
                        placeholder="1000"
                        label="Max:"
                        addOn={<span className="text-gray-500 sm:text-sm mr-3">{currency.name}</span>}
                        id="limitMax"
                        type="decimal"
                        value={list.limitMax ?? undefined}
                        onChangeNumber={(n) => updateValue({ limitMax: n })}
                    />
                </div>
            </div>

            <Label title="Set Price" />
            <div className="mb-4">
                <span className="text-sm text-gray-600">
                    Set how you want to price {type === 'BuyList' ? 'the' : 'your'} crypto. At a fixed price or above or
                    below the market price.
                </span>
            </div>
            <MarginSwitcher
                selected={marginType}
                onSelect={onSelectType}
                currency={currency as FiatCurrency}
                token={token as Token}
                margin={margin}
                updateMargin={updateMargin}
                error={errors.margin}
                price={list.calculatedPrice || price}
                listPriceSource={priceSource}
                onUpdatePriceSource={(ps) => updateValue({ priceSource: ps })}
            />
        </StepLayout>
    );
};

export default Amount;