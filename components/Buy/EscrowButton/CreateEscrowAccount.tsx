import useGaslessEscrowAccountDeploy from '@/hooks/transactions/deploy/useGaslessEscrowAccountDeploy';
import { Token } from '@/models/types';
import { getAuthToken, useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { Button } from 'components';
import { useEffect } from 'react';



interface CreateEscrowAccountProps {
    orderId: string,
    buyer:string,
    amount:number,
    time:number,
    token:Token,
    seller:string,
	instantEscrow: boolean

}


const CreateEscrowAccount = ({ orderId,
    buyer,
    amount,
    time,
    token,seller,instantEscrow}: CreateEscrowAccountProps) => {
	const { primaryWallet } = useDynamicContext();
	const { isFetching, isLoading, isSuccess, data, deploy } = useGaslessEscrowAccountDeploy({
		orderId: orderId,
		seller: seller,
		buyer: buyer,
		amount: amount,
		time: time,
		tokenAddress: token.address,
		tokenDecimal: token.decimals,
		instantEscrow
	});

	// useTransactionFeedback({
	// 	hash: data?.hash??'',
	// 	isSuccess,
	// 	Link: <TransactionLink hash={data?.hash} />,
	// 	description: 'Deployed the escrow account'
	// });

	useEffect(()=>{
		if(isSuccess && data && instantEscrow){
            updateTrade();
			
		}
	},[ data,isSuccess]);
    const updateTrade = async () => {
		const result = await fetch(`/api/updateOrder/?id=${orderId}`, {
			method: 'POST',
			body: JSON.stringify({status:1}),
			headers: {
				Authorization: `Bearer ${getAuthToken()}`,
				'Content-Type': 'application/json',
			}
		});
    };
	const deployEscrowAccount = async () => {
		if (!primaryWallet?.isConnected) return;
		await deploy?.();

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
