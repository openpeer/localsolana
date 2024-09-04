import Button from 'components/Button/Button';
import TransactionLink from 'components/TransactionLink';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { PublicKey, Connection, clusterApiUrl, Transaction, SystemProgram } from '@solana/web3.js';
import React, { useEffect, useState } from 'react';

const ApproveTokenButton = ({
    token,
    spender,
    amount,
    onApprovalChange
}: {
    token: { address: string; symbol: string };
    spender: string;
    amount: bigint;
    onApprovalChange: (approved: boolean) => void;
}) => {
    const { primaryWallet } = useDynamicContext();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [allowance, setAllowance] = useState<bigint | null>(null);

    const connection = new Connection(clusterApiUrl('mainnet-beta')); // Adjust the cluster as needed

    const approveToken = async () => {
        if (!primaryWallet?.address) return;

        setIsLoading(true);

        try {
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: new PublicKey(primaryWallet.address),
                    toPubkey: new PublicKey(spender),
                    lamports: Number(amount) // Adjust the amount as needed
                })
            );

           // const signature = await primaryWallet.sign(transaction);
           // await connection.sendRawTransaction(signature.serialize());

            setIsSuccess(true);
        } catch (error) {
            console.error('Approval failed', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const fetchAllowance = async () => {
            if (!primaryWallet?.address) return;

            // Fetch the allowance from the Solana blockchain
            // This is a placeholder, replace with actual logic to fetch allowance
            const fetchedAllowance = BigInt(0); // Replace with actual fetched allowance
            setAllowance(fetchedAllowance);
        };

        fetchAllowance();
    }, [primaryWallet?.address]);

    const approved = !!allowance && !!amount && allowance >= amount;

    useEffect(() => {
        onApprovalChange(isSuccess || approved);
    }, [isSuccess, approved]);

    return (
        <Button
            title={isLoading ? 'Processing...' : isSuccess ? 'Done' : `Approve ${token.symbol}`}
            onClick={approveToken}
            processing={isLoading}
            disabled={isSuccess || isLoading}
        />
    );
};

export default ApproveTokenButton;