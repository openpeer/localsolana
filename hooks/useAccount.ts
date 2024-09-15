import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
//import { useAccount as useWagmiAccount } from 'wagmi';

const useAccount = () => {
	//const { primaryWallet, isConnected, isConnecting, connector } = useDynamicContext();
	const { primaryWallet} = useDynamicContext();

	return {
		address: (primaryWallet?.address as string | undefined),
		isAuthenticated: primaryWallet?.isAuthenticated,
		isConnected: primaryWallet?.isConnected,
		connetor: primaryWallet?.connector
	};
};

export default useAccount;
