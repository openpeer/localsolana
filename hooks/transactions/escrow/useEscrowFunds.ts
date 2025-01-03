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
	// Add validation from stub version
	const canCreateEscrow = orderID && seller && buyer;

	const { gaslessEnabled, isFetching, isLoading, isSuccess, data, escrowFunds } = useGaslessEscrow({
		amount,
		buyer,
		contract,
		orderID,
		token,
		instantEscrow,
		sellerWaitingTime,
		seller
	});

	if (isFetching) {
		return { isLoading: false, isSuccess: false, isFetching, canCreateEscrow };
	}

	if (gaslessEnabled) {
		return { isLoading, isSuccess, data, escrowFunds, canCreateEscrow };
	}

	return null;
};

export default useEscrowFunds;
