import { PublicKey, Connection, Transaction, SystemProgram } from '@solana/web3.js';
import { useState } from 'react';
import { ErrorBoundary, useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { UseDepositFundsProps } from '../types';
import useLocalSolana from '../useLocalSolana';
import { web3 } from '@coral-xyz/anchor';
import useShyft from '../useShyft';
//import { Shyft } from '@shyft-to/js';

interface Data {
    hash?: string;
}

const useGaslessDepositFunds = ({ contract, token, amount }: UseDepositFundsProps) => {
    const [data, updateData] = useState<Data>({});
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { primaryWallet } = useDynamicContext();
    const {sendTransactionWithShyft,shyft} = useShyft();
    const{depositFundsToLocalSolana} = useLocalSolana();

    if (!primaryWallet?.address) {
        return { isFetching: true, gaslessEnabled: false, isSuccess, isLoading, data };
    }

    const depositFunds = async () => {
        if (!primaryWallet?.address) return;

        setIsLoading(true);

        try {
            if(token.address == PublicKey.default.toBase58()){
            const transaction = new web3.Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: new PublicKey(primaryWallet.address),
                    toPubkey: new PublicKey(contract),
                    lamports: Number(amount),
                })
            );
            if(shyft == null){
                console.error('Deposit failed');
                setIsSuccess(false);
                setIsLoading(false);
                return;
            }else{
                try{
                const finalTx =await sendTransactionWithShyft(transaction);
                if(finalTx !== undefined){
                    setIsLoading(false);
                    setIsSuccess(true);
                    updateData({hash: finalTx} );
                }else{
                    console.error('error', finalTx);
                    setIsLoading(false);
                    setIsSuccess(false);
                }
            }catch(err){
                console.error('error', err);
                    setIsLoading(false);
                    setIsSuccess(false);
            }
            }
        } else{
            const tx = await depositFundsToLocalSolana(amount,new PublicKey(primaryWallet?.address),new PublicKey(contract),new PublicKey(token.address))
            if(tx===undefined || shyft == null){
                console.error('Deposit failed,',tx,shyft);
                setIsSuccess(false);
                setIsLoading(false);
                return;
            }else{
                if(tx == null){
                    console.error('error', tx);
                    setIsLoading(false);
                    setIsSuccess(false);
                    return;
                }
                const finalTx =await sendTransactionWithShyft(tx);
                if(finalTx !== undefined){
                    setIsLoading(false);
                    setIsSuccess(true);
                    updateData({hash: finalTx||''} );
                }else{
                    console.error('error', finalTx);
                    setIsLoading(false);
                    setIsSuccess(false);
                }
            }
        }
        } catch (error) {
            console.error('Deposit failed', error);
            setIsSuccess(false);
        } finally {
            setIsLoading(false);
        }
    };

    return { isFetching: false, gaslessEnabled: true, isLoading, isSuccess, data, depositFunds };
};

export default useGaslessDepositFunds;