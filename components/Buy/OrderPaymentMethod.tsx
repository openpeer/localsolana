/* eslint-disable react/jsx-curly-newline */
import { BankSelect, Button, Input, Loading, Textarea } from 'components';
import { UIPaymentMethod } from 'components/Listing/Listing.types';
import StepLayout from 'components/Listing/StepLayout';
import { useConfirmationSignMessage, useFormErrors, useAccount } from 'hooks';
import { Errors, Resolver } from 'models/errors';
import { Bank, PaymentMethod as PaymentMethodType } from 'models/types';
import Image from 'next/image';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import snakecaseKeys from 'snakecase-keys';

import { PencilSquareIcon } from '@heroicons/react/20/solid';

import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { truncate } from 'utils';
import { BuyStepProps } from './Buy.types';

const OrderPaymentMethod = ({ order, updateOrder }: BuyStepProps) => {
	const { address } = useAccount();
	const { list, paymentMethod = {} as PaymentMethodType } = order;
	//  @ts-ignore-next-line
	const { fiat_currency: currency, type, bank: banks, token } = list;
	
	const { id, bank, values = {} } = paymentMethod;
	const { account_info_schema: schema = [] } = (bank || {}) as Bank;
	const { errors, clearErrors, validate } = useFormErrors();
	const router = useRouter();

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

	const createOrder = async () => {
		const result = await fetch('/api/createOrder/', {
			method: 'POST',
			body: JSON.stringify(
				snakecaseKeys(
					{
						// order: {
							listId: order.list.id,
							fiatAmount: order.fiat_amount,
							tokenAmount: truncate(order.token_amount, token.decimals),
							price: order.price,
							paymentMethod,
							buyer_id:address,
						// }
					},
					{ deep: true }
				)
			),
			headers: {
				Authorization: `Bearer ${getAuthToken()}`,
				'Content-Type':'application/json',
			}
		});
		const { data } = await result.json();
		
		if (data.id) {
			// const result = await fetch(`/api/updateTrade?id=${data.id}`, {
			// 	method: 'POST',
			// 	body: JSON.stringify({"trade_id" : "testing 72346234gy23g4y2v34utf24"}),
			// 	headers: {
			// 		Authorization: `Bearer ${getAuthToken()}`,
			// 		'Content-Type':'application/json',
			// 	}
			// });
			// if(result.status==200) router.push(`/orders/${data.id}`);
			router.push(`/orders/${data.id}`);
		}
	};

	const { signMessage } = useConfirmationSignMessage({
		onSuccess: createOrder
	});

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

	const [paymentMethods, setPaymentMethods] = useState<PaymentMethodType[]>();
	const [isLoading, setLoading] = useState(false);
	const [edit, setEdit] = useState(false);
	const setPaymentMethod = (pm: UIPaymentMethod | undefined) => {
		setEdit(false);
		clearErrors([...schema.map((field) => field.id), ...['bankId']]);
		updateOrder({ ...order, ...{ paymentMethod: pm, bankId: pm?.bank?.id } });
	};

	const updatePaymentMethod = (pm: UIPaymentMethod | undefined) => {
		clearErrors([...schema.map((field) => field.id), ...['bankId']]);
		updateOrder({ ...order, ...{ paymentMethod: pm, bankId: pm?.bank?.id } });
	};

	const enableEdit = (e: React.MouseEvent<HTMLElement>, pm: UIPaymentMethod) => {
		e.stopPropagation();
		updatePaymentMethod(pm);
		setEdit(true);
	};

	useEffect(() => {
		setLoading(true);

		// fetch(`/api/payment-methods?currency_id=${currency!.id}`, {
		fetch(`/api/banks?currency_id=${currency!.id}`, {
			headers: {
				Authorization: `Bearer ${getAuthToken()}`
			}
		})
			.then((res) => res.json())
			.then((res) => res.data)
			.then((data: PaymentMethodType[]) => {
				const listBankIds = banks?banks.map((b: any) => b?.id):[]
				const filtered = data.filter((pm) => listBankIds.includes(pm?.bank?.id));
				setPaymentMethods(filtered);
				if (!paymentMethod.values) {
					setPaymentMethod(filtered[0]);
				} else {
					setPaymentMethod(undefined);
				}
				setLoading(false);
			});
	}, [address, currency, type]);

	if (isLoading) {
		return <Loading />;
	}

	return (
		<StepLayout onProceed={onProceed} buttonText={list.escrow_type === 'instant' ? undefined : 'Sign and Continue'}>
			<h2 className="text-xl mt-8 mb-2">Payment Methods</h2>
			<p>Choose how you want to receive your money</p>
			{(paymentMethods || []).map((pm) => (
				<div
					key={pm.id}
					className={`${
						pm.id === paymentMethod?.id ? 'border-2 border-purple-900' : 'border-2 border-slate-200'
					} w-full flex flex-col bg-gray-100 mt-8 py-4 p-8 rounded-md cursor-pointer`}
					onClick={() => setPaymentMethod(pm)}
				>
					<div className="w-full flex flex-row justify-between mb-4">
						<div className="flex flex-row items-center">
							{!!pm.bank.icon && (
								<Image
									src={pm.bank.icon}
									alt={pm.bank.name}
									className="h-6 w-6 flex-shrink-0 rounded-full mr-1"
									width={24}
									height={24}
									unoptimized
								/>
							)}
							<span>{pm.bank.name}</span>
						</div>
						<div onClick={(e) => enableEdit(e, pm)}>
							<PencilSquareIcon className="h-5 w-" aria-hidden="true" />
						</div>
					</div>
					<div className="mb-4">
						{Object.keys(pm.values || {}).map((key) => {
							const {
								bank: { account_info_schema: schemaInfo }
							} = pm;
							const field = schemaInfo.find((f) => f.id === key);
							const value = (pm.values || {})[key];
							if (!value) return <></>;

							return (
								<div className="mb-2" key={key}>
									<span>
										{field?.label}: {value}
									</span>
								</div>
							);
						})}
					</div>
				</div>
			))}
			{!id || edit ? (
				<div className="mb-2">
					<BankSelect
						currencyId={currency.id}
						options={banks}
						onSelect={(b) => updatePaymentMethod({ ...paymentMethod, bank: b, values: {} })}
						selected={bank}
						error={errors.bankId}
					/>
					<div>
						{schema.map(({ id: schemaId, label, placeholder, type: schemaType = 'text', required }) => {
							if (schemaType === 'message') {
								return (
									<div className="mb-4" key={schemaId}>
										<span className="text-sm">{label}</span>
									</div>
								);
							}

							if (schemaType === 'textarea') {
								return (
									<Textarea
										rows={4}
										key={schemaId}
										label={label}
										id={schemaId}
										placeholder={placeholder}
										onChange={(e) =>
											updatePaymentMethod({
												...paymentMethod,
												...{
													values: {
														...paymentMethod.values,
														...{ [schemaId]: e.target.value }
													}
												}
											})
										}
										value={values[schemaId]}
										error={errors[schemaId]}
									/>
								);
							}
							return (
								<Input
									key={schemaId}
									label={label}
									type="text"
									id={schemaId}
									placeholder={placeholder}
									onChange={(value) =>
										updatePaymentMethod({
											...paymentMethod,
											...{
												values: {
													...paymentMethod.values,
													...{ [schemaId]: value }
												}
											}
										})
									}
									error={errors[schemaId]}
									value={values[schemaId]}
									required={required}
								/>
							);
						})}
					</div>
				</div>
			) : (
				<div>
					<Button title="Add New Payment Method +" outlined onClick={() => updatePaymentMethod(undefined)} />
				</div>
			)}
		</StepLayout>
	);
};

export default OrderPaymentMethod;
