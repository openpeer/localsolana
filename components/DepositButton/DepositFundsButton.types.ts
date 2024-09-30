import { Token } from 'models/types';

export interface DepositFundsParams {
	token: Token;
	tokenAmount: number;
	contract: string;
	disabled?: boolean;
	onFundsDeposited: () => void; 

}
