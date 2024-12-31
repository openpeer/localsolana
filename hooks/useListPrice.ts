import { List } from 'models/types';
import { useState, useEffect } from 'react';

const useListPrice = (list: List | undefined) => {
	const [price, setPrice] = useState<number | undefined>(undefined);

	useEffect(() => {
		if (!list) return;
		
		// Use the pre-calculated price from the API
		setPrice(Number(list.calculatedPrice));
	}, [list]);

	return { price };
};

export default useListPrice;
