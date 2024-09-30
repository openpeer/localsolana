import { getAuthToken, useDynamicContext } from '@dynamic-labs/sdk-react-core';
//import { S3 } from 'aws-sdk';
import { Errors } from 'models/errors';
import { User } from 'models/types';
import { useEffect, useState } from 'react';
import { minkeApi } from '../pages/api/utils/utils';

interface ErrorObject {
	[fieldName: string]: string[];
}

const useUserProfile = ({ onUpdateProfile }: { onUpdateProfile?: (user: User) => void }) => {
	const [user, setUser] = useState<User | null>();
	const [username, setUsername] = useState<string>();
	const [email, setEmail] = useState<string>();
	const [twitter, setTwitter] = useState<string>();
	const [timezone, setTimezone] = useState<string>();
	const [availableFrom, setAvailableFrom] = useState<number>();
	const [availableTo, setAvailableTo] = useState<number>();
	const [weekendOffline, setWeekendOffline] = useState<boolean>();
	const [errors, setErrors] = useState<Errors>({});
	const [contractAddress, setContractAddress] = useState<string | null>();

	let primaryWallet;
	try {
		const context = useDynamicContext();
		primaryWallet = context.primaryWallet;
	} catch (error) {
		console.error('Error in useDynamicContext:', error);
	}

	const address  = primaryWallet?.address;

	const fetchUserProfile = async () => {
		if (!address) return;

		minkeApi.get(`/api/user_profiles/${address}`, {
			headers: {
				Authorization: `Bearer ${getAuthToken()}`
			}
		})
			.then((res) => res.data)
			.then((data) => {
				if (data.errors) {
					setUser(null);
				} else {
					setUser(data.data);
					console.log('Here in fetch Profile',data.data);
					setContractAddress(data.data.contract_address); 
				}
			});
	};

	useEffect(() => {
		fetchUserProfile();
	}, [address]);

	useEffect(() => {
		if (user) {
			setUsername(user.name || '');
			setEmail(user.email || '');
			setTwitter(user.twitter || '');
			setTimezone(user.timezone || undefined);
			setAvailableFrom(user.available_from || undefined);
			setAvailableTo(user.available_to || undefined);
			setWeekendOffline(user.weekend_offline);
			setContractAddress(user.contract_address);
		}
	}, [user]);

	const updateUserProfile = async (profile: User, showNotification = true) => {
		const result = await fetch(`/api/user_profiles/${address}`, {
			method: 'POST',
			body: JSON.stringify(profile),
			headers: {
				Authorization: `Bearer ${getAuthToken()}`,
				'Content-Type': 'application/json',
			}
		});

		const newUser = await result.json();

		if (newUser.data.id) {
			setUser(newUser.data);
			if (!showNotification) return;
			onUpdateProfile?.(newUser.data);
		} else {
			const foundErrors: ErrorObject = newUser.errors;
			Object.entries(foundErrors).map(([fieldName, messages]) => {
				const formattedMessages = messages.map(
					(message) => `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} ${message}`
				);

				setErrors({ ...errors, ...{ [fieldName]: formattedMessages.join(', ') } });
				return formattedMessages;
			});
		}
	};

	// const onUploadFinished = async ({ Key: image }: S3.ManagedUpload.SendData) => {
	// 	updateUserProfile({ ...user, ...{ image } } as User, false);
	// };

	const updateProfile = () => {
		console.log('Here in update profile',user,contractAddress);
		setErrors({});
		const newUser = { ...user, ...{ name: username || null, email: email || null, twitter: twitter || null ,contract_address: contractAddress || null} };
		updateUserProfile(newUser as User);
	};
	const updateContractAddress = (contractAddress: string) => {
		console.log('Here in update profile',user,contractAddress);
		setErrors({});
		const newUser = { ...user, ...{ name: username || null, email: email || null, twitter: twitter || null ,contract_address: contractAddress || null} };
		updateUserProfile(newUser as User);
	};

	return {
		user,
		//onUploadFinished,
		updateProfile,
		errors,
		username,
		setUsername,
		email,
		setEmail,
		twitter,
		setTwitter,
		timezone,
		setTimezone,
		availableFrom,
		setAvailableFrom,
		availableTo,
		setAvailableTo,
		weekendOffline,
		setWeekendOffline,
		updateUserProfile,
		fetchUserProfile,
		contractAddress,
		setContractAddress,
		updateContractAddress
	};
};

export default useUserProfile;
