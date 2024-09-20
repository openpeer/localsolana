import { Token } from 'models/types';

export interface UseEscrowTransactionProps {
	contract: string;
	orderID: string;
	buyer: string;
	amount: number;
	token: Token;
	seller: string;
}

export interface UseGaslessEscrowFundsProps extends UseEscrowTransactionProps {
	instantEscrow: boolean;
	sellerWaitingTime: number; // in seconds
}

export interface UseEscrowFundsProps extends UseEscrowTransactionProps {
	instantEscrow: boolean;
	sellerWaitingTime: number; // in seconds
	fee: bigint;
}

export interface UseOpenDisputeProps extends UseEscrowTransactionProps {
	disputeFee: bigint | undefined;
}

export interface UseEscrowCancelProps extends UseEscrowTransactionProps {
	isBuyer: boolean;
}

export interface UseDepositFundsProps {
	amount: number;
	token: Token;
	contract: string;
}

export interface UseWithdrawFundsProps {
	amount: bigint;
	token: Token;
	contract: string;
}
