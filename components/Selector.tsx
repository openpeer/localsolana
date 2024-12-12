import React from 'react';
import { NumericFormat, OnValueChange } from 'react-number-format';

import Button from './Button/Button';

interface SelectorProps {
	value: number;
	suffix: string;
	underValue?: string;
	updateValue: (n: number) => void;
	error?: string;
	allowNegative?: boolean;
	changeableAmount?: number;
	decimals?: number;
	minValue?: number;
	maxValue?: number;
	showPlusMinus?: boolean;
	initialSign?: '+' | '-' | ''; 
}

const Selector = ({
	value,
	suffix,
	underValue,
	updateValue,
	error,
	allowNegative = false,
	changeableAmount = 0.01,
	decimals = 2,
	minValue,
	maxValue,
	showPlusMinus = false,
	initialSign = ''
}: SelectorProps) => {
	const changeAmount = (newAmount: number) => {
		if (maxValue !== undefined && newAmount >= maxValue) {
			updateValue(maxValue);
			return;
		}

		if ((!allowNegative && newAmount < 0) || (minValue !== undefined && newAmount <= minValue)) {
			updateValue(minValue || 0);
			return;
		}

		updateValue(newAmount);
	};

	const onValueChange: OnValueChange = ({ floatValue }) => {
		const valueChanged = floatValue || 0;
		changeAmount(valueChanged);
	};

	return (
		<div className="flex flex-row items-center bg-gray-100 my-8 p-4 border-2 border-slate-200 rounded-md">
			<div className="w-full flex justify-center">
				<div className="flex items-center gap-2">
					{showPlusMinus && (
						<select 
							className="bg-transparent border-none outline-none"
							value={initialSign || ''}
							onChange={(e) => {
								if (e.target.value === '') return;
								const isPositive = e.target.value === '+';
								const absValue = Math.abs(value);
								changeAmount(isPositive ? absValue : -absValue);
							}}
						>
							<option value="">Select</option>
							<option value="+">+</option>
							<option value="-">-</option>
						</select>
					)}
					<NumericFormat
						value={Math.abs(value)}
						onValueChange={onValueChange}
						className="bg-white w-24 text-center rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm placeholder:text-slate-400"
						allowedDecimalSeparators={[',', '.']}
						decimalScale={decimals}
						inputMode="decimal"
						allowNegative={allowNegative && !showPlusMinus}
					/>
					<span>{suffix}</span>
				</div>
			</div>
		</div>
	);
};

export default Selector;
