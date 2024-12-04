import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { AdjustmentsVerticalIcon } from '@heroicons/react/24/solid';
import { Loading, Steps } from 'components';
import { Amount, Details, PaymentMethod, Summary } from 'components/Listing';
import { UIList } from 'components/Listing/Listing.types';
import { Option } from 'components/Select/Select.types';
import { List } from 'models/types';
import { GetServerSideProps } from 'next';
import ErrorPage from 'next/error';
import React, { useEffect, useState } from 'react';
import { useAccount } from 'hooks';
import { COINGECKO_SUPPORTED_CURRENCIES } from 'constants/coingeckoSupportedCurrencies';
import { priceSourceMap, PriceSourceNumber, priceSourceToNumber } from 'constants/priceSourceMap';


const AMOUNT_STEP = 1;
const PAYMENT_METHOD_STEP = 2;
const DETAILS_STEP = 3;

const EditTrade = ({ id }: { id: number }) => {
    const [list, setList] = useState<List>();
    const [uiList, setUiList] = useState<UIList>();
    const [showFilters, setShowFilters] = useState(false);
    const { address } = useAccount();

    useEffect(() => {
        fetch(`/api/lists/${id}`, {
            headers: {
                Authorization: `Bearer ${getAuthToken()}`
            }
        })
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then((data1) => {
                const data = data1.data;
                console.log(data);
                
                if (!data) {
                    console.error('No data received from API');
                    return;
                }

                const {
                    fiat_currency: fiatCurrency,
                    token,
                    margin_type: marginType,
                    total_available_amount: totalAvailableAmount,
                    limit_min: limitMin,
                    limit_max: limitMax,
                    payment_methods: paymentMethods,
                    margin,
                    deposit_time_limit: depositTimeLimit,
                    payment_time_limit: paymentTimeLimit,
                    terms,
                    chain_id: chainId,
                    accept_only_verified: acceptOnlyVerified,
                    escrow_type: escrowType,
                    bank: banks,
                    price_source: rawPriceSource = 1
                } = data;

                setList(data);

                console.log('Raw DB price source:', rawPriceSource, typeof rawPriceSource);

                const currency = fiatCurrency ? {
                    ...fiatCurrency,
                    name: fiatCurrency.code
                } : null;

                // Convert string price source to number if needed
const priceSourceNumber = typeof rawPriceSource === 'string' 
? priceSourceToNumber[rawPriceSource] 
: Number(rawPriceSource);

console.log('Converted to number:', priceSourceNumber);

const finalPriceSource = priceSourceMap[priceSourceNumber as PriceSourceNumber] || 'binance_median';

console.log('Final mapped price source:', finalPriceSource);

                const ui: UIList = {
                    ...data,
                    step: 1,
                    currency,
                    tokenId: token.id,
                    fiatCurrencyId: currency?.id,
                    marginType: marginType === 0 ? 'fixed' : 'percentage',
                    totalAvailableAmount: Number(totalAvailableAmount),
                    limitMin: limitMin ? Number(limitMin) : undefined,
                    limitMax: limitMax ? Number(limitMax) : undefined,
                    paymentMethods: Array.isArray(paymentMethods) ? paymentMethods : (paymentMethods ? [paymentMethods] : []),
                    terms: terms || '',
                    margin: margin ? Number(margin) : undefined,
                    depositTimeLimit: depositTimeLimit ? Number(depositTimeLimit) : 0,
                    paymentTimeLimit: paymentTimeLimit ? Number(paymentTimeLimit) : 0,
                    chainId,
                    acceptOnlyVerified,
                    escrowType,
                    banks: Array.isArray(banks) ? banks : (banks ? [banks] : []),
                    priceSource: finalPriceSource
                };
                setUiList(ui);
            })
            .catch((error) => {
                console.error('Error fetching list:', error);
            });
    }, [id, address]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [uiList?.step]);

    if (address === undefined || list === undefined || uiList === undefined) {
        return <Loading />;
    }

    if (list.seller.address !== address) {
        return <ErrorPage statusCode={404} />;
    }

    const { step } = uiList;

    const handleToggleFilters = () => {
        setShowFilters(!showFilters);
    };

    return (
        <div className="pt-4 md:pt-6">
            <div className="w-full flex flex-col md:flex-row px-4 sm:px-6 md:px-8 mb-16">
                <div className="w-full lg:w-2/4">
                    <Steps
                        currentStep={step}
                        stepsCount={2}
                        onStepClick={(n) => setUiList({ ...uiList, ...{ step: n } })}
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
                            <Summary list={uiList} />
                        </div>
                    )}
                    {step === AMOUNT_STEP && <Amount list={uiList} updateList={setUiList} />}
                    {step === PAYMENT_METHOD_STEP && <PaymentMethod list={uiList} updateList={setUiList} />}
                    {step === DETAILS_STEP && <Details list={uiList} updateList={setUiList} />}
                </div>
                <div className="hidden lg:contents">
                    <Summary list={uiList} />
                </div>
            </div>
        </div>
    );
};

export const getServerSideProps: GetServerSideProps<{ id: string }> = async (context) => ({
    props: { title: 'Edit Ad', id: String(context.params?.id) }
});

export default EditTrade;