import { Token } from 'models/types';
import { UIOrder } from '../Buy.types';

export interface EscrowFundsParams {
	uuid: string;
	buyer: string;
	seller: string;
	token: Token;
	tokenAmount: number;
	instantEscrow: boolean;
	sellerWaitingTime: number;
	tradeID:string;
}

export interface EscrowFundsButtonProps extends EscrowFundsParams {
	fee: number;
	contract: string;
}
