import { getAuthToken, useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { PutObjectCommandOutput } from '@aws-sdk/client-s3';
import { Errors } from 'models/errors';
import { User } from 'models/types';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { isEqual, debounce, DebouncedFunc } from 'lodash';
import { UserResponse, UserData } from 'models/apiResponse';

const useUserProfile = ({ onUpdateProfile }: { onUpdateProfile?: (user: User) => void }) => {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [username, setUsername] = useState<string>();
    const [isUpdating, setIsUpdating] = useState(false);
    const [isUpdatingDebounced, setIsUpdatingDebounced] = useState(false);
    const [errors, setErrors] = useState<Errors>({});
    const [previousProfile, setPreviousProfile] = useState<Partial<User> | null>(null);
    const [contractAddress, setContractAddress] = useState<string | null>();

    let primaryWallet;
    try {
        const context = useDynamicContext();
        primaryWallet = context.primaryWallet;
    } catch (error) {
        console.error('Error in useDynamicContext:', error);
    }

    const address = primaryWallet?.address;

    const telegramBotLinkRef = useRef<string>('');

    const updateUserState = useCallback((data: User) => {
        setUser((prevUser) => {
            if (!isEqual(prevUser, data)) {
                const uniqueIdentifier = data.unique_identifier;
                telegramBotLinkRef.current = `https://telegram.me/localsolanabot?start=${uniqueIdentifier}`;
                return data;
            }
            return prevUser;
        });
    }, []);

    const fetchUserProfile = useCallback(async () => {
        if (!address) return;

				// delete
				const token = getAuthToken();
        console.log('Auth Token:', token);

        try {
            const res = await axios.get(`/api/user_profiles/${address}`, {
                headers: {
                    Authorization: `Bearer ${getAuthToken()}`
                }
            });
            const data: UserResponse = res.data;
            if (!data.data) {
                setUser(null);
            } else {
                const userData: User = {
                    ...data.data,
                    id: parseInt(data.data.id, 10),
                };
                updateUserState(userData);
                setPreviousProfile(userData);
                setContractAddress(userData.contract_address);
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

    const updateUserProfile = useCallback(
        async (profile: Partial<User>, showNotification = true) => {

						const token = getAuthToken();
        		console.log('Auth Token:', token);

            if (!getAuthToken) return;
            const validationErrors = validateProfile(profile);
            if (Object.keys(validationErrors).length > 0) {
                setErrors(validationErrors);
                return;
            }

            if (previousProfile && isEqual(previousProfile, profile)) {
                return;
            }

            console.log('Updating profile:', profile);

            try {
                setIsUpdating(true);
                let userProfileData = { ...profile };

                if (profile.whatsapp_country_code || profile.whatsapp_number) {
                    if (!profile.whatsapp_country_code || !profile.whatsapp_number) {
                        throw new Error('Both WhatsApp country code and number must be provided.');
                    }
                }

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

								console.log('Sending request to backend:', userProfileData);

                const result = await axios.patch(`/api/user_profiles/${address}`, {
                    user_profile: userProfileData
                }, {
                    headers: {
                        Authorization: `Bearer ${getAuthToken()}`,
                        'Content-Type': 'application/json'
                    }
                });

                console.log('Result:', result);

                const responseData: UserResponse = result.data;
                console.log('Response data:', responseData);

                if (result.status !== 200) {
                    if (result.status === 422) {
                        const errorMessage = responseData.message || 'Validation error occurred';
                        setErrors((prevErrors) => ({
                            ...prevErrors,
                            name: errorMessage
                        }));
                        throw new Error(errorMessage);
                    } else {
                        throw new Error(responseData.message || 'An error occurred while updating the profile');
                    }
                }

                if (responseData.data) {
                    const updatedUser: User = {
                        ...responseData.data,
                        id: parseInt(responseData.data.id, 10),
                    };
                    updateUserState(updatedUser);
                    setPreviousProfile(updatedUser);
                    if (showNotification) {
                        onUpdateProfile?.(updatedUser);
                    }
                } else {
                    await fetchUserProfile();
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                setErrors((prevErrors) => ({
                    ...prevErrors,
                    general: error instanceof Error ? error.message : 'An unknown error occurred'
                }));
            } finally {
                setIsUpdating(false);
            }
        },
        [address, getAuthToken, onUpdateProfile, updateUserState, validateProfile, previousProfile, fetchUserProfile]
    );

    const debouncedUpdateUserProfile = useCallback(
        debounce((profile: Partial<User>, showNotification = false) => {
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
            const res = await axios.get(`/api/user_profiles/${address}`, {
                headers: {
                    Authorization: `Bearer ${getAuthToken()}`
                }
            });
            if (res.status !== 200) {
                const errorData = await res.data;
                throw new Error(errorData.message || 'Failed to fetch user profile');
            }
            const data: UserResponse = res.data;
            const userData: User = {
                ...data.data,
                id: parseInt(data.data.id, 10),
            };
            updateUserState(userData);
            setPreviousProfile(userData);
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
        setErrors({});
        const updatedUser = { ...user, contract_address: contractAddress };
        updateUserProfile(updatedUser as User);
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