// hooks/useListPrice.ts

import { List } from 'models/types';
import { useState, useEffect } from 'react';

const useListPrice = (list: List | undefined) => {
	const [price, setPrice] = useState<number | undefined>(undefined);
	const [error, setError] = useState<string | undefined>(undefined);

	useEffect(() => {
		if (!list) return;
		
		// Reset error state
		setError(undefined);

		// Handle N/A or invalid price values
		const calculatedPrice = String(list.calculatedPrice);
		if (calculatedPrice === 'N/A') {
			setError('The price is currently being calculated. This may take a few moments. Or we may be unable to source a sufficiently reliable price source for this pair at this time.');
			setPrice(undefined);
			return;
		}

		const numericPrice = Number(calculatedPrice);
		if (isNaN(numericPrice)) {
			setError(`Unable to calculate price at this time. Please try again in a few moments.`);
			setPrice(undefined);
			return;
		}
		
		setPrice(numericPrice);
	}, [list]);

	return { price, error };
};

export default useListPrice;
