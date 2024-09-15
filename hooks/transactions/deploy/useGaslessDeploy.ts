import { sign } from './../../../node_modules/tweetnacl/nacl.d';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { useState } from 'react';
import { useDynamicContext, useSmartWallets } from '@dynamic-labs/sdk-react-core';
import useShyft from '../useShyft';
import useLocalSolana from '../useLocalSolana';
import { signTransaction } from 'viem/accounts';

interface UseGaslessDeployProps {
    contract: string;
}

interface Data {
    hash?: string;
}

const useGaslessDeploy = () => {
    const [data, updateData] = useState<Data>({});
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { primaryWallet } = useDynamicContext();
    const {sendTransactionWithShyft} = useShyft(); 
    const {initialiseSolanaAccount} = useLocalSolana();

    const deploy = async () => {
        if (!primaryWallet?.isConnected) return;

        setIsLoading(true);
        console.log("starting deploy");

        try {
            const transaction = await initialiseSolanaAccount(primaryWallet?.address);
            const result = await sendTransactionWithShyft(transaction)
            console.log(`Shyft Transaction result: ${result}`);
			setIsSuccess(true);
        } catch (error) {
            console.error('Deployment failed', error);
            setIsSuccess(false);
        } finally {
            setIsLoading(false);
        }
    };

    return { isFetching: false, gaslessEnabled: true, isLoading, isSuccess, data, deploy };
};

export default useGaslessDeploy;