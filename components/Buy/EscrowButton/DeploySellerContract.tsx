import useGaslessDeploy from '@/hooks/transactions/deploy/useGaslessDeploy';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { Button } from 'components';
import TransactionLink from 'components/TransactionLink';
import {  useAccount } from 'hooks';
import useDeploy from 'hooks/transactions/deploy/useDeploy';
import React, { useEffect } from 'react';
import { toast } from 'react-toastify';

const DeploySellerContract = ({ label = 'Create Escrow Contract' }: { label?: string }) => {
	const { primaryWallet } = useDynamicContext();
	

	const { isFetching, isLoading, isSuccess, data, deploy } = useGaslessDeploy();

	// useTransactionFeedback({
	// 	hash: data?.hash,
	// 	isSuccess,
	// 	Link: <TransactionLink hash={data?.hash} />,
	// 	description: 'Deployed the seller contract'
	// });


	const deploySellerContract = async () => {
		
		if (!primaryWallet?.isConnected) return;
		console.log('Deploy');
		await deploy?.();
		
		
		
	};
	useEffect(()	=>{
		if(data){
			toast.success(`Deployed Contract successfully ${data}`);
		}
	},[isSuccess,data])

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
