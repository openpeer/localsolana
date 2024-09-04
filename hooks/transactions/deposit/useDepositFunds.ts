import { PublicKey, Connection, clusterApiUrl  } from '@solana/web3.js';
//import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { UseDepositFundsProps } from '../types';
import useDepositWithGas from './useDepositWithGas';
import useGaslessDepositFunds from './useGaslessDepositFunds';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

const useDepositFunds = ({ amount, token, contract }: UseDepositFundsProps) => {
    const nativeToken = token.address === PublicKey.default.toBase58();
    const connection = new Connection(clusterApiUrl('mainnet-beta')); // Adjust the cluster as needed
    const { primaryWallet } = useDynamicContext();

    const withGasCall = useDepositWithGas({
        contract,
        amount,
        token
    });

    const { gaslessEnabled, isFetching, isLoading, isSuccess, data, depositFunds } = useGaslessDepositFunds({
        amount,
        contract,
        token
    });

    if (isFetching || !primaryWallet?.address) {
        return { isLoading: false, isSuccess: false, isFetching };
    }

    if (!nativeToken && gaslessEnabled) {
        return { isLoading, isSuccess, data, depositFunds };
    }

    return withGasCall;
};

export default useDepositFunds;