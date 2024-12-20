import React, { useCallback } from 'react';

interface FloatingRateWidgetProps {
    value: number;
    onChange: (newVal: number) => void;
    error?: string;
    step?: number;
    decimals?: number;
    suffix?: string;
}

const FloatingRateWidget: React.FC<FloatingRateWidgetProps> = ({
    value,
    onChange,
    error,
    step = 1,
    decimals = 0,
    suffix
}) => {
    const roundToDecimals = useCallback((val: number) => {
        return Number(val.toFixed(decimals));
    }, [decimals]);

    const clampValue = useCallback((val: number) => {
        let newVal = val;
        // Allow negative numbers but clamp between -99 and 99
        if (newVal < -99) newVal = -99;
        if (newVal > 99) newVal = 99;
        return roundToDecimals(newVal);
    }, [roundToDecimals]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;
        // Allow negative sign input
        if (val === '-') {
            return; // Let user continue typing after minus sign
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
        <div className="flex flex-row items-center bg-gray-100 my-8 p-4 border-2 border-slate-200 rounded-md">
            <div className="w-full flex justify-center">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => adjustValue('decrement')}
                        className="px-2 py-1 rounded"
                        title="Reduce Margin"
                    >
                        <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6">
                            <path d="M1 10L1 6L15 6V10L1 10Z" fill="#fb122f"/>
                        </svg>
                    </button>

                    <div className="w-48">
                        <input
                            type="number"
                            className="w-full bg-white text-center rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm tracking-wider"
                            step={step}
                            value={Math.round(value)}
                            onChange={handleInputChange}
                            min={-99}
                            max={99}
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => adjustValue('increment')}
                        className="px-2 py-1 rounded"
                        title="Increase Margin"
                    >
                        <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6">
                            <path d="M10 1H6V6L1 6V10H6V15H10V10H15V6L10 6V1Z" fill="#57E964"/>
                        </svg>
                    </button>

                    {suffix && <span className="font-black">{suffix}</span>}
                </div>
            </div>

            {error && (
                <span className="text-sm text-red-500 mt-1">
                    {error}
                </span>
            )}
        </div>
    );
};

export default FloatingRateWidget; 