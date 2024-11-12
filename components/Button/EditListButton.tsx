import { useRouter } from 'next/router';
import React, { useContext, useState } from 'react';
import { useConfirmationSignMessage, useAccount } from 'hooks';

import { getAuthToken, useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { FiatCurrency, List } from 'models/types';
import snakecaseKeys from 'snakecase-keys';
import Select from 'components/Select/Select';
import { Option } from 'components/Select/Select.types';
import { getStatusStringList } from '@/utils';

const EditListButtons = ({ list }: { list: List }) => {
	
	const { id, status } = list;
	const router = useRouter();
	//const { address } = useDynamicContext();
	
	// following ternary operator will be useful in toggling the show and hide functionality.

	const updateList = { ...list, status: getStatusStringList(Number(status)) === 'created' ? '1' : '0' };
	const toggleMessage = JSON.stringify(snakecaseKeys(updateList, { deep: true }), undefined, 4);
	const [option, setOption] = useState<Option>();

	const { signMessage } = useConfirmationSignMessage({
		onSuccess: async () => {
			await fetch(
				`/api/list_management/${id}`,
				{
					method: 'DELETE',
					headers: {
						Authorization: `Bearer ${getAuthToken()}`
					}
				}
			);
			router.reload();
		}
	});

	const { signMessage: signListStatusChange } = useConfirmationSignMessage({
		onSuccess: async (data, variables) => {
			
			await fetch(
				`/api/list_management/${id}`,

				{
					method: 'PUT',
					body: JSON.stringify(
						snakecaseKeys(
							{
								...updateList,
								escrow_type: updateList.escrow_type==="manual"?0:1,
								priceSource: (updateList.fiat_currency as FiatCurrency)?.default_price_source,
								// data,
								// address,
								message: variables.message
							},
							{ deep: true }
						)
					),
					headers: {
						Authorization: `Bearer ${getAuthToken()}`,
						"Content-Type": "application/json",
					}
				}
			);
			router.reload();
		}
	});

	const options = [
		{ id: 1, name: 'Edit Ad' },
		{ id: 2, name: 'Deposit/Withdraw Funds' },
		{ id: 3, name: getStatusStringList(Number(status)) === 'created' ? 'Show Ad' : 'Hide Ad' },
		{ id: 4, name: 'Delete Ad' }
	];

	const updateOption = (o: Option | undefined) => {
		setOption(o);
		if (!o) {
			return;
		}
		if (o.id === 1) {
			router.push(`/ads/${encodeURIComponent(id)}/edit`);
		} else if (o.id === 2) {
			router.push('/escrows');
		} else if (o.id === 3) {
			signListStatusChange({ message: toggleMessage });
		} else {
			signMessage({ message: `I want to delete the list ${id}` });
		}
	};

	return (
		<div className="w-full flex flex-row px-4 md:px-0 items-center space-x-2 lg:justify-center">
			<Select extraStyle="w-full" label="" options={options} selected={option} onSelect={updateOption} />
		</div>
	);
};

export default EditListButtons;
