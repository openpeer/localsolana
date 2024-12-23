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

/**
 * Represents a bank-based payment method structure
 * Used for handling bank-specific payment details
 */
type BankPaymentMethod = {
	bank_id: string;
	values: Record<string, string>;
};

/**
 * Represents a direct payment method structure
 * Used for handling non-bank payment details
 */
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
	// State management for user context and wallet address
	const { user } = useUserProfile({});
	const { address } = useAccount();

	// Destructure required properties from the list
	const { currency, paymentMethods = [], type, banks = [] } = list;
	
	/**
	 * State Management:
	 * - paymentMethodCreation: Tracks the currently edited/created payment method
	 * - isLoading: Controls loading state during async operations
	 * - isDataReady: Indicates when payment method data is ready to be displayed
	 */
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
				bank: pm.bank || {
					id: Number(pm.id),
					name: pm.name || '',
					color: pm.color || '',
					account_info_schema: pm.account_info_schema || [],
					image: pm.image,
					imageUrl: pm.imageUrl
				} as Bank,
				values: pm.values || {}
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
	 * Updates payment methods based on list type (Buy/Sell)
	 * - For BuyList: Processes bank-based payment methods
	 * - For SellList: Processes direct payment methods
	 * Handles data structure transformation and list updates
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
	 * Toggles selection of a payment method
	 * - Converts payment method to UI format
	 * - Adds or removes from selected payment methods
	 * - Handles both PaymentMethodType and UIPaymentMethod formats
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
	 * Payment Method Creation/Edit Logic:
	 * - savePaymentMethodCreation: Processes and saves new/edited payment methods
	 * - addNewPaymentMethod: Initializes a new payment method with default values
	 * - enableEdit: Prepares existing payment method for editing
	 */

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
				imageUrl: paymentMethodCreation.bank?.icon || 
						 (paymentMethodCreation.bank?.image 
							? `https://bankimg.localsolana.com/${paymentMethodCreation.bank.image}`
							: ''),
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
			const payload = type === 'BuyList' ? {
				bank_id: paymentMethodCreation.bank?.id
			} : {
				bank: {
					id: paymentMethodCreation.bank?.id,
					name: paymentMethodCreation.bank?.name || '',
					color: paymentMethodCreation.bank?.color || '',
					account_info_schema: paymentMethodCreation.bank?.account_info_schema || [],
					imageUrl: paymentMethodCreation.bank?.icon || 
							 (paymentMethodCreation.bank?.image 
								? `https://bankimg.localsolana.com/${paymentMethodCreation.bank.image}`
								: ''),
				},
				values: paymentMethodCreation.values
			};

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
				color: '#000000',
				account_info_schema: [],
				imageUrl: '',
				code: '',
			} as Bank,
			values: {},
		});
	};

	// Determine if the proceed button should be enabled
	const canProceed = paymentMethods.length > 0;

	// Debug logging for payment methods
	// listPaymentMethods.forEach((pm, index) => {
	// 	console.log(`Payment Method ${index}:`, pm);
	// });


	if (isLoading) {
		return <Loading />;
	}

	/**
	 * Render Logic:
	 * 1. Shows loading state when processing
	 * 2. Displays StepLayout wrapper with:
	 *    - Title and description
	 *    - List of existing payment methods (each clickable for selection)
	 *    - Edit/Create form when adding/editing
	 *    - Add new payment method button
	 * 3. Proceed button enabled only when valid payment methods exist
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

					<div
						className={`w-full flex flex-row justify-between ${type === 'SellList' ? 'mb-4' : ''}`}
					>
						<div className="flex flex-row items-center">
							{(pm.bank?.imageUrl || pm.bank?.icon) ? (
								<Image
									src={pm.bank.imageUrl || pm.bank.icon || ''}
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

								return (
									<div className="mb-2" key={key}>
										<span>
											{field.label}: {value}
										</span>
									</div>
								);
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
