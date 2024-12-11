/* eslint-disable react/jsx-curly-newline */
import React, { useEffect, useState } from 'react';
import { Bank } from 'models/types';
import Input from 'components/Input/Input';
import BankSelect from 'components/Select/BankSelect';
import StepLayout from './StepLayout';
import { UIPaymentMethod } from './Listing.types';
import { Option } from 'components/Select/Select.types';

interface SchemaField {
	id: string;
	label: string;
	type?: string;
	required?: boolean;
}

interface PaymentMethodFormProps {
	currencyId: number;
	type: string;
	paymentMethod: UIPaymentMethod;
	updatePaymentMethod: (pm: UIPaymentMethod) => void;
	onFinish: () => void;
	bankIds?: number[];
}

const PaymentMethodForm = ({
	currencyId,
	type,
	paymentMethod,
	updatePaymentMethod,
	onFinish,
	bankIds = []
}: PaymentMethodFormProps) => {
	// Initialize form values
	const [formValues, setFormValues] = useState<Record<string, string>>(paymentMethod.values || {});

	// Update form values when payment method changes
	useEffect(() => {
		setFormValues(paymentMethod.values || {});
	}, [paymentMethod]);

	const handleBankSelect = (bank: Bank | Option | undefined) => {
		if (!bank || !('account_info_schema' in bank)) return;

		// Initialize empty values for all schema fields
		const initialValues = bank.account_info_schema.reduce((acc, field) => ({
			...acc,
			[field.id]: ''
		}), {});

		updatePaymentMethod({
			...paymentMethod,
			bank: bank as Bank,
			values: initialValues
		});
		setFormValues(initialValues);
	};

	const handleInputChange = (fieldId: string, value: string) => {
		const newValues = {
			...formValues,
			[fieldId]: value
		};
		setFormValues(newValues);
		updatePaymentMethod({
			...paymentMethod,
			values: newValues
		});
	};

	return (
		<StepLayout onProceed={onFinish}>
			<div className="mt-8 space-y-4 bg-white p-6 rounded-lg shadow-sm">
				<BankSelect
					currencyId={currencyId}
					selected={paymentMethod.bank}
					onSelect={handleBankSelect}
					error={undefined}
				/>
				{paymentMethod.bank?.account_info_schema.map((field: SchemaField) => (
					<div key={field.id} className="mt-4">
						<Input
							id={field.id}
							label={field.label}
							value={formValues[field.id] || ''}
							onChange={(value: string) => handleInputChange(field.id, value)}
							type={field.type === 'email' ? 'email' : 'text'}
							required={field.required}
						/>
					</div>
				))}
			</div>
		</StepLayout>
	);
};

export default PaymentMethodForm;
