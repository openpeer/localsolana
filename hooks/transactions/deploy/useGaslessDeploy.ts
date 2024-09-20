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
    const [data, updateData] = useState<string>();
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { primaryWallet } = useDynamicContext();
    const {sendTransactionWithShyft,getAccountInfo} = useShyft(); 
    const {initialiseSolanaAccount,getEscrowStatePDA,getEscrowPDA,createEscrowSol} = useLocalSolana();

    const deploy = async () => {
        if (!primaryWallet?.isConnected) return;

        setIsLoading(true);

        try {
            const  escrowStatePDA =  await getEscrowStatePDA(primaryWallet?.address);
            console.log(escrowStatePDA?.toBase58());
            const status = await getAccountInfo(escrowStatePDA?.toBase58()??'');
            if(status == null || status == undefined){
            const transaction = await initialiseSolanaAccount(primaryWallet?.address);
            const result = await sendTransactionWithShyft(transaction)
            console.log(`Shyft Transaction result: ${result}`);
            }

            console.log(`Status ${status}`);
            updateData(escrowStatePDA?.toString());
            setIsLoading(false);
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