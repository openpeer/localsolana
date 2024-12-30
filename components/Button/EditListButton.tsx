import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { List } from 'models/types';
import Select from 'components/Select/Select';
import { Option } from 'components/Select/Select.types';
import { getStatusStringList } from '@/utils';

const EditListButtons = ({ list }: { list: List }) => {
	const { id, status } = list;
	const router = useRouter();
	const [option, setOption] = useState<Option>();

	const newStatus = getStatusStringList(Number(status)) === 'created' ? 1 : 0;

	const toggleListStatus = async () => {
		try {
			console.log('Current status:', status);
			console.log('getStatusStringList(Number(status)):', getStatusStringList(Number(status)));
			console.log('New status value:', newStatus);
			
			const response = await fetch(`/api/list_management/${id}`, {
				method: 'PATCH',
				body: JSON.stringify({ status: newStatus }),
				headers: {
					Authorization: `Bearer ${getAuthToken()}`,
					"Content-Type": "application/json",
				}
			});

			const data = await response.json();
			console.log('API response:', data);

			router.reload();
		} catch (error) {
			console.error('Error updating list status:', error);
		}
	};

	const deleteList = async () => {
		try {
			await fetch(`/api/list_management/${id}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${getAuthToken()}`
				}
			});
			router.reload();
		} catch (error) {
			console.error('Error deleting list:', error);
		}
	};

	const options = [
		{ id: 1, name: 'Edit Ad' },
		{ id: 2, name: 'Deposit/Withdraw Funds' },
		{ id: 3, name: getStatusStringList(Number(status)) === 'created' ? 'Show Ad' : 'Hide Ad' },
		{ id: 4, name: 'Delete Ad' }
	];

	const updateOption = (o: Option | undefined) => {
		setOption(o);
		if (!o) return;

		if (o.id === 1) {
			router.push(`/ads/${encodeURIComponent(id)}/edit`);
		} else if (o.id === 2) {
			router.push('/escrows');
		} else if (o.id === 3) {
			toggleListStatus();
		} else {
			deleteList();
		}
	};

	return (
		<div className="w-full flex flex-row px-4 md:px-0 items-center space-x-2 lg:justify-center">
			<Select extraStyle="w-full" label="" options={options} selected={option} onSelect={updateOption} />
		</div>
	);
};

export default EditListButtons;
