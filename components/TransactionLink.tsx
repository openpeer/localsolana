import React, { useState, useEffect } from 'react';
import { Connection } from '@solana/web3.js';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { BLOCK_EXPLORER, CURRENT_NETWORK } from '@/utils';

const TransactionLink = ({ hash = '' }: { hash: string | undefined | null }) => {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        if (hash && hash!=null) {
            // Perform any asynchronous operations here if needed
            setUrl(`${BLOCK_EXPLORER[0]}/tx/${hash}?cluster=${CURRENT_NETWORK}`);
        }
    }, [hash]);

    if (!hash) return <>Done</>;

    return (
        <a href={url??''} target="_blank" rel="noreferrer">
            <>Done. View on {BLOCK_EXPLORER[0]}</>
        </a>
    );
};

export default TransactionLink;