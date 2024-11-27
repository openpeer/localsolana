import { PublicKey, Connection, Transaction, SystemProgram } from '@solana/web3.js';
import { useState, useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { UseDepositFundsProps } from '../types';
//import { Shyft } from '@shyft-to/js';

const useDepositWithGas = ({ amount, token, contract }: UseDepositFundsProps) => {
    const { address } = token;
    const nativeToken = address === PublicKey.default.toBase58();
    const { primaryWallet } = useDynamicContext();
    const connection = new Connection(process.env.NEXT_PUBLIC_SHYFT_MAINNET_RPC as string);

    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [data, setData] = useState<{ hash?: string }>({});

    //const shyft = new Shyft({ Key: 'YOUR_SHYFT_API_KEY' }); // Replace with your Shyft API key

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
            //const serializedTransaction = signedTransaction.serialize();

            //const response = await shyft.sendTransaction(serializedTransaction);

            // if (response.success) {
            //     setIsSuccess(true);
            //     setData({ hash: response.txId });
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

    return { isLoading, isSuccess, depositFunds, data, isFetching: false };
};

export default useDepositWithGas;