// import { constants } from 'ethers';

import { PublicKey } from '@solana/web3.js';
import { UseEscrowFundsProps } from '../types';
//import useEscrowWithGas from './useEscrowWithGas';
import useGaslessEscrow from './useGaslessEscrow';

const useEscrowFunds = ({
	orderID,
	buyer,
	amount,
	token,
	fee,
	seller,
	contract,
	instantEscrow,
	sellerWaitingTime
}: UseEscrowFundsProps) => {
	//const nativeToken = token.address === PublicKey.default.toBase58();;

	// const withGasCall = useEscrowWithGas({
	// 	orderID,
	// 	contract,
	// 	buyer,
	// 	amount,
	// 	token,
	// 	fee,
	// 	instantEscrow,
	// 	sellerWaitingTime
	// });

	const { gaslessEnabled, isFetching, isLoading, isSuccess, data, escrowFunds } = useGaslessEscrow({
		amount,
		buyer,
		contract,
		orderID,
		token,
		instantEscrow,
		sellerWaitingTime,seller
	});

	if (isFetching) {
		return { isLoading: false, isSuccess: false, isFetching };
	}

	// gasless enabled on Biconomy
	// polygon or mumbai deploy gasless non native tokens or instant escrows (no tokens transferred to escrow contract)
	// other chains: deploy gasless if instant escrow (no tokens transferred to escrow contract)

	if (gaslessEnabled) {
		return { isLoading, isSuccess, data, escrowFunds };
	}

	return null;
};

export default useEscrowFunds;
