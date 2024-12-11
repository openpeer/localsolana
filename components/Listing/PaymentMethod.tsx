import { Button, Loading } from 'components';
import { useAccount, useUserProfile } from 'hooks';
import { Bank, PaymentMethod as PaymentMethodType } from 'models/types';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';

import { PencilSquareIcon } from '@heroicons/react/20/solid';

import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { ListStepProps, UIPaymentMethod } from './Listing.types';
import StepLayout from './StepLayout';
import PaymentMethodForm from './PaymentMethodForm';
import { minkeApi } from '@/pages/api/utils/utils';

type BankPaymentMethod = {
	bank_id: string;
	values: Record<string, string>;
};

type DirectPaymentMethod = {
	payment_method_id: string;
	values: Record<string, string>;
};

const PaymentMethod = ({ list, updateList }: ListStepProps) => {
	const { user } = useUserProfile({});
	const { address } = useAccount();

	const { currency, paymentMethods = [], type, banks = [] } = list;
	
	const [paymentMethodCreation, setPaymentMethodCreation] = useState<UIPaymentMethod | null>(null);

	const [apiPaymentMethods, setApiPaymentMethods] = useState<PaymentMethodType[]>([]);
	const [newPaymentMethods, setNewPaymentMethods] = useState<UIPaymentMethod[]>([]);
	const [isLoading, setLoading] = useState(false);

	const existing = (apiPaymentMethods || []).map((apiPaymentMethod) => {
		const updated = paymentMethods.find((m) => m.id === apiPaymentMethod.id);
		return updated || apiPaymentMethod;
	});
	
	const listPaymentMethods = [...existing, ...newPaymentMethods];

	useEffect(() => {
		if (isLoading || !user?.id) return;
		
		setLoading(true);
		if (type === 'BuyList') {
			if (list.id && list.paymentMethods?.length) {
				const savedPaymentMethods: UIPaymentMethod[] = list.paymentMethods.map(pm => ({
					id: Number(pm.id),
					bank: pm.bank,
					values: pm.values || {}
				}));
				
				setNewPaymentMethods(savedPaymentMethods);
				updateList({
					...list,
					banks: savedPaymentMethods.map(pm => pm.bank).filter((bank): bank is Bank => bank !== undefined),
					paymentMethods: savedPaymentMethods
				});
				setPaymentMethodCreation(null);
			} else if (!list.id && paymentMethods.length > 0) {
				setNewPaymentMethods(paymentMethods);
				setPaymentMethodCreation(null);
			} else {
				addNewPaymentMethod();
			}
			setApiPaymentMethods([]);
		} else {
			// For SellList
			minkeApi.get(`/api/getPaymentMethods/${user.id}`, {
				headers: {
					Authorization: `Bearer ${getAuthToken()}`,
					"Content-Type": "application/json",
				}
			})
				.then(response => {
					console.log('API Response:', response);
					
					const paymentMethodsData = Array.isArray(response.data) ? response.data : 
											 Array.isArray(response.data?.data) ? response.data.data : 
											 [];
					
					setApiPaymentMethods(paymentMethodsData);
					if (paymentMethods.length === 0) {
						updatePaymentMethods(paymentMethodsData);
					}
					
					const newPms = paymentMethods.filter(pm => 
						!paymentMethodsData.some((d: PaymentMethodType) => d.id === pm.id)
					);
					setNewPaymentMethods(newPms);
				})
				.catch(error => {
					console.error('Error fetching payment methods:', error);
				})
				.finally(() => setLoading(false));
		}
	}, [list.id, type, user?.id]);

	const onProceed = () => {
		if (type === 'BuyList') {
			const bankList = listPaymentMethods
				.map(pm => pm.bank)
				.filter((bank): bank is Bank => bank !== null && bank !== undefined);

			if (bankList.length > 0) {
				updateList({
					...list,
					step: list.step + 1,
					banks: bankList,
					paymentMethods: bankList.map(bank => ({
						id: Number(new Date().getTime()),
						bank,
						values: {},
					} as UIPaymentMethod))
				});
				return;
			}
		} else {
			if (paymentMethods.length > 0) {
				const formattedPaymentMethods = paymentMethods
					.filter(pm => pm.bank)
					.map(pm => ({
						bank_id: String(pm.bank?.id),
						values: pm.values || {}
					} as BankPaymentMethod));

				updateList({
					...list,
					step: list.step + 1,
					paymentMethods: formattedPaymentMethods,
					limitMin: list.limitMin === undefined ? null : list.limitMin,
					limitMax: list.limitMax === undefined ? null : list.limitMax
				});
			}
		}
	};

	const updatePaymentMethods = (pms: UIPaymentMethod[]) => {
		setPaymentMethodCreation(null);
		
		if (type === 'BuyList') {
			const bankBasedPayments: UIPaymentMethod[] = pms.map(pm => ({
				id: pm.id,
				bank: pm.bank,
				values: pm.values || {}
			}));
			
			updateList({
				...list,
				banks: pms.map(pm => pm.bank).filter((bank): bank is Bank => bank !== undefined),
				paymentMethods: bankBasedPayments
			});
		} else {
			const paymentMethodBasedPayments: UIPaymentMethod[] = pms.map(pm => ({
				id: pm.id,
				bank: pm.bank,
				values: pm.values || {}
			}));
			
			updateList({
				...list,
				paymentMethods: paymentMethodBasedPayments
			});
		}
	};

	const togglePaymentMethod = (pm: PaymentMethodType | UIPaymentMethod) => {
		const uiPaymentMethod: UIPaymentMethod = {
			id: pm.id,
			bank: pm.bank,
			values: Object.entries(pm.values || {}).reduce((acc, [key, value]) => ({
				...acc,
				[key]: String(value)
			}), {})
		};

		const index = paymentMethods.findIndex((m) => m.id === uiPaymentMethod.id);
		if (index >= 0) {
			updatePaymentMethods([...paymentMethods.slice(0, index), ...paymentMethods.slice(index + 1)]);
		} else {
			updatePaymentMethods([...paymentMethods, uiPaymentMethod]);
		}
	};

	const enableEdit = (e: React.MouseEvent, pm: PaymentMethodType | UIPaymentMethod) => {
		e.stopPropagation();
		const uiPaymentMethod: UIPaymentMethod = {
			id: pm.id,
			bank: pm.bank,
			values: Object.entries(pm.values || {}).reduce((acc, [key, value]) => ({
				...acc,
				[key]: String(value)
			}), {})
		};
		setPaymentMethodCreation(uiPaymentMethod);
	};

	const savePaymentMethodCreation = () => {
		if (!paymentMethodCreation) return;

		const newPaymentMethod: UIPaymentMethod = {
			...paymentMethodCreation,
			id: paymentMethodCreation.id || Number(new Date().getTime()),
			bank: paymentMethodCreation.bank,
			values: paymentMethodCreation.values || {}
		};

		if (paymentMethodCreation.id) {
			const updatedPaymentMethods = paymentMethods.map(pm => 
				pm.id === paymentMethodCreation.id ? newPaymentMethod : pm
			);
			updatePaymentMethods(updatedPaymentMethods);
			
			const newIndex = newPaymentMethods.findIndex(pm => pm.id === paymentMethodCreation.id);
			if (newIndex >= 0) {
				setNewPaymentMethods([
					...newPaymentMethods.slice(0, newIndex),
					newPaymentMethod,
					...newPaymentMethods.slice(newIndex + 1)
				]);
			}
		} else {
			const updatedPaymentMethods = [...paymentMethods, newPaymentMethod];
			updatePaymentMethods(updatedPaymentMethods);
			setNewPaymentMethods([...newPaymentMethods, newPaymentMethod]);
		}
		
		setPaymentMethodCreation(null);
	};

	const addNewPaymentMethod = () => {
		setPaymentMethodCreation({
			id: undefined,
			bank: {
				id: 0,
				name: '',
				icon: '',
				color: '#000000',
				account_info_schema: []
			} as Bank,
			values: {},
		});
	};

	const canProceed = paymentMethods.length > 0;

	if (isLoading) {
		return <Loading />;
	}

	return (
		<StepLayout onProceed={canProceed ? onProceed : undefined}>
			<h2 className="text-xl mt-8 mb-2">Payment Methods</h2>
			<p>{type === 'SellList' ? 'Choose how you want to pay' : 'Choose how you want to receive your money'}</p>
			{listPaymentMethods.map(
				(pm) =>
					pm.bank && (
						<div
							key={`payment-method-${pm.id}`}
							className={`${
								paymentMethods.findIndex((m) => m.id === pm.id) >= 0
									? 'border-2 border-purple-900'
									: 'border-2 border-slate-200'
							} w-full flex flex-col bg-gray-100 mt-8 py-4 p-8 rounded-md cursor-pointer`}
							onClick={() => togglePaymentMethod(pm)}
						>
							<div
								className={`w-full flex flex-row justify-between ${type === 'SellList' ? 'mb-4' : ''}`}
							>
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
							{Object.keys(pm.values || {}).length > 0 && (
								<div className="mb-4">
									{Object.keys(pm.values || {}).map((key) => {
										const { account_info_schema: schemaInfo } = pm.bank as Bank;
										const field = schemaInfo.find((f) => f.id === key);
										const value = (pm.values || {})[key];
										if (!value) return null;

										return (
											<div className="mb-2" key={key}>
												<span>
													{field?.label}: {value}
												</span>
											</div>
										);
									})}
								</div>
							)}
						</div>
					)
			)}
			{paymentMethodCreation ? (
				<PaymentMethodForm
					currencyId={currency!.id || 0}
					type={type}
					paymentMethod={paymentMethodCreation}
					updatePaymentMethod={(pm) => setPaymentMethodCreation(pm)}
					onFinish={savePaymentMethodCreation}
					bankIds={listPaymentMethods.map(pm => pm.bank?.id).filter((id): id is number => id !== undefined)}
				/>
			) : (
				<div className="mt-4">
					<Button title="Add New Payment Method +" outlined onClick={addNewPaymentMethod} />
				</div>
			)}
		</StepLayout>
	);
};

export default PaymentMethod;
