/* eslint-disable react/jsx-curly-newline */
import React, { useEffect, useState } from 'react';
import { Bank, PaymentMethodForm as PaymentMethodFormType, AccountSchema } from 'models/types';
import Input from 'components/Input/Input';
import BankSelect from 'components/Select/BankSelect';
import { UIPaymentMethod } from './Listing.types';
import { Option } from 'components/Select/Select.types';
import Button from 'components/Button/Button';
import Image from 'next/image';

interface PaymentMethodFormProps {
	currencyId: number;
	type: string;
	paymentMethod: PaymentMethodFormType;
	updatePaymentMethod: (pm: PaymentMethodFormType) => void;
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
	const [formValues, setFormValues] = useState<Record<string, string>>(paymentMethod.values || {});
	const [formErrors, setFormErrors] = useState<Record<string, string>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		setFormValues(paymentMethod.values || {});
	}, [paymentMethod]);

	const validateField = (fieldId: string, value: string, required?: boolean): string => {
		if (required && !value.trim()) {
			return 'This field is required';
		}
		return '';
	};

	const validateForm = (): boolean => {
		const errors: Record<string, string> = {};
		
		// Validate bank selection
		if (!paymentMethod.bank) {
			errors.bank = 'Please select a bank';
			setFormErrors(errors);
			return false;
		}

		// Validate required fields
		paymentMethod.bank.account_info_schema.forEach(field => {
			const error = validateField(field.id, formValues[field.id] || '', field.required);
			if (error) {
				errors[field.id] = error;
			}
		});

		setFormErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleBankSelect = (bank: Bank | Option | undefined) => {
		if (!bank || !('account_info_schema' in bank)) {
			setFormErrors({ bank: 'Invalid bank selection' });
			return;
		}

		// Initialize empty values for all schema fields with proper types
		const initialValues = bank.account_info_schema.reduce((acc: Record<string, string>, field: AccountSchema) => ({
			...acc,
			[field.id]: ''
		}), {} as Record<string, string>);

		setFormValues(initialValues);
		setFormErrors({});
		
		updatePaymentMethod({
			...paymentMethod,
			bank: bank as Bank,
			values: initialValues
		});
	};

	const handleInputChange = (fieldId: string, value: string) => {
		const newValues = {
			...formValues,
			[fieldId]: value
		};

		// Clear error when user starts typing
		if (formErrors[fieldId]) {
			setFormErrors(prev => {
				const updated = { ...prev };
				delete updated[fieldId];
				return updated;
			});
		}

		setFormValues(newValues);
		updatePaymentMethod({
			...paymentMethod,
			values: newValues
		});
	};

	const handleSubmit = () => {
		setIsSubmitting(true);
		
		if (validateForm()) {
			onFinish();
		}
		
		setIsSubmitting(false);
	};

	return (
		<div className="mt-8 space-y-6">
			<div className="bg-white p-6 rounded-lg shadow-sm">
				<div className="mb-6">
					<BankSelect
						currencyId={currencyId}
						selected={paymentMethod.bank}
						onSelect={handleBankSelect}
						error={formErrors.bank}
					/>
				</div>
				
				{paymentMethod.bank?.account_info_schema.map((field, index) => (
					<div key={`${field.id}-${index}`} className="mb-4">
						<Input
							id={`${field.id}-${index}`}
							label={field.label}
							value={formValues[field.id] || ''}
							onChange={(value: string) => handleInputChange(field.id, value)}
							type={field.type === 'email' ? 'email' : 'text'}
							required={field.required}
							error={formErrors[field.id]}
						/>
					</div>
				))}
			</div>
			<div className="flex justify-end">
				<Button 
					onClick={handleSubmit}
					title="Save Payment Method"
					disabled={isSubmitting}
					processing={isSubmitting}
				/>
			</div>
		</div>
	);
};

export default PaymentMethodForm;
