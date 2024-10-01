//import { DEPLOYER_CONTRACTS, FULL_GASLESS_CHAINS } from 'models/networks';

//import useDeployWithGas from './useDeployWithGas';
import useGaslessDeploy from './useGaslessDeploy';

const useDeploy = () => {
	//const { chain } = useNetwork();
	const contract = 'DEPLOYER_CONTRACTS[chain?.id!]';//todo change with solana contract

	// const withGasCall = useDeployWithGas({
	// 	contract
	// });

	const { gaslessEnabled, isFetching, isLoading, isSuccess, data, deploy } = useGaslessDeploy();

	if (isFetching) {
		return { isLoading: false, isSuccess: false, isFetching };
	}

	if (gaslessEnabled) {
		return { isLoading, isSuccess, data, deploy };
	}

	//return withGasCall;
};

export default useDeploy;
