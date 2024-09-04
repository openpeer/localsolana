import { PublicKey, Connection, Transaction, SystemProgram } from '@solana/web3.js';
import { useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { UseDepositFundsProps } from '../types';
//import { Shyft } from '@shyft-to/js';

interface Data {
    hash?: string;
}

const useGaslessDepositFunds = ({ contract, token, amount }: UseDepositFundsProps) => {
    const [data, updateData] = useState<Data>({});
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { primaryWallet } = useDynamicContext();
    const connection = new Connection('https://api.mainnet-beta.solana.com'); // Adjust the cluster as needed

    //const shyft = new Shyft({ Key: 'YOUR_SHYFT_API_KEY' }); // Replace with your Shyft API key

    if (!primaryWallet?.address) {
        return { isFetching: true, gaslessEnabled: false, isSuccess, isLoading, data };
    }

    const depositFunds = async () => {
        if (!primaryWallet?.address) return;

        setIsLoading(true);

        try {
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: new PublicKey(primaryWallet.address),
                    toPubkey: new PublicKey(contract),
                    lamports: Number(amount) // Adjust the amount as needed
                })
            );

            //const signedTransaction = await primaryWallet.signTransaction(transaction);
           // const serializedTransaction = signedTransaction.serialize();

            //const response = await shyft.sendTransaction(serializedTransaction);

            // if (response.success) {
            //     setIsSuccess(true);
            //     updateData({ hash: response.txId });
            // } else {
            //     throw new Error(response.error);
            // }
			setIsSuccess(true);
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