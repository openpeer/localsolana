import { getAuthToken, useDynamicContext } from '@dynamic-labs/sdk-react-core';
//import { S3 } from 'aws-sdk';
import { PutObjectCommandOutput } from '@aws-sdk/client-s3';
import { Errors } from 'models/errors';
import { User } from 'models/types';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
// import { minkeApi } from '../pages/api/utils/utils';
import { useRouter } from 'next/router';
import { isEqual, debounce, DebouncedFunc } from 'lodash';
import { UserResponse, UserData } from 'models/apiResponse';

// interface ErrorObject {
// 	[fieldName: string]: string[];
// }

const useUserProfile = ({ onUpdateProfile }: { onUpdateProfile?: (user: User) => void }) => {
	const router=useRouter();
	const [user, setUser] = useState<User | null>(null);
	const [username, setUsername] = useState<string>();
	const [isUpdating, setIsUpdating] = useState(false);
	const [isUpdatingDebounced, setIsUpdatingDebounced] = useState(false);
	const [errors, setErrors] = useState<Errors>({});
	const [previousProfile, setPreviousProfile] = useState<Partial<User> | null>(null);

	// const [email, setEmail] = useState<string>();
	// const [twitter, setTwitter] = useState<string>();
	// const [timezone, setTimezone] = useState<string>();
	// const [availableFrom, setAvailableFrom] = useState<number>();
	// const [availableTo, setAvailableTo] = useState<number>();
	// const [weekendOffline, setWeekendOffline] = useState<boolean>();
	const [contractAddress, setContractAddress] = useState<string | null>();

	let primaryWallet;
	try {
		const context = useDynamicContext();
		primaryWallet = context.primaryWallet;
	} catch (error) {
		console.error('Error in useDynamicContext:', error);
	}

	const address  = primaryWallet?.address;

	const telegramBotLinkRef = useRef<string>('');


	const updateUserState = useCallback((data: User) => {
		setUser((prevUser) => {
			if (!isEqual(prevUser, data)) {
				const uniqueIdentifier = data.unique_identifier;
				telegramBotLinkRef.current = `https://telegram.me/localsolanabot?start=${uniqueIdentifier}`;
				// console.log('User updated:', data);
				return data;
			}
			return prevUser;
		});
	}, []);

	const fetchUserProfile = useCallback(async () => {
		if (!address) return;

		try {
			// console.log('Fetching user profile...');
			const res = await fetch(`/api/user_profiles/${address}`, {
				headers: {
					Authorization: `Bearer ${getAuthToken()}`
				}
			});
			if (res.status === 401) {
				console.error('Unauthorized: Invalid or missing auth token');
				setUser(null);
				return;
			}
			const data: UserResponse = await res.json();
			if (!data.data) {
					setUser(null);
			} else {
					// Convert UserData to User
					const userData: User = {
							...data.data,
							id: parseInt(data.data.id, 10), // Convert id to number
					};
					updateUserState(userData);
					setPreviousProfile(userData);
					setContractAddress(userData.contract_address);
					// console.log('User profile fetched:', data);
			}
		} catch (error) {
			console.error('Error fetching user profile:', error);
		}
	}, [address, getAuthToken, updateUserState]);

	useEffect(() => {
		fetchUserProfile();
	}, [fetchUserProfile]);

	const validateProfile = (profile: Partial<User>): Errors => {
		const errors: Errors = {};

		const alphanumericUnderscoreRegex = /^[a-zA-Z0-9_]+$/;

		if (profile.name) {
			if (profile.name.length < 3) {
				errors['name'] = 'Username must be at least 3 characters';
			} else if (profile.name.length > 15) {
				errors['name'] = 'Username must be 15 characters or less';
			} else if (!alphanumericUnderscoreRegex.test(profile.name)) {
				errors['name'] = 'Username must contain only alphanumeric characters and underscores';
			}
		}

		if (profile.twitter) {
			if (profile.twitter.length < 3) {
				errors.twitter = 'Twitter handle must be at least 3 characters';
			} else if (profile.twitter.length > 15) {
				errors.twitter = 'Twitter handle must be 15 characters or less';
			} else if (profile.twitter.includes('@')) {
				errors.twitter = 'Twitter handle should not include the @ symbol';
			} else if (!alphanumericUnderscoreRegex.test(profile.twitter)) {
				errors.twitter = 'Twitter handle must contain only alphanumeric characters and underscores';
			}
		}

		if (profile.email && !/\S+@\S+\.\S+/.test(profile.email)) {
			errors.email = 'Invalid email format';
		}

		if (profile.whatsapp_number && profile.whatsapp_number.length > 17) {
			errors.whatsapp_number = 'WhatsApp number must be 17 digits or less';
		}

		if (profile.whatsapp_country_code && !profile.whatsapp_number) {
			errors.whatsapp_number = 'WhatsApp number is required when country code is provided';
		}

		if (profile.whatsapp_number && !profile.whatsapp_country_code) {
			errors.whatsapp_country_code = 'WhatsApp country code is required when number is provided';
		}

		return errors;
	};

	// useEffect(() => {
	// 	if (user) {
	// 		setUsername(user.name || '');
	// 		setEmail(user.email || '');
	// 		setTwitter(user.twitter || '');
	// 		setTimezone(user.timezone || undefined);
	// 		setAvailableFrom(user.available_from || undefined);
	// 		setAvailableTo(user.available_to || undefined);
	// 		setWeekendOffline(user.weekend_offline);
	// 		setContractAddress(user.contract_address);
	// 	}
	// }, [user]);

	const updateUserProfile = useCallback(
		async (profile: Partial<User>, showNotification = true) => {
			if (!getAuthToken) return; // Ensure authToken is available
			// console.log('Profile data before validation:', profile);
			const validationErrors = validateProfile(profile);
			if (Object.keys(validationErrors).length > 0) {
				setErrors(validationErrors);
				return;
			}

			// console.log('Profile data after validation:', profile);

			if (previousProfile && isEqual(previousProfile, profile)) {
				// console.log('Profile has not changed, skipping update.');
				return;
			}

			try {
				setIsUpdating(true);
				let userProfileData = { ...profile };

				// Only include WhatsApp data if both country code and number are present
				if (profile.whatsapp_country_code || profile.whatsapp_number) {
					if (!profile.whatsapp_country_code || !profile.whatsapp_number) {
						throw new Error('Both WhatsApp country code and number must be provided.');
					}
				}

				// Ensure we're not sending empty objects for nested properties
				Object.keys(userProfileData).forEach((key) => {
					const k = key as keyof Partial<User>;
					if (
						typeof userProfileData[k] === 'object' &&
						userProfileData[k] !== null &&
						Object.keys(userProfileData[k] as object).length === 0
					) {
						delete userProfileData[k];
					}
				});

				// console.log('Sending user profile data to API:', userProfileData);

				const result = await fetch(`/api/user_profiles/${address}`, {
					method: 'PATCH',
					body: JSON.stringify({ user_profile: userProfileData }),
					headers: {
						Authorization: `Bearer ${getAuthToken()}`,
						'Content-Type': 'application/json'
					}
				});

				const responseData: UserResponse = await result.json();

				if (!result.ok) {
					if (result.status === 422) {
						// This is a validation error (e.g., username already taken)
						const errorMessage = responseData.message || 'Validation error occurred';
						setErrors((prevErrors) => ({
							...prevErrors,
							name: errorMessage
						}));
						// Throw an error so that the calling function can catch it
						throw new Error(errorMessage);
					} else {
						// For other types of errors, throw an error to be caught below
						throw new Error(responseData.message || 'An error occurred while updating the profile');
					}
				}

				// Check if responseData contains the updated user data
				if (responseData.data) {
					// Convert UserData to User
					const updatedUser: User = {
						...responseData.data,
						id: parseInt(responseData.data.id, 10), // Convert id to number
					};
					updateUserState(updatedUser);
					setPreviousProfile(updatedUser);
					if (showNotification) {
						onUpdateProfile?.(updatedUser);
					}
					// console.log('User profile updated:', responseData.data);
				} else {
					// console.log('Profile updated successfully, but no data returned. Fetching latest profile.');
					await fetchUserProfile();
				}
			} catch (error) {
				console.error('Error updating profile:', error);
				setErrors((prevErrors) => ({
					...prevErrors,
					general: error instanceof Error ? error.message : 'An unknown error occurred'
				}));
				// throw error;
			} finally {
				setIsUpdating(false);
			}
		},
		[address, getAuthToken, onUpdateProfile, updateUserState, validateProfile, previousProfile, user, fetchUserProfile]
	);

	const debouncedUpdateUserProfile = useCallback(
		debounce((profile: Partial<User>, showNotification = false) => {
			// console.log('debouncedUpdateUserProfile called');
			setIsUpdatingDebounced(true);
			return updateUserProfile(profile, showNotification)
				.then((result) => {
					setIsUpdatingDebounced(false);
					return result;
				})
				.catch((error) => {
					setIsUpdatingDebounced(false);
					throw error;
				});
		}, 2000),
		[updateUserProfile]
	);

	const safeUpdateProfile = useCallback(
		(profile: Partial<User>, showNotification = false) => {
			const validationErrors = validateProfile(profile);
			if (Object.keys(validationErrors).length > 0) {
				setErrors(validationErrors);
				return Promise.resolve();
			}

			return debouncedUpdateUserProfile(profile, showNotification);
		},
		[debouncedUpdateUserProfile, validateProfile]
	) as unknown as DebouncedFunc<typeof updateUserProfile>;

	safeUpdateProfile.cancel = debouncedUpdateUserProfile.cancel;
	safeUpdateProfile.flush = debouncedUpdateUserProfile.flush;

	const deleteTelegramInfo = useCallback(async () => {
		if (!getAuthToken) return;
		await updateUserProfile(
			{
				telegram_user_id: null,
				telegram_username: null
			},
			false
		);
		await fetchUserProfile();
	}, [updateUserProfile, fetchUserProfile, getAuthToken]);

const onUploadFinished = useCallback(
  async (data: PutObjectCommandOutput, imageName: string) => {
    setErrors({});
    const newUser = { ...user, image: imageName, image_url: imageName };
    await updateUserProfile(newUser as User, true);
    router.reload();
  },
  [user, updateUserProfile, setErrors, router]
);

	const refreshUserProfile = useCallback(async () => {
		if (!address || !getAuthToken) return { success: false, error: 'No address or auth token provided' };

		try {
			// console.log('Refreshing user profile...');
			const res = await fetch(`/api/user_profiles/${address}`, {
				headers: {
					Authorization: `Bearer ${getAuthToken}`
				}
			});
			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.message || 'Failed to fetch user profile');
			}
			const data: UserResponse = await res.json();
			// Convert UserData to User
			const userData: User = {
				...data.data,
				id: parseInt(data.data.id, 10), // Convert id to number
			};
			updateUserState(userData);
			setPreviousProfile(userData);
			// console.log('User profile refreshed:', data);
			return { success: true, user: data.data };
		} catch (error) {
			console.error('Error refreshing user profile:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'An error occurred while fetching the user profile'
			};
		}
	}, [address, getAuthToken, updateUserState]);

	const updateContractAddress = (contractAddress: string) => {
		console.log('Updating contract address:', contractAddress);
		setErrors({}); // Clear any existing errors
		const updatedUser = { ...user, contract_address: contractAddress }; // Update contract address in user object
		updateUserProfile(updatedUser as User); // Call updateUserProfile with the updated user
};
	

	return useMemo(
		() => ({
			user,
			isUpdating,
			isUpdatingDebounced,
			onUploadFinished,
			updateProfile: safeUpdateProfile,
			updateUserProfile,
			errors,
			fetchUserProfile,
			deleteTelegramInfo,
			refreshUserProfile,
			telegramBotLink: telegramBotLinkRef.current,
			validateProfile,
			contractAddress,
			setContractAddress,
			updateContractAddress
		}),
		[
			user,
			isUpdating,
			isUpdatingDebounced,
			onUploadFinished,
			safeUpdateProfile,
			updateUserProfile,
			errors,
			fetchUserProfile,
			deleteTelegramInfo,
			refreshUserProfile,
			validateProfile,
			contractAddress,
			setContractAddress,
			updateContractAddress
		]
	);
};

export default useUserProfile;
