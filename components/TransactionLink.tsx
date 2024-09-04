import React from 'react';
import { Connection } from '@solana/web3.js';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';


const TransactionLink = async ({ hash }: { hash: string | undefined }) => {
    const connection = useDynamicContext();
	if (!hash) return <>Done</>;
    connection.primaryWallet?.network
    //href={`${etherscan?.url || url}/tx/${hash}`}
    //{etherscan?.name || name}
	return (
		<a target="_blank" rel="noreferrer" >
			<>Done. View on { connection.primaryWallet?.network}</>
		</a>
	);
};

export default TransactionLink;
