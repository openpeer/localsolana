import React, { useEffect, useState } from 'react';

import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { User } from 'models/types';
import { useAccount } from 'hooks';
import { DEFAULT_DEPOSIT_TIME_LIMIT } from 'utils';
import { ListStepProps, UIList } from './Listing.types';
import StepLayout from './StepLayout';
import AccountInfo from './AccountInfo';

interface OptionProps {
	type: string;
	title: string;
	description: string;
	selected: boolean;
	onClick: (type: string) => void;
	groupName: string;
}

const Option = ({ type, title, description, selected, onClick, groupName }: OptionProps) => {
	// console.log('Option Render:', { type, selected });
	
	const handleClick = (e: React.MouseEvent) => {
		// console.log('Option Clicked:', { type, wasSelected: selected });
		e.preventDefault();
		onClick(type);
	};

	return (
		<div
			className={`relative flex items-center p-4 cursor-pointer my-4 border rounded-lg ${
				selected ? ' border-gray-500' : ''
			}`}
			onClick={handleClick}
		>
			<div className="min-w-0 flex-1 text-sm pl-2">
				<label htmlFor={type}>
					<span className="font-bold text-gray-800">{title}</span>
					<p id={type} className="font-medium text-gray-500">
						{description}
					</p>
				</label>
			</div>
			<div className="ml-3 flex h-5 items-center">
				<input
					id={title}
					name={groupName}
					aria-describedby={title}
					type="radio"
					className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
					value={type}
					checked={selected}
					onChange={(e) => {
						console.log('Radio onChange:', { 
							value: e.target.value, 
							checked: e.target.checked,
							type,
							groupName 
						});
						onClick(type);
					}}
				/>
			</div>
		</div>
	);
};

const ListType = ({ updateList, list }: ListStepProps) => {
	// console.log('ListType Props:', {
	// 	listDefined: !!list,
	// 	listType: list?.type,
	// 	listRawValue: list,
	// });

	const [type, setType] = useState<string>(() => {
		// console.log('Setting initial type:', {
		// 	listType: list?.type,
		// 	fallback: 'SellList',
		// 	final: list?.type || 'SellList'
		// });
		return list?.type || 'SellList';
	});
	const [escrowType, setEscrowType] = useState<string>(list.escrowType || 'instant');
	const { address } = useAccount();
	const [user, setUser] = useState<User | null>();
	const escrowSetting = type === 'BuyList' ? 'manual' : (escrowType as UIList['escrowType']);
	
	// console.log('ListType Render:', {
	// 	type,
	// 	escrowType,
	// 	escrowSetting,
	// 	listType: list.type,
	// 	listEscrowType: list.escrowType
	// });

	const onProceed = () => {
		// console.log('onProceed called with:', {
		// 	type,
		// 	escrowType,
		// 	escrowSetting
		// });
		updateList({
			...list,
			...{
				type: type as UIList['type'],
				escrowType: escrowSetting,
				depositTimeLimit: escrowSetting === 'instant' ? 0 : DEFAULT_DEPOSIT_TIME_LIMIT,
				step: list.step + 1
			}
		});
	};

	const handleTypeChange = (newType: string) => {
		// console.log('handleTypeChange:', {
		// 	oldType: type,
		// 	newType,
		// 	currentEscrowType: escrowType,
		// 	event: 'clicked'
		// });
		
		setType(prevType => {
			console.log('Setting type from:', prevType, 'to:', newType);
			return newType;
		});
	};

	const handleEscrowTypeChange = (newEscrowType: string) => {
		// console.log('handleEscrowTypeChange:', {
		// 	oldEscrowType: escrowType,
		// 	newEscrowType,
		// 	currentType: type
		// });
		setEscrowType(newEscrowType);
	};

	useEffect(() => {
		if (type !== list.type || escrowType !== list.escrowType) {
			// console.log('Type/EscrowType useEffect triggered - values changed:', {
			// 	type,
			// 	escrowType,
			// 	escrowSetting,
			// 	previousListType: list.type,
			// 	previousListEscrowType: list.escrowType
			// });
			
			updateList({
				...list,
				...{
					type: type as UIList['type'],
					depositTimeLimit: escrowSetting === 'instant' ? 0 : DEFAULT_DEPOSIT_TIME_LIMIT,
					escrowType: escrowSetting
				}
			});
		}
	}, [type, escrowType]);

	useEffect(() => {
		if (!address) return;
		// const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
		fetch(`/api/user_profiles/${address}`, {
			headers: {
				Authorization: `Bearer ${getAuthToken()}`
			}
		})
		.then((res) => res.json())
		.then((data) => {
			if (data.errors) {
				setUser(null);
			} else {
				setUser(data.data);
				// updateUserState(data.data);
			}
		});
	}, [address]);

	if (!user?.email) {
		return <AccountInfo setUser={setUser} />;
	}

	return (
		<StepLayout onProceed={onProceed}>
			<h2 className="text-lg mt-12 mb-2">Are you buying or selling crypto?</h2>
			<fieldset className="mb-2">
				<Option
					key="sell-option"
					type="SellList"
					title="Selling"
					description="I want to sell crypto that I have in exchange for fiat"
					onClick={handleTypeChange}
					selected={type === 'SellList'}
					groupName="list-type"
				/>
				<Option
					key="buy-option"
					type="BuyList"
					title="Buying"
					description="I want to buy crypto in exchange for fiat that I have"
					onClick={handleTypeChange}
					selected={type === 'BuyList'}
					groupName="list-type"
				/>
			</fieldset>
			{type === 'SellList' && (
				<div>
					<h2 className="text-lg mt-6 mb-2">Choose Sell order type</h2>
					<fieldset className="mb-4">
						<Option
							type="instant"
							title="Instant Escrow (recommended)"
							description="I want to hold funds in LocalSolana and have them escrowed instantly when an order is placed"
							onClick={handleEscrowTypeChange}
							selected={escrowType === 'instant'}
							groupName="escrow-type"
						/>
						<Option
							type="manual"
							title="Manual Escrow"
							description="I want to move funds to LocalSolana and manually escrow when an order is placed. Ideal if you want to hold funds on Binance and only move to LocalSolana when an order is placed"
							onClick={handleEscrowTypeChange}
							selected={escrowType === 'manual'}
							groupName="escrow-type"
						/>
					</fieldset>
				</div>
			)}
		</StepLayout>
	);
};

export default ListType;
