import React, { useCallback } from 'react';

interface SelectorProps {
	label?: string;
	value: number;
	step?: number;
	decimals?: number;
	minValue?: number;
	maxValue?: number;
	allowNegative?: boolean;
	placeholder?: string;
	onChange: (newVal: number) => void;
	error?: string;
	suffix?: string;
	className?: string;
}

const Selector: React.FC<SelectorProps> = ({
	label,
	value,
	step = 1,
	decimals = 2,
	minValue,
	maxValue,
	allowNegative = false,
	placeholder,
	onChange,
	error,
	suffix,
	className = ''
}) => {
	const roundToDecimals = useCallback((val: number) => {
		return Number(val.toFixed(decimals));
	}, [decimals]);

	const clampValue = useCallback((val: number) => {
		let newVal = val;
		if (!allowNegative && newVal < 0) {
			newVal = 0;
		}
		if (minValue !== undefined && newVal < minValue) {
			newVal = minValue;
		}
		if (maxValue !== undefined && newVal > maxValue) {
			newVal = maxValue;
		}
		return roundToDecimals(newVal);
	}, [allowNegative, minValue, maxValue, roundToDecimals]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		let val = e.target.value;
		if (val === '-' && allowNegative) {
			onChange(-0);
			return;
		}
		if (val === '') {
			onChange(0);
			return;
		}

		const parsed = parseFloat(val);
		if (!isNaN(parsed)) {
			const clamped = clampValue(parsed);
			onChange(clamped);
		}
	};

	const adjustValue = (direction: 'increment' | 'decrement') => {
		const changeAmount = direction === 'increment' ? step : -step;
		const newVal = clampValue(value + changeAmount);
		onChange(newVal);
	};

	return (
		<div className={`w-full flex flex-col mb-4 ${className}`}>
			{label && (
				<label className="text-sm font-medium text-gray-700">
					{label}
				</label>
			)}

			<div className="flex gap-4 w-full text-sm text-gray-600 bg-gray-100 p-6 rounded justify-center">
				<button
					type="button"
					onClick={() => adjustValue('decrement')}
					className="px-2 py-1 border rounded text-2xl text-red-900"
					title="Reduce Margin"
				>
					<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10">
						<path d="M1 10L1 6L15 6V10L1 10Z" fill="#fb122f"/>
					</svg>
				</button>

				<input
					type="number"
					className="border border-gray-300 rounded px-2 py-1 w-1/2 text-center text-xl tracking-wider"
					step={step}
					value={Number.isFinite(value) ? value.toFixed(decimals) : ''}
					onChange={handleInputChange}
					placeholder={placeholder}
				/>

				<button
					type="button"
					onClick={() => adjustValue('increment')}
					className="px-2 py-1 border rounded text-2xl text-green-500"
					title="Increase Margin"
				>
					<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8">
						<path d="M10 1H6V6L1 6V10H6V15H10V10H15V6L10 6V1Z" fill="#57E964"/>
					</svg>
				</button>

				{suffix && <span className="text-gray-700 text-xl font-black self-center">{suffix}</span>}
			</div>

			{error && (
				<span className="text-sm text-red-500">
					{error}
				</span>
			)}
		</div>
	);
};

export default Selector;
