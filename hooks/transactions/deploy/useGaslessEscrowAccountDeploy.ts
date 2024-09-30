import { sign } from './../../../node_modules/tweetnacl/nacl.d';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { useState } from 'react';
import { useDynamicContext, useSmartWallets } from '@dynamic-labs/sdk-react-core';
import useShyft from '../useShyft';
import useLocalSolana from '../useLocalSolana';
import { signTransaction } from 'viem/accounts';
import CreateEscrowAccount from '@/components/Buy/EscrowButton/CreateEscrowAccount';

interface UseGaslessEscrowAccountDeployProps {
    orderId: string,
    seller:string,
    buyer:string,
    amount:number,
    time:number,
    tokenAddress:string,
    tokenDecimal:number,
    instantEscrow: boolean

}

interface Data {
    hash?: string;
}

const useGaslessEscrowAccountDeploy = ({ orderId,
    seller,
    buyer,
    amount,
    time,
    tokenAddress,
    tokenDecimal,instantEscrow}: UseGaslessEscrowAccountDeployProps) => {
    const [data, updateData] = useState<Data>();
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { primaryWallet } = useDynamicContext();
    const {sendTransactionWithShyft,getAccountInfo} = useShyft(); 
    const {getEscrowPDA,createEscrowSol,createEscrowToken} = useLocalSolana();

    const deploy = async () => {
        if (!primaryWallet?.isConnected) return;

        setIsLoading(true);

        try {
            const  escrowPDA =  await getEscrowPDA(orderId);
            console.log(escrowPDA?.toBase58());
            const status = await getAccountInfo(escrowPDA?.toBase58()??'');
            if(status == null || status == undefined){
                if(tokenAddress == PublicKey.default.toBase58()){
                    const transaction = await createEscrowSol(orderId,time,amount*10 ** tokenDecimal,buyer,seller,PublicKey.default.toBase58(),instantEscrow);
                    const finalTx = await sendTransactionWithShyft(transaction)
                    console.log(`Status ${status}`);
                    if(finalTx !== undefined){
                        setIsLoading(false);
                        setIsSuccess(true);
                        updateData({hash:escrowPDA?.toBase58()});
                    }else{
                        console.error('error', finalTx);
                        setIsLoading(false);
                        setIsSuccess(false);
                    }
                }else{
                    const transaction = await createEscrowToken(orderId,time,amount*10 ** tokenDecimal,buyer,seller,PublicKey.default.toBase58(),tokenAddress,instantEscrow);
                    if(transaction==null){
                        setIsLoading(false);
                        setIsSuccess(false);
                        return;
                    }
                    const finalTx = await sendTransactionWithShyft(transaction)
                    console.log(`Status ${status}`);
                    if(finalTx !== undefined){
                        setIsLoading(false);
                        setIsSuccess(true);
                        updateData({hash:escrowPDA?.toBase58()});
                    }else{
                        console.error('error', finalTx);
                        setIsLoading(false);
                        setIsSuccess(false);
                    }
                }
            }else{
                setIsLoading(false);
                setIsSuccess(true);
                updateData({hash:escrowPDA?.toBase58()});
            }

        } catch (error) {
            console.error('Deployment failed', error);
            setIsSuccess(false);
        } finally {
            setIsLoading(false);
        }
    };

    return { isFetching: false, gaslessEnabled: true, isLoading, isSuccess, data, deploy };
};

export default useGaslessEscrowAccountDeploy;