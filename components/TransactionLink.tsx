import React, { useState, useEffect } from 'react';
import { Connection } from '@solana/web3.js';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { NEXT_PUBLIC_BLOCK_EXPLORER_URL as BLOCK_EXPLORER, NEXT_PUBLIC_SOLANA_NETWORK as CURRENT_NETWORK } from '@/utils';

const TransactionLink = ({ hash = '' }: { hash: string | undefined }) => {
    const [url, setUrl] = useState<string | null>(null);
    const explorerUrl = BLOCK_EXPLORER || 'https://solscan.io'; // Provide a default fallback

    useEffect(() => {
        if (hash) {
            setUrl(`${explorerUrl}/tx/${hash}`);
        }
    }, [hash, explorerUrl]);

    if (!hash) return <>Done</>;

    return (
        <a href={url??''} target="_blank" rel="noreferrer">
            Done. View on {explorerUrl.split('//')[1]}
        </a>
    );
};

export default TransactionLink;