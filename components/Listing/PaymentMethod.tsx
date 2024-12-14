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

/**
 * PaymentMethod Component
 * Handles the selection and management of payment methods for both buy and sell listings.
 * 
 * @component
 * @param {Object} props
 * @param {UIList} props.list - Current list data containing payment methods and configuration
 * @param {Function} props.updateList - Callback function to update the list data
 */
const PaymentMethod = ({ list, updateList }: ListStepProps) => {
	const { user } = useUserProfile({});
	const { address } = useAccount();

	const { currency, paymentMethods = [], type, banks = [] } = list;
	
	const [paymentMethodCreation, setPaymentMethodCreation] = useState<UIPaymentMethod | null>(null);
	const [isLoading, setLoading] = useState(false);
	const [isDataReady, setIsDataReady] = useState(false);

	const listPaymentMethods = paymentMethods;

	/**
	 * Initializes and processes payment methods when component mounts or dependencies change
	 * Handles different logic for BuyList vs SellList types
	 */
	useEffect(() => {
		// console.log("List Payment Methods:", listPaymentMethods);
		// console.log("Payment Methods:", paymentMethods);

		if (isLoading || !user?.id) return;
		
		setLoading(true);
		if (type === 'BuyList') {
			if (list.id && list.paymentMethods?.length) {
				const savedPaymentMethods = list.paymentMethods.map(pm => ({
					id: Number(pm.id),
					bank: pm.bank || {
						id: Number(pm.id),
						name: pm.name || '',
						color: pm.color || '',
						account_info_schema: pm.account_info_schema || [],
						image: pm.image,
						imageUrl: pm.imageUrl
					} as Bank,
					values: pm.values || {}
				}));

				const bankList = savedPaymentMethods
					.map(pm => pm.bank)
					.filter((bank): bank is Bank => bank !== null && bank !== undefined);

				updateList({
					...list,
					banks: bankList,
					paymentMethods: savedPaymentMethods
				});
				setPaymentMethodCreation(null);
			} else if (!list.id && paymentMethods.length > 0) {
				setPaymentMethodCreation(null);
			} else {
				addNewPaymentMethod();
			}
		} else if (type === 'SellList') {
			const savedPaymentMethods = list.paymentMethods?.map(pm => ({
				id: Number(pm.id),
				bank: pm.bank,
				values: pm.values || {},
				color: pm.color,
				name: pm.name
			})) || [];
			
			updateList({
				...list,
				paymentMethods: savedPaymentMethods
			});
		}
		setLoading(false);
	}, [list.id, type, user?.id]);

	useEffect(() => {
		if (list.paymentMethods?.length) {
			setIsDataReady(true);
		}
	}, [list.paymentMethods]);

	/**
	 * Handles proceeding to the next step
	 * Validates and processes payment methods before advancing
	 */
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
					paymentMethods: listPaymentMethods
				});
			}
		} else {
			if (paymentMethods.length > 0) {
				updateList({
					...list,
					step: list.step + 1,
					paymentMethods: paymentMethods.map(pm => ({
						id: pm.id,
						bank: pm.bank,
						values: pm.values || {},
						color: pm.color,
						name: pm.name
					})),
					limitMin: list.limitMin === undefined ? null : list.limitMin,
					limitMax: list.limitMax === undefined ? null : list.limitMax
				});
			}
		}
	};

	/**
	 * Updates the payment methods in the list
	 * @param {UIPaymentMethod[]} pms - Array of payment methods to update
	 */
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

	/**
	 * Toggles the selection state of a payment method
	 * @param {PaymentMethodType | UIPaymentMethod} pm - Payment method to toggle
	 */
	const togglePaymentMethod = (pm: PaymentMethodType | UIPaymentMethod) => {
		const uiPaymentMethod: UIPaymentMethod = {
			id: pm.id,
			bank: pm.bank,
			values: Object.entries(pm.values || {}).reduce((acc, [key, value]) => ({
				...acc,
				[key]: String(value)
			}), {}),
			color: 'color' in pm ? pm.color : undefined,
			name: 'name' in pm ? pm.name : undefined
		};

		const index = paymentMethods.findIndex((m) => m.id === uiPaymentMethod.id);
		if (index >= 0) {
			updatePaymentMethods([...paymentMethods.slice(0, index), ...paymentMethods.slice(index + 1)]);
		} else {
			updatePaymentMethods([...paymentMethods, uiPaymentMethod]);
		}
	};

	/**
	 * Enables edit mode for a payment method
	 * Prevents event propagation and prepares the payment method for editing
	 * 
	 * @param {React.MouseEvent} e - Click event
	 * @param {PaymentMethodType | UIPaymentMethod} pm - Payment method to edit
	 */
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

	/**
	 * Saves changes made to a payment method
	 * Handles both new payment methods and updates to existing ones
	 */
	const savePaymentMethodCreation = () => {
		if (!paymentMethodCreation) return;

		const newPaymentMethod: UIPaymentMethod = {
			...paymentMethodCreation,
			id: paymentMethodCreation.id || Number(paymentMethodCreation.bank?.id),
			bank: {
				...paymentMethodCreation.bank!,
				imageUrl: paymentMethodCreation.bank?.icon || paymentMethodCreation.bank?.imageUrl,
			},
			values: paymentMethodCreation.values || {}
		};

		if (paymentMethodCreation.id) {
			const updatedPaymentMethods = paymentMethods.map(pm => 
				pm.id === paymentMethodCreation.id ? newPaymentMethod : pm
			);
			updatePaymentMethods(updatedPaymentMethods);
			
			setPaymentMethodCreation(null);
		} else {
			const updatedPaymentMethods = [...paymentMethods, newPaymentMethod];
			updatePaymentMethods(updatedPaymentMethods);
			setPaymentMethodCreation(null);
		}
	};

	/**
	 * Initializes a new payment method with default values
	 * Sets up the payment method creation form
	 */
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

	// Determine if the proceed button should be enabled
	const canProceed = paymentMethods.length > 0;

	// Debug logging for payment methods
	listPaymentMethods.forEach((pm, index) => {
		console.log(`Payment Method ${index}:`, pm);
	});

	if (isLoading) {
		return <Loading />;
	}

	/**
	 * Renders the payment method interface
	 * Includes:
	 * - List of current payment methods
	 * - Payment method creation/edit form
	 * - Add new payment method button
	 * - Proceed button (if conditions met)
	 */
	return (
		<StepLayout onProceed={paymentMethodCreation ? undefined : (canProceed ? onProceed : undefined)}>
			<h2 className="text-xl mt-8 mb-2">Payment Methods</h2>
			<p>{type === 'SellList' ? 'Choose how you want to pay' : 'Choose how you want to receive your money'}</p>
			{isDataReady && listPaymentMethods.map((pm) => (
				<div
					key={`payment-method-${pm.id}`}
					className={`${
						paymentMethods.findIndex((m) => m.id === pm.id) >= 0
							? 'border-2 border-purple-900'
							: 'border-2 border-slate-200'
					} w-full flex flex-col bg-gray-100 mt-8 py-4 p-8 rounded-md cursor-pointer`}
					onClick={() => togglePaymentMethod(pm)}
				>
					{/* Debug display - positioned off-screen but maintaining data flow */}
					{/* <div className="absolute left-[-9999px]">
						<p><strong>Bank ID:</strong> {pm.bank?.id}</p>
						<p><strong>Name:</strong> {pm.bank?.name}</p>
						<p><strong>Color:</strong> {pm.bank?.color}</p>
						<p><strong>Image:</strong> {pm.bank?.image}</p>
						<p><strong>Image URL:</strong> {pm.bank?.imageUrl}</p>
						<p><strong>Account Schema:</strong> {pm.bank?.account_info_schema?.length} fields</p>
					</div> */}

					<div
						className={`w-full flex flex-row justify-between ${type === 'SellList' ? 'mb-4' : ''}`}
					>
						<div className="flex flex-row items-center">
							{pm.bank?.imageUrl ? (
								<Image
									src={pm.bank.imageUrl}
									alt={pm.bank.name}
									className="h-6 w-6 flex-shrink-0 rounded-full mr-1"
									width={24}
									height={24}
									unoptimized
								/>
							) : (
								<div 
									className="h-6 w-6 flex-shrink-0 rounded-full mr-1"
									style={{ backgroundColor: pm.color }}
								/>
							)}
							<span>{pm.bank?.name || pm.name}</span>
						</div>
						<div onClick={(e) => enableEdit(e, pm)}>
							<PencilSquareIcon className="h-5 w-" aria-hidden="true" />
						</div>
					</div>
					{Object.keys(pm.values || {}).length > 0 && (
						<div className="mb-4">
							{Object.entries(pm.values || {}).map(([key, value]) => {
								const schemaInfo = pm.bank?.account_info_schema || [];
								const field = schemaInfo.find((f) => f.id === key);
								if (!value || !field) return null;

								// return (
								// 	<div className="mb-2" key={key}>
								// 		<span>
								// 			{field.label}: {value}
								// 		</span>
								// 	</div>
								// );
							})}
						</div>
					)}
				</div>
			))}
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
