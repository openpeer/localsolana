// components/Buy/OrderPaymentMethod.tsx

/* eslint-disable react/jsx-curly-newline */
import { BankSelect, Button, Input, Loading, Textarea } from 'components';
import { UIPaymentMethod } from 'components/Listing/Listing.types';
import StepLayout from 'components/Listing/StepLayout';
import { useConfirmationSignMessage, useFormErrors, useAccount } from 'hooks';
import { Errors, Resolver } from 'models/errors';
import { Bank, PaymentMethod, PaymentMethodForm, AccountFieldValue } from 'models/types';
import Image from 'next/image';
import { useRouter } from 'next/router';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import snakecaseKeys from 'snakecase-keys';

import { PencilSquareIcon } from '@heroicons/react/20/solid';

import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { truncate } from 'utils';
import { BuyStepProps } from './Buy.types';
import { SelectOption } from 'components/Select/Select.types';
import { UIOrder } from './Buy.types';

/**
 * OrderPaymentMethod Component
 * Handles payment method selection during order creation.
 * 
 * Behavior differs based on list type:
 * - SellList: Shows only bank selection (buyer pays to seller's account)
 * - BuyList: Shows bank selection and account details form (seller provides payment details)
 * 
 * Features:
 * - Dynamic bank loading based on currency
 * - Form validation for required fields
 * - Payment method state management
 * - Error handling and loading states
 * 
 * @param {BuyStepProps} props
 * @param {UIOrder} props.order - Current order state
 * @param {Function} props.updateOrder - Callback to update parent state
 */
const OrderPaymentMethod = ({ order, updateOrder }: BuyStepProps) => {
	const { address } = useAccount();
	const [isLoading, setIsLoading] = useState(false);
	const [bank, setBank] = useState<Bank | undefined>();
	const [values, setValues] = useState<Record<string, string>>({});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

	// Memoize list values to prevent unnecessary re-renders
	const { list, payment_method: paymentMethod } = useMemo(() => order, [order]);
	const { fiat_currency: currency, type, banks } = useMemo(() => list, [list]);

	// Handle bank selection with proper type handling
	const handleBankSelect = useCallback((selectedBank: SelectOption | undefined) => {
		if (!selectedBank || !('account_info_schema' in selectedBank)) return;
		
		const bank = selectedBank as Bank;
		setBank(bank);
		updateOrder({
			...order,
			payment_method: {
				id: Number(bank.id),
				bank: bank,
				bank_id: bank.id,
				values: {}
			}
		});
	}, [order, updateOrder]);

	// Handle payment method update
	const handlePaymentMethodUpdate = useCallback((updatedMethod: PaymentMethod) => {
		updateOrder({
			...order,
			payment_method: updatedMethod
		});
	}, [order, updateOrder]);

	useEffect(() => {
		if (!currency?.id || !banks) return;
		
		const fetchPaymentMethods = async () => {
			setIsLoading(true);
			try {
				// Fetch implementation here
				setPaymentMethods([]); // Replace with actual fetch
			} finally {
				setIsLoading(false);
			}
		};

		fetchPaymentMethods();
	}, [currency?.id, banks]);

	if (!address) return <Loading />;
	if (isLoading) return <Loading />;

	const schema = bank?.account_info_schema || [];

	return (
		<div>
			<h2 className="text-xl mt-8 mb-2">Payment Methods</h2>
			<p>
				{type === 'SellList' 
					? 'Choose how you want to pay'
					: 'Choose how you want to receive your money'
				}
			</p>
			{type === 'SellList' ? (
				<div className="mb-2">
					<BankSelect
						currencyId={currency.id}
						options={banks}
						selected={bank}
						error={errors.bankId}
						onSelect={handleBankSelect}
					/>
				</div>
			) : (
				<>
					<div className="mb-2">
						<BankSelect
							currencyId={currency.id}
							options={banks}
							selected={bank}
							error={errors.bankId}
							onSelect={handleBankSelect}
						/>
						<div>
							{schema.map(({ id: schemaId, label, type: schemaType = 'text', required }) => (
								<Input
									key={schemaId}
									label={label}
									type="text"
									id={schemaId}
									onChange={(value) => handlePaymentMethodUpdate({
										...paymentMethod,
										bank: paymentMethod.bank,
										bank_id: paymentMethod.bank?.id,
										values: {
											...paymentMethod.values,
											[schemaId]: value
										}
									} as PaymentMethod)}
									error={errors[schemaId]}
									value={values[schemaId]}
									required={required}
								/>
							))}
						</div>
					</div>
				</>
			)}
		</div>
	);
};

export default OrderPaymentMethod;
