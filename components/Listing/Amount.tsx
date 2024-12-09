/* eslint-disable react-hooks/exhaustive-deps */
import { Input, Label, Loading, MarginSwitcher } from 'components';
import { useFormErrors } from 'hooks';
import { Errors, Resolver } from 'models/errors';
import { FiatCurrency, List, Token } from 'models/types';
import React, { useEffect, useState } from 'react';
import { COINGECKO_SUPPORTED_CURRENCIES, CoingeckoSupportedCurrency } from 'constants/coingeckoSupportedCurrencies';
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
        priceSource
    } = list;
    
    const percentage = marginType === 'percentage';
    const [percentageMargin, setPercentageMargin] = useState<number>(percentage ? savedMargin || 1 : 1);
    const [fixedMargin, setFixedMargin] = useState<number | undefined>(percentage ? undefined : savedMargin);
    const [price, setPrice] = useState<number | undefined>();

    const { errors, clearErrors, validate } = useFormErrors();

    const margin = percentage ? percentageMargin : fixedMargin;

    const updateValue = (obj: any) => {
        clearErrors(Object.keys(obj));
        updateList({ ...list, ...obj });
    };

    const updateMargin = (m: number) => {
        clearErrors(['margin']);
        if (percentage) {
            setPercentageMargin(m);
            updateValue({ margin: m });
        } else {
            setFixedMargin(m);
            updateValue({ 
                margin: 0,
                price: m,  // Ensure price is set for fixed pricing
                marginType: 'fixed'
            });
        }
    };

    const resolver: Resolver = () => {
        const total = totalAvailableAmount || 0;
        const min = limitMin || 0;
        const max = limitMax || 0;

        const error: Errors = {};

        const { minimum_amount: minimumAmount } = token as Token;

        if (!!minimumAmount && total < Number(minimumAmount)) {
            error.totalAvailableAmount = `Should be bigger or equals to ${minimumAmount} ${token!.name}`;
        }

        if (total <= 0) {
            error.totalAvailableAmount = 'Should be bigger than 0';
        }

        if (!!limitMax && min > max) {
            error.limitMin = 'Should be smaller than the max';
        }

        const fiatTotal = total * price!;

        if (!!limitMin && min > fiatTotal) {
            error.limitMin = `Should be smaller than the total available amount ${fiatTotal.toFixed(2)} ${currency!.name}`;
        }

        if (!percentage && (margin || 0) <= 0) {
            error.margin = 'Should be bigger than zero';
        }

        return error;
    };

    useEffect(() => {
        if (!token || !currency) return;

        const currencyLower = currency.name.toLowerCase() as CoingeckoSupportedCurrency;
        const isCoingeckoSupported = COINGECKO_SUPPORTED_CURRENCIES.includes(currencyLower);
        
        // Validate current price source
        const currentSource = list.priceSource || 'binance_median';
        const validSource = !isCoingeckoSupported && !currentSource.startsWith('binance')
            ? 'binance_median'
            : currentSource;

        // Update if source changed
        if (validSource !== currentSource) {
            updateValue({ priceSource: validSource });
            return;
        }

        if (validSource.startsWith('binance')) {
            // Convert type from "BuyList"/"SellList" to "BUY"/"SELL"
            const binanceType = type.replace('List', '').toUpperCase();
            
            // Binance pricing
            minkeApi.get(`/api/prices`, {
                params: {
                    token: token.name.toUpperCase(),
                    fiat: currency.name.toUpperCase(),
                    source: validSource,
                    type: binanceType  // Now sends "BUY" instead of "BUYLIST"
                }
            })
            .then((res) => res.data.data)
            .then((data) => {
                if (Object.keys(data).length > 0) {
                    setPrice(data[token.name][currency.name]);
                }
            });
        } else {
            // Coingecko pricing
            const { coingecko_id: coingeckoId } = token as Token;
            let tokenName = token.name;
            if (tokenName === 'USDC') tokenName = 'usd-coin';
            else if (tokenName === 'USDT') tokenName = 'tether';

            minkeApi.get(`/api/prices?token=${coingeckoId}&fiat=${currency.name.toLowerCase()}`)
                .then((res) => res.data.data)
                .then((data) => {
                    if (Object.keys(data).length > 0) {
                        setPrice(data[coingeckoId || token.name][currency.name.toLowerCase()]);
                    }
                });
        }
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
        if (validate(resolver)) {
            updateValue({ step: list.step + 1 });
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
                price={price}
                listPriceSource={priceSource}
                onUpdatePriceSource={(ps) => updateValue({ priceSource: ps })}
            />
        </StepLayout>
    );
};

export default Amount;