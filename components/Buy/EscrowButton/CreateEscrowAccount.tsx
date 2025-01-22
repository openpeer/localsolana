import useGaslessEscrowAccountDeploy from '@/hooks/transactions/deploy/useGaslessEscrowAccountDeploy';
import { Token } from '@/models/types';
import { getAuthToken, useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { Button } from 'components';
import { useEffect } from 'react';
import { toast } from 'react-toastify';

interface CreateEscrowAccountProps {
    orderId: string,
    buyer: string,
    amount: number,
    time: number,
    token: Token,
    seller: string,
    instantEscrow: boolean,
    fromWallet: boolean
}

const CreateEscrowAccount = ({ 
    orderId,
    buyer,
    amount,
    time,
    token,
    seller,
    instantEscrow,
    fromWallet
}: CreateEscrowAccountProps) => {
    const { primaryWallet } = useDynamicContext();
    const { isLoading, isSuccess, data, deploy, error, isFetching } = useGaslessEscrowAccountDeploy({
        orderId: orderId,
        seller: seller,
        buyer: buyer,
        amount: amount,
        time: time,
        tokenAddress: token.address,
        tokenDecimal: token.decimals,
        instantEscrow,
        isLocalSigningRequired: fromWallet,
        fromWallet: fromWallet
    });

    useEffect(() => {
        if (isSuccess && data && instantEscrow) {
            updateTrade();
        }
    }, [data, isSuccess]);

    const updateTrade = async () => {
        try {
            const result = await fetch(`/api/updateOrder?id=${orderId}`, {
                method: 'POST',
                body: JSON.stringify({ status: 1 }),
                headers: {
                    Authorization: `Bearer ${getAuthToken()}`,
                    'Content-Type': 'application/json',
                }
            });
            
            if (!result.ok) {
                throw new Error('Failed to update trade status');
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to update trade status', {
                theme: "dark",
                position: "top-right",
                autoClose: 5000,
            });
        }
    };

    const deployEscrowAccount = async () => {
        if (!primaryWallet?.isConnected) return;
        await deploy?.();
    };

    return (
        <div className="w-full relative">
            <Button
                title={isLoading ? 'Processing...' : isSuccess ? 'Done' : 'Create Escrow Account'}
                onClick={deployEscrowAccount}
                processing={isLoading || isFetching}
                disabled={isSuccess || isFetching || isLoading}
            />
            {error && (
                <div className="absolute inset-x-0 mt-4">
                    <div className="text-red-500 text-sm px-4 py-2 bg-red-100/10 rounded-md border border-red-500/20">
                        {error === 'Transaction simulation failed: {"InstructionError":[0,{"Custom":1}]}' 
                            ? 'Insufficient USDT balance to create escrow. Please ensure you have enough USDT to cover the trade amount.'
                            : error}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateEscrowAccount;
