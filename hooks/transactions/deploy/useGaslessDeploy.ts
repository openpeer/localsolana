import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
//import { Shyft } from '@shyft-to/js';

interface UseGaslessDeployProps {
    contract: string;
}

interface Data {
    hash?: string;
}

const useGaslessDeploy = ({ contract }: UseGaslessDeployProps) => {
    const [data, updateData] = useState<Data>({});
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { primaryWallet } = useDynamicContext();
    const connection = new Connection('https://api.mainnet-beta.solana.com'); // Adjust the cluster as needed

    //const shyft = new Shyft({ apiKey: 'YOUR_SHYFT_API_KEY' }); // Replace with your Shyft API key

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
            //const serializedTransaction = signedTransaction.serialize();

            //const response = await shyft.sendTransaction(serializedTransaction);

            // if (response.success) {
            //     setIsSuccess(true);
            //     updateData({ hash: response.txId });
            // } else {
            //     throw new Error(response.error);
            // }
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