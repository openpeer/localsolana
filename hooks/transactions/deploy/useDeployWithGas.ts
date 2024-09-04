import { PublicKey, Connection, clusterApiUrl, Transaction, SystemProgram } from '@solana/web3.js';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useState, useEffect } from 'react';

interface UseDeployWithGasProps {
    contract: string;
}

const useDeployWithGas = ({ contract }: UseDeployWithGasProps) => {
    const { primaryWallet } = useDynamicContext();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [transactionSignature, setTransactionSignature] = useState<string | null>(null);

    const connection = new Connection(clusterApiUrl('mainnet-beta')); // Adjust the cluster as needed

    const deploy = async () => {
        if (!primaryWallet?.address) return;

        setIsLoading(true);

        try {
            const transaction = new Transaction().add(
                SystemProgram.createAccount({
                    fromPubkey: new PublicKey(primaryWallet.address),
                    newAccountPubkey: new PublicKey(contract),
                    lamports: await connection.getMinimumBalanceForRentExemption(0), // Adjust the space as needed
                    space: 0, // Adjust the space as needed
                    programId: new PublicKey(contract) // Adjust the program ID as needed
                })
            );

            //const signedTransaction = await primaryWallet.signTransaction(transaction);
            //const signature = await connection.sendRawTransaction(signedTransaction.serialize());

            //setTransactionSignature(signature);
			//todo add shyft sdk for siging
            setIsSuccess(true);
        } catch (error) {
            console.error('Deployment failed', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (transactionSignature) {
            const checkTransactionStatus = async () => {
                const status = await connection.getSignatureStatus(transactionSignature);
                if (status?.value?.confirmationStatus === 'confirmed') {
                    setIsSuccess(true);
                }
            };

            checkTransactionStatus();
        }
    }, [transactionSignature]);

    return { isLoading, isSuccess, deploy, data: transactionSignature, isFetching: false };
};

export default useDeployWithGas;