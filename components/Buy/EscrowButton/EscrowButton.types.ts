import { Token } from 'models/types';

export interface EscrowFundsParams {
	uuid: string;
	buyer: string;
	seller: string;
	token: Token;
	tokenAmount: number;
	instantEscrow: boolean;
	sellerWaitingTime: number;
}

export interface EscrowFundsButtonProps extends EscrowFundsParams {
	fee: bigint;
	contract: string;
}
