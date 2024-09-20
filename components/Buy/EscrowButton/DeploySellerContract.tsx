import useGaslessDeploy from '@/hooks/transactions/deploy/useGaslessDeploy';
import useTransactionFeedback from '@/hooks/useTransactionFeedback';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { Button } from 'components';
import TransactionLink from 'components/TransactionLink';
import {  useAccount, useUserProfile } from 'hooks';
import useDeploy from 'hooks/transactions/deploy/useDeploy';
import React, { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

const DeploySellerContract = ({ label = 'Create LocalSolana Account' }: { label?: string }) => {
	const { primaryWallet } = useDynamicContext();
	const {
		user,
		updateProfile,
		contract_address,
		setContractAddress,
		errors,
	  } = useUserProfile({ onUpdateProfile: (updatedUser) => console.log('Profile updated:', updatedUser) });
	

	const { isFetching, isLoading, isSuccess=false, data, deploy } = useGaslessDeploy();

	useTransactionFeedback({
		hash: data??'',
		isSuccess,
		Link: <TransactionLink hash={data} />,
		description: 'Deployed the seller contract'
	});


	const deploySellerContract = async () => {
		if (!primaryWallet?.isConnected) return;
		console.log('Deploy');
		await deploy?.();
	};

	const prevIsSuccessRef = useRef<boolean>(false);
	const hasUpdatedProfileRef = useRef<boolean>(false);

	useEffect(() => {
        if (isSuccess && !prevIsSuccessRef.current) {
            prevIsSuccessRef.current = true;
            toast.success(`Deployed Contract successfully ${data}`);
            setContractAddress(data);
        }
    }, [isSuccess, data, setContractAddress]);

    useEffect(() => {
        if (contract_address && isSuccess && !hasUpdatedProfileRef.current) {
            console.log('Contract is', contract_address);
            updateProfile();
			hasUpdatedProfileRef.current = true;
        }
    }, [contract_address, updateProfile]);
	useEffect(() => {
        if (!isSuccess) {
			prevIsSuccessRef.current = false;
            hasUpdatedProfileRef.current = false;
        }
    }, [isSuccess]);
	return (
		<Button
			title={isLoading ? 'Processing...' : isSuccess ? 'Done' : label}
			onClick={deploySellerContract}
			processing={isLoading || isFetching}
			disabled={isSuccess || isFetching || isLoading}
		/>
	);
};

export default DeploySellerContract;
