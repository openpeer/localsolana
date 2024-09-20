import useGaslessDeploy from '@/hooks/transactions/deploy/useGaslessDeploy';
import useGaslessEscrowAccountDeploy from '@/hooks/transactions/deploy/useGaslessEscrowAccountDeploy';
import useTransactionFeedback from '@/hooks/useTransactionFeedback';
import { Token } from '@/models/types';
import { getAuthToken, useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { Button } from 'components';
import TransactionLink from 'components/TransactionLink';
import {  useAccount, useUserProfile } from 'hooks';
import useDeploy from 'hooks/transactions/deploy/useDeploy';
import React, { useEffect } from 'react';
import { toast } from 'react-toastify';



interface CreateEscrowAccountProps {
    orderId: string,
    buyer:string,
    amount:number,
    time:number,
    token:Token,
    seller:string

}


const CreateEscrowAccount = ({ orderId,
    buyer,
    amount,
    time,
    token,seller}: CreateEscrowAccountProps) => {
	const { primaryWallet } = useDynamicContext();
	const { isFetching, isLoading, isSuccess, data, deploy } = useGaslessEscrowAccountDeploy({
		orderId: orderId,
		seller: seller,
		buyer: buyer,
		amount: amount,
		time: time,
		tokenAddress: token.address,
		tokenDecimal: token.decimals
	});

	useTransactionFeedback({
		hash: data?.hash??'',
		isSuccess,
		Link: <TransactionLink hash={data?.hash} />,
		description: 'Deployed the escrow account'
	});


	const deployEscrowAccount = async () => {
		if (!primaryWallet?.isConnected) return;
		console.log('Deploy');
		await deploy?.();

	};
	useEffect(()=>{
		if(data){
            updateTrade(data.hash??'');
			
		}
	},[ data]);
    const updateTrade = async (tradeId:string) => {
        try {
            const result = await fetch(`/api/updateTrade?id=${orderId}`, {
				method: 'POST',
				body: JSON.stringify({"trade_id" : tradeId}),
				headers: {
					Authorization: `Bearer ${getAuthToken()}`,
					'Content-Type':'application/json',
				}
			});
            console.log('Trade updated successfully:', result.status==200);

        } catch (error) {
            console.error('Error updating trade:', error);
        }
    };
	return (
		<Button
			title={isLoading ? 'Processing...' : isSuccess ? 'Done' : 'Create Escrow Account'}
			onClick={deployEscrowAccount}
			processing={isLoading || isFetching}
			disabled={isSuccess || isFetching || isLoading}
		/>
	);
};

export default CreateEscrowAccount;
