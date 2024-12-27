/* eslint-disable react/jsx-curly-newline */
import { BankSelect, Button, Input, Loading, Textarea } from 'components';
import { UIPaymentMethod } from 'components/Listing/Listing.types';
import StepLayout from 'components/Listing/StepLayout';
import { useConfirmationSignMessage, useFormErrors, useAccount } from 'hooks';
import { Errors, Resolver } from 'models/errors';
import { Bank, PaymentMethod, PaymentMethodForm, AccountFieldValue } from 'models/types';
import Image from 'next/image';
import { useRouter } from 'next/router';
import React, { useEffect, useState, useMemo } from 'react';
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

	if (!address) {
		return <Loading />;
	}

	console.log('OrderPaymentMethod render:', {
		hasAddress: !!address,
		order
	});

	const { list, paymentMethod = {} as PaymentMethod } = useMemo(() => ({
		list: order.list,
		paymentMethod: order.paymentMethod
	}), [order.list, order.paymentMethod]);

	const { fiat_currency: currency, type, banks, token } = useMemo(() => ({
		fiat_currency: list.fiat_currency,
		type: list.type,
		banks: list.banks,
		token: list.token
	}), [list]);

	console.log('Destructured values:', {
		currency,
		type,
		banks,
		paymentMethod
	});

	const { id, bank, values = {} } = paymentMethod;
	const { account_info_schema: schema = [] } = (bank || {}) as Bank;
	const { errors, clearErrors, validate } = useFormErrors();
	const router = useRouter();
	const [error, setError] = useState<string | undefined>();

	/**
	 * Converts PaymentMethod to form state
	 * Used when loading existing payment methods
	 */
	const toFormState = (pm: PaymentMethod): PaymentMethodForm => ({
		id: pm.id,
		bank: pm.bank,
		bank_id: pm.bank_id,
		values: pm.values
	});

	/**
	 * Converts form state to PaymentMethod
	 * Used when submitting to API
	 * @throws {Error} If required fields are missing
	 */
	const toPaymentMethod = (form: PaymentMethodForm): PaymentMethod => {
		if (!form.id || !form.bank || !form.bank_id) {
			throw new Error('Invalid payment method data');
		}
		return {
			id: form.id,
			bank: form.bank,
			bank_id: form.bank_id,
			values: form.values
		};
	};

	/**
	 * Converts PaymentMethodForm to UIPaymentMethod
	 * Used for UI state management
	 */
	const toUIPaymentMethod = (form: PaymentMethodForm): UIPaymentMethod => ({
		id: form.id,
		bank: form.bank,
		bank_id: String(form.bank_id), // Convert to string for UI
		values: form.values
	});

	/**
	 * Form validation resolver
	 * Validates:
	 * - Bank selection
	 * - Required fields from account_info_schema
	 */
	const resolver: Resolver = () => {
		const error: Errors = {};

		if (!bank?.id) {
			error.bankId = 'Should be present';
		}

		
		schema.forEach((field) => {
			if (field.required && !values[field.id]) {
				error[field.id] = `${field.label} should be present`;
			}
		});

		return error;
	};

	/**
	 * Creates a new order via API
	 * Handles both success and error cases
	 * Redirects to order page on success
	 */
	const createOrder = async () => {
		try {
			const result = await fetch('/api/createOrder/', {
						method: 'POST',
						body: JSON.stringify(
							snakecaseKeys(
								{
									listId: order.list.id,
									fiatAmount: order.fiat_amount,
									tokenAmount: truncate(order.token_amount, token.decimals),
									price: order.price,
									paymentMethod: toPaymentMethod(paymentMethod as PaymentMethodForm),
									buyer_id: address,
								},
								{ deep: true }
							)
						),
						headers: {
							Authorization: `Bearer ${getAuthToken()}`,
							'Content-Type': 'application/json',
						}
					});

			if (!result.ok) {
				const errorData = await result.json();
				throw new Error(errorData.error || 'Failed to create order');
			}

			const { data } = await result.json();
			
			if (data.id) {
				router.push(`/orders/${data.id}`);
			} else {
				throw new Error('Order created but no ID returned');
			}
		} catch (error) {
			console.error('Order creation error:', error);
			if (error instanceof Error) {
				setError(error.message);
			} else {
				setError('An unexpected error occurred');
			}
		}
	};

	const { signMessage } = useConfirmationSignMessage({
		onSuccess: createOrder
	});

	/**
	 * Handles order creation process
	 * For instant escrow: Direct order creation
	 * For manual escrow: Requires message signing before creation
	 */
	const onProceed = async () => {
		if (validate(resolver)) {
			if (list.escrow_type === 'instant') {
				await createOrder();
			} else {
				const message = JSON.stringify(
					snakecaseKeys(
						{
							listId: order.list.id,
							fiatAmount: order.fiat_amount,
							tokenAmount: order.token_amount,
							price: order.price,
							paymentMethod: bank?.name
						},
						{ deep: true }
					),
					undefined,
					4
				);
				signMessage({ message });
			}
		}
	};

	const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
	const [isLoading, setLoading] = useState(false);

	const [edit, setEdit] = useState(false);

	/**
	 * Updates payment method and clears form errors
	 * Used when selecting or editing payment methods
	 */
	const setPaymentMethod = (pm: PaymentMethodForm | undefined) => {
		console.log('setPaymentMethod called with:', pm);
		setEdit(false);
		clearErrors([...schema.map((field) => field.id), ...['bankId']]);
		updateOrder({
			...order,
			paymentMethod: pm ? toUIPaymentMethod(pm) : undefined
		});
	};

	const updateOrderWithPaymentMethod = (pm: PaymentMethodForm | undefined) => {
		updateOrder({
			...order,
			paymentMethod: pm ? toUIPaymentMethod(pm) : undefined
		});
	};

	const updatePaymentMethod = (pm: PaymentMethodForm | undefined) => {
		console.log('updatePaymentMethod called with:', pm);
		clearErrors([...schema.map((field) => field.id), ...['bankId']]);
		updateOrderWithPaymentMethod(pm);
	};

	const enableEdit = (e: React.MouseEvent<HTMLElement>, pm: PaymentMethodForm) => {
		e.stopPropagation();
		updatePaymentMethod(pm);
		setEdit(true);
	};

	/**
	 * Handles bank selection and initializes payment form
	 * - Validates bank data
	 * - Creates empty form values based on schema
	 * - Updates order state with new payment method
	 */
	const handleBankSelect = (selectedBank: Bank | SelectOption | undefined) => {
		console.log('Bank selected:', selectedBank);
		if (!selectedBank || !('account_info_schema' in selectedBank)) {
			console.warn('Invalid bank selection:', selectedBank);
			return;
		}

		const bank = selectedBank as Bank;
		const initialValues: AccountFieldValue = {};
		bank.account_info_schema.forEach(field => {
			initialValues[field.id] = '';
		});
		console.log('Created initial values:', initialValues);

		const newPaymentMethod: PaymentMethodForm = {
			bank,
			bank_id: bank.id,
			values: initialValues
		};
		console.log('New payment method created:', newPaymentMethod);

		updatePaymentMethod(newPaymentMethod);
	};

	/**
	 * Fetches available payment methods on component mount
	 * - Filters based on list's accepted banks
	 * - Sets initial payment method if none selected
	 */
	useEffect(() => {
		console.log('OrderPaymentMethod useEffect triggered:', {
			dependencies: {
				address,
				currencyId: currency?.id,
				type,
				banksList: banks
			}
		});

		if (!currency?.id) {
			console.log('No currency ID available, skipping fetch');
			return;
		}

		setLoading(true);
		console.log('Fetching banks from API...');

		fetch(`/api/banks?currency_id=${currency.id}`, {
			headers: {
				Authorization: `Bearer ${getAuthToken()}`
			}
		})
			.then((res) => res.json())
			.then((res) => {
				console.log('Raw API response:', res);
				return res.data;
			})
			.then((data: PaymentMethod[]) => {
				console.log('API Response - Available payment methods:', data);

				const listBankIds = banks ? banks.map((b: any) => b?.id) : [];
				console.log('List bank IDs:', listBankIds);

				const filtered = data.filter((pm) => listBankIds.includes(pm?.bank?.id));
				console.log('Filtered payment methods:', filtered);

				setPaymentMethods(filtered);
				if (!paymentMethod.values) {
					console.log('No existing values, setting first payment method:', filtered[0]);
					setPaymentMethod(filtered[0]);
				} else {
					console.log('Existing values found:', paymentMethod.values);
					setPaymentMethod(undefined);
				}
			})
			.catch(error => {
				console.error('Payment method fetch error:', error);
			})
			.finally(() => {
				console.log('Fetch complete, setting loading to false');
				setLoading(false);
			});
	}, [address, currency, type]);

	console.log('Pre-render state:', {
		isLoading,
		paymentMethods,
		currentBank: bank,
		currentValues: values,
		errors
	});

	if (isLoading) {
		console.log('Rendering loading state');
		return <Loading />;
	}

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
					{!id || edit ? (
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
										onChange={(value) => updatePaymentMethod({
											...paymentMethod,
											bank: paymentMethod.bank,
											bank_id: paymentMethod.bank?.id,
											values: {
												...paymentMethod.values,
												[schemaId]: value
											}
										} as PaymentMethodForm)}
										error={errors[schemaId]}
										value={values[schemaId]}
										required={required}
									/>
								))}
							</div>
						</div>
					) : (
						<div>
							<Button title="Add New Payment Method +" outlined onClick={() => updatePaymentMethod(undefined)} />
						</div>
					)}
				</>
			)}
		</div>
	);
};

export default OrderPaymentMethod;
