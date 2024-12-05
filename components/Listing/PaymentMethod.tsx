import { Button, Loading } from 'components';
import { useAccount } from 'hooks';
import { Bank, PaymentMethod as PaymentMethodType } from 'models/types';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';

import { PencilSquareIcon } from '@heroicons/react/20/solid';

import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { ListStepProps, UIPaymentMethod } from './Listing.types';
import StepLayout from './StepLayout';
import PaymentMethodForm from './PaymentMethodForm';
import { minkeApi } from '@/pages/api/utils/utils';

const PaymentMethod = ({ list, updateList }: ListStepProps) => {
	const { address } = useAccount();

	const { currency, paymentMethods = [], type, banks = [] } = list;
	
	const [paymentMethodCreation, setPaymentMethodCreation] = useState<UIPaymentMethod>();	

	const [apiPaymentMethods, setApiPaymentMethods] = useState<PaymentMethodType[]>([]);
	const [newPaymentMethods, setNewPaymentMethods] = useState<UIPaymentMethod[]>([]);
	const [isLoading, setLoading] = useState(false);

	const existing = (apiPaymentMethods || []).map((apiPaymentMethod) => {
		const updated = paymentMethods.find((m) => m.id === apiPaymentMethod.id);
		return updated || apiPaymentMethod;
	});
	
	const listPaymentMethods = [...existing, ...newPaymentMethods];

	const onProceed = () => {
		if (paymentMethods.length > 0) {
			const filteredPaymentMethods = paymentMethods.map((pm) => {
				const bankId = pm.bank?.id;
				if (pm.id && newPaymentMethods?.find((npm) => npm.id === pm.id)) {
					return { ...pm, id: undefined, bank_id: bankId };
				}
				return { ...pm, bank_id: bankId };
			});

			if (type === 'SellList') {
				updateList({ ...list, ...{ step: list.step + 1, paymentMethods: filteredPaymentMethods } });
			} else {
				const bankList = listPaymentMethods
					.map(pm => {
						if (!pm.bank) return null;
						
						const isBank = (bank: any): bank is Bank => 
							'color' in bank && 'account_info_schema' in bank;
						
						const bank = pm.bank;
						if (isBank(bank)) {
							return {
								id: bank.id,
								name: bank.name,
								icon: bank.icon,
								color: bank.color,
								account_info_schema: bank.account_info_schema
							} as Bank;
						} else {
							return {
								id: bank.id,
								name: bank.name,
								icon: bank.icon,
								color: 'gray',
								account_info_schema: []
							} as Bank;
						}
					})
					.filter((bank): bank is Bank => bank !== null);

				updateList({
					...list,
					...{ 
						step: list.step + 1, 
						banks: bankList
					}
				});
			}
		}
	};

	const updatePaymentMethods = (pms: UIPaymentMethod[]) => {
		setPaymentMethodCreation(undefined);
		updateList({ ...list, paymentMethods: pms });
	};

	const togglePaymentMethod = (pm: UIPaymentMethod) => {
		const index = paymentMethods.findIndex((m) => m === pm);
		if (index >= 0) {
			updatePaymentMethods([...paymentMethods.slice(0, index), ...paymentMethods.slice(index + 1)]);
		} else {
			updatePaymentMethods([...paymentMethods, pm]);
		}
	};

	const enableEdit = (e: React.MouseEvent<HTMLElement>, pm: UIPaymentMethod) => {
		e.stopPropagation();
		setPaymentMethodCreation(pm);
	};

	const savePaymentMethodCreation = () => {
		if (paymentMethodCreation) {
			if (paymentMethodCreation.id) {
				const index = paymentMethods.findIndex((pm) => pm.id === paymentMethodCreation.id);
				if (index >= 0) {
					updatePaymentMethods([
						...paymentMethods.slice(0, index),
						paymentMethodCreation,
						...paymentMethods.slice(index + 1)
					]);
				}

				const newPaymentMethodIndex = newPaymentMethods.findIndex((pm) => pm.id === paymentMethodCreation.id);
				if (newPaymentMethodIndex >= 0) {
					setNewPaymentMethods([
						...newPaymentMethods.slice(0, newPaymentMethodIndex),
						paymentMethodCreation,
						...newPaymentMethods.slice(newPaymentMethodIndex + 1)
					]);
				}
			} else {
				const newPaymentMethod = { ...paymentMethodCreation, ...{ id: new Date().getTime() } };
				setNewPaymentMethods([...(newPaymentMethods || []), newPaymentMethod]);
				updatePaymentMethods([...paymentMethods, newPaymentMethod]);
			}
		}
		
	};

	useEffect(() => {
		setLoading(true);
		if (type === 'BuyList') {
			if (!list.id) {
				if (paymentMethods.length > 0) {
					setNewPaymentMethods(paymentMethods);
				} else {
					addNewPaymentMethod();
				}
			} else {
				const savedPaymentMethods = list.banks?.map((bank) => ({
					bank,
					id: new Date().getTime() + (bank.id || 0),
					values: {}
				})) || [];
				
				if (savedPaymentMethods.length) {
					updatePaymentMethods(savedPaymentMethods);
					setNewPaymentMethods(savedPaymentMethods);
				}
			}

			setApiPaymentMethods([]);
			setLoading(false);
			return;
		}

		if (currency?.id) {
			minkeApi.get(`/api/banks?currency_id=${currency.id}`, {
				headers: {
					Authorization: `Bearer ${getAuthToken()}`
				}
			})
				.then((res) => res.data.data)
				.then((data) => {    
					setApiPaymentMethods(data || []);
					setNewPaymentMethods(paymentMethods.filter((pm) => 
						!data?.find((d: UIPaymentMethod) => d.id === pm.id)
					));
					setLoading(false);
				})
				.catch(() => {
					setLoading(false);
				});
		}
	}, [address, currency, type, list.id, list.banks]);

	const addNewPaymentMethod = () => {
		setPaymentMethodCreation({} as UIPaymentMethod);
	};

	if (isLoading) {
		return <Loading />;
	}

	return (
		<StepLayout
			onProceed={paymentMethodCreation === undefined && paymentMethods.filter((pm) => pm.bank?.id).map((pm) => pm.bank!.id).length > 0 ? onProceed : undefined}
		>
			<h2 className="text-xl mt-8 mb-2">Payment Methods</h2>
			<p>{type === 'SellList' ? 'Choose how you want to pay' : 'Choose how you want to receive your money'}</p>
			{listPaymentMethods.map(
				(pm) =>
					pm.bank && (
						<div
							key={pm.id}
							className={`${
								paymentMethods.findIndex((m) => m === pm) >= 0
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
							)}
						</div>
					)
			)}
			{paymentMethodCreation !== undefined ? (
				<PaymentMethodForm
					currencyId={currency!.id}
					paymentMethod={paymentMethodCreation}
					updatePaymentMethod={setPaymentMethodCreation}
					onFinish={savePaymentMethodCreation}
					type={type}
					bankIds={[
						...paymentMethods.filter((pm) => pm.bank?.id).map((pm) => pm.bank!.id),
						...newPaymentMethods.filter((pm) => pm.bank?.id).map((pm) => pm.bank!.id)
					]}
				/>
			) : (
				<div>
					<Button title="Add New Payment Method +" outlined onClick={addNewPaymentMethod} />
				</div>
			)}
		</StepLayout>
	);
};

export default PaymentMethod;
