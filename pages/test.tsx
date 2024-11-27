// pages/test.tsx

import React, { useEffect, useState } from 'react';
import useHelius from '@/hooks/transactions/useHelius';
import { Network } from '@shyft-to/js';
import { UIList } from 'components/Listing/Listing.types';
import { List, Token } from 'models/types';
import snakecaseKeys from 'snakecase-keys';
import { useContractRead } from '@/hooks/transactions/useContractRead';

// Utility functions
export const smallWalletAddress = (address: string, length = 4): string =>
    `${address.substring(0, length)}..${address.substring(address.length - length)}`;

export const truncate = (num: number, places: number) => Math.trunc(num * 10 ** places) / 10 ** places;

export const DEFAULT_MARGIN_TYPE: List['margin_type'] = 'fixed';
export const DEFAULT_MARGIN_VALUE = 1;
export const DEFAULT_DEPOSIT_TIME_LIMIT = 60;
export const DEFAULT_PAYMENT_TIME_LIMIT = 1440;
export const DEFAULT_ESCROW_TYPE: List['escrow_type'] = 'instant';

export const listToMessage = (list: UIList): string => {
    const { type, token, currency, totalAvailableAmount, margin = 1, marginType, paymentMethods } = list;
    const action = type === 'BuyList' ? 'Buying' : 'Selling';
    const price =
        marginType === 'fixed'
            ? `${currency?.name} ${margin.toFixed(2)} per ${token?.name}`
            : `Market price ${margin > 0 ? '+' : '-'} ${Math.abs(margin).toFixed(2)}%`;

    return JSON.stringify(
        snakecaseKeys(
            {
                network: 'Solana',
                token: `${action} ${(token as Token).symbol}`,
                currency: currency?.name,
                total: totalAvailableAmount,
                price,
                'Payment Methods': paymentMethods.map((p) => p.bank?.name).join(', ')
            },
            { deep: true }
        ),
        undefined,
        4
    );
};

// Hook and rendering logic for test page
const TestPage = () => {
    const { connection, getConnectionDetails } = useHelius();
    const [contractAddress, setContractAddress] = useState<string | null>(null);
    const { data, loadingContract, error } = useContractRead(contractAddress || '', 'escrowState', true);

    useEffect(() => {
        // Fetch the contract address from your source
        const fetchContractAddress = async () => {
            // Replace this with your logic to fetch the contract address
            const fetchedAddress = 'AczLKrdS6hFGNoTWg9AaS9xhuPfZgVTPxL2W8XzZMDjH'; // Replace with actual logic
            console.log('Fetched contract address:', fetchedAddress);
            setContractAddress(fetchedAddress);
        };

        fetchContractAddress();
    }, []);

    // Dynamically fetch connection details if connection exists
    const connectionDetails = connection ? getConnectionDetails() : null;

    return (
        <div>
            <h1>Test Page</h1>
            {connectionDetails ? (
                <>
                    <p>
                        <strong>RPC Endpoint:</strong> {connectionDetails.CURRENT_NETWORK_URL}
                    </p>
                    <p>
                        <strong>Block Explorer:</strong> {connectionDetails.BLOCK_EXPLORER.join(', ')}
                    </p>
                    <p>
                        <strong>Network:</strong> {connectionDetails.CURRENT_NETWORK}
                    </p>
                </>
            ) : (
                <p>Connection not initialized</p>
            )}

            {/* Example rendering a formatted message */}
            <div>
                <h2>Example List Message</h2>
                <pre>
                    {listToMessage({
                        type: 'BuyList',
                        token: { symbol: 'SOL' },
                        currency: { name: 'USD' },
                        totalAvailableAmount: 10,
                        margin: 2,
                        marginType: 'fixed',
                        paymentMethods: [{ bank: { name: 'Bank A' } }]
                    })}
                </pre>
            </div>

            {/* Display contract data */}
            <div>
                <h2>Contract Data</h2>
                {loadingContract ? (
                    <p>Loading contract data...</p>
                ) : error ? (
                    <p>Error: {error}</p>
                ) : (
                    <pre className="break-all">{JSON.stringify(data, null, 2)}</pre>
                )}
            </div>
        </div>
    );
};

export default TestPage;