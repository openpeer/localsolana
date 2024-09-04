import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
//import { useAccount as useWagmiAccount } from 'wagmi';

const useAccount = () => {
	//const { primaryWallet, isConnected, isConnecting, connector } = useDynamicContext();
	const { primaryWallet,isAuthenticated } = useDynamicContext();

	return {
		address: (primaryWallet?.address as string | undefined),
		isAuthenticated: isAuthenticated
	};
};

export default useAccount;
